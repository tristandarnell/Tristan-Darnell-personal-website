import { NextRequest, NextResponse } from "next/server";

import {
  fetchSpotifyTopData,
  getSpotifyConfig,
  refreshAccessToken,
  type SpotifyTopPayload
} from "@/lib/spotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TopRoutePayload = SpotifyTopPayload & {
  reason?: string;
  mode?: "owner" | "none";
};

type OwnerCache = {
  payload: SpotifyTopPayload | null;
  expiresAt: number;
  staleUntil: number;
  nextRetryAt: number;
};

const EMPTY_RESPONSE: TopRoutePayload = {
  connected: false,
  artists: [],
  tracks: [],
  profile: null,
  mode: "none"
};

const OWNER_CACHE_TTL_MS = 1000 * 60 * 15;
const OWNER_STALE_TTL_MS = 1000 * 60 * 60 * 24;
const OWNER_DEFAULT_BACKOFF_MS = 1000 * 60 * 2;

const ownerCache: OwnerCache = {
  payload: null,
  expiresAt: 0,
  staleUntil: 0,
  nextRetryAt: 0
};

function disconnected(reason: string, mode: TopRoutePayload["mode"] = "none"): TopRoutePayload {
  return {
    ...EMPTY_RESPONSE,
    reason,
    mode
  };
}

function responseWithPayload(payload: TopRoutePayload, cacheControl = "no-store") {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": cacheControl
    }
  });
}

function isRateLimited(reason: string | null) {
  return Boolean(reason?.includes(":429"));
}

function getRetryDelayMs(reason: string | null) {
  const match = reason?.match(/retry_after=(\d+)/);
  if (!match) {
    return OWNER_DEFAULT_BACKOFF_MS;
  }
  const raw = Number(match[1]);
  if (!Number.isFinite(raw) || raw <= 0) {
    return OWNER_DEFAULT_BACKOFF_MS;
  }

  // Spotify docs describe seconds, but some responses return millisecond-like values.
  // Heuristic: small values are seconds; large values are already milliseconds.
  const asMs = raw <= 180 ? raw * 1000 : raw;
  return Math.min(Math.max(asMs, 15_000), 15 * 60 * 1000);
}

function ownerCachePayload(): TopRoutePayload | null {
  if (!ownerCache.payload) {
    return null;
  }
  return {
    ...ownerCache.payload,
    mode: "owner"
  };
}

async function refreshIfPossible(refreshToken: string) {
  const config = getSpotifyConfig();
  if (!config) {
    return null;
  }

  const tokens = await refreshAccessToken({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken
  });

  if (!tokens) {
    return null;
  }

  return {
    accessToken: tokens.access_token
  };
}

export async function GET(request: NextRequest) {
  void request;
  const ownerRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();
  if (!ownerRefreshToken) {
    return responseWithPayload(disconnected("owner_refresh_token_missing", "none"), "no-store");
  }

  const now = Date.now();
  if (ownerCache.payload && now < ownerCache.expiresAt) {
    const payload = ownerCachePayload();
    if (!payload) {
      return responseWithPayload(disconnected("owner_cache_missing", "owner"), "no-store");
    }
    return responseWithPayload(payload, "public, s-maxage=120, stale-while-revalidate=1800");
  }

  if (now < ownerCache.nextRetryAt) {
    const payload = ownerCachePayload();
    if (payload) {
      return responseWithPayload(payload, "public, s-maxage=60, stale-while-revalidate=1800");
    }
    return responseWithPayload(disconnected("owner_rate_limited_backoff", "owner"), "public, s-maxage=60");
  }

  const ownerTokenData = await refreshIfPossible(ownerRefreshToken);
  if (!ownerTokenData) {
    const payload = ownerCachePayload();
    if (payload && now < ownerCache.staleUntil) {
      return responseWithPayload(payload, "public, s-maxage=60, stale-while-revalidate=1800");
    }
    return responseWithPayload(disconnected("owner_refresh_failed", "owner"), "no-store");
  }

  const ownerResult = await fetchSpotifyTopData(ownerTokenData.accessToken);
  if (ownerResult.ok) {
    ownerCache.payload = ownerResult.payload;
    ownerCache.expiresAt = now + OWNER_CACHE_TTL_MS;
    ownerCache.staleUntil = now + OWNER_STALE_TTL_MS;
    ownerCache.nextRetryAt = 0;
    return responseWithPayload(
      {
        ...ownerResult.payload,
        mode: "owner"
      },
      "public, s-maxage=120, stale-while-revalidate=1800"
    );
  }

  const failureReason = `owner_fetch_failed:${ownerResult.reason}`;
  if (isRateLimited(ownerResult.reason)) {
    ownerCache.nextRetryAt = now + getRetryDelayMs(ownerResult.reason);
  }

  const payload = ownerCachePayload();
  if (payload && now < ownerCache.staleUntil) {
    return responseWithPayload(payload, "public, s-maxage=60, stale-while-revalidate=1800");
  }

  return responseWithPayload(disconnected(failureReason, "owner"), "public, s-maxage=60");
}
