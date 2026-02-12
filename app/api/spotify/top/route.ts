import { NextRequest, NextResponse } from "next/server";

import {
  fetchSpotifyTopData,
  getCookieSecurity,
  getSpotifyConfig,
  refreshAccessToken,
  spotifyCookieNames,
  type SpotifyTopPayload
} from "@/lib/spotify";

type TopRoutePayload = SpotifyTopPayload & {
  reason?: string;
  mode?: "owner" | "cookie" | "none";
};

type OwnerCache = {
  payload: SpotifyTopPayload | null;
  fetchedAt: number;
  nextRetryAt: number;
};

const EMPTY_RESPONSE: TopRoutePayload = {
  connected: false,
  artists: [],
  tracks: [],
  profile: null,
  mode: "none"
};

const OWNER_CACHE_TTL_MS = 1000 * 60 * 10;
const OWNER_DEFAULT_BACKOFF_MS = 1000 * 60 * 2;

const ownerCache: OwnerCache = {
  payload: null,
  fetchedAt: 0,
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
  return Math.max(Number(match[1]) * 1000, OWNER_DEFAULT_BACKOFF_MS);
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

function clearSpotifyCookies(response: NextResponse) {
  response.cookies.set(spotifyCookieNames.accessToken, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.refreshToken, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.expiresAt, "", { path: "/", maxAge: 0 });
}

async function refreshIfPossible(request: NextRequest, refreshToken: string) {
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
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    secure: getCookieSecurity(request),
    expiresIn: Math.max(tokens.expires_in - 60, 60)
  };
}

function attachTokenCookies(
  response: NextResponse,
  tokenData: { accessToken: string; refreshToken: string; expiresAt: number; secure: boolean; expiresIn: number }
) {
  response.cookies.set(spotifyCookieNames.accessToken, tokenData.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: tokenData.secure,
    path: "/",
    maxAge: tokenData.expiresIn
  });
  response.cookies.set(spotifyCookieNames.refreshToken, tokenData.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: tokenData.secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 180
  });
  response.cookies.set(spotifyCookieNames.expiresAt, String(tokenData.expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: tokenData.secure,
    path: "/",
    maxAge: tokenData.expiresIn
  });
}

export async function GET(request: NextRequest) {
  const ownerRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();
  let ownerFailureReason: string | null = null;
  if (ownerRefreshToken) {
    const now = Date.now();
    const ownerCacheFresh = ownerCache.payload && now - ownerCache.fetchedAt < OWNER_CACHE_TTL_MS;
    if (ownerCacheFresh) {
      const payload = ownerCachePayload();
      if (!payload) {
        return responseWithPayload(disconnected("owner_cache_missing"), "no-store");
      }
      return responseWithPayload(
        payload,
        "public, s-maxage=60, stale-while-revalidate=300"
      );
    }

    const ownerInBackoff = now < ownerCache.nextRetryAt;
    if (ownerInBackoff && ownerCache.payload) {
      const payload = ownerCachePayload();
      if (!payload) {
        return responseWithPayload(disconnected("owner_cache_missing"), "no-store");
      }
      return responseWithPayload(
        payload,
        "public, s-maxage=30, stale-while-revalidate=300"
      );
    }

    const ownerTokenData = await refreshIfPossible(request, ownerRefreshToken);
    if (!ownerTokenData) {
      ownerFailureReason = "owner_refresh_failed";
      if (ownerCache.payload) {
        const payload = ownerCachePayload();
        if (!payload) {
          return responseWithPayload(disconnected("owner_cache_missing"), "no-store");
        }
        return responseWithPayload(
          payload,
          "public, s-maxage=30, stale-while-revalidate=300"
        );
      }
    } else {
      const ownerResult = await fetchSpotifyTopData(ownerTokenData.accessToken);
      if (ownerResult.ok) {
        ownerCache.payload = ownerResult.payload;
        ownerCache.fetchedAt = now;
        ownerCache.nextRetryAt = 0;
        return responseWithPayload({
          ...ownerResult.payload,
          mode: "owner"
        }, "public, s-maxage=60, stale-while-revalidate=300");
      }
      ownerFailureReason = `owner_fetch_failed:${ownerResult.reason}`;
      if (isRateLimited(ownerResult.reason)) {
        ownerCache.nextRetryAt = now + getRetryDelayMs(ownerResult.reason);
      }
      if (ownerCache.payload) {
        const payload = ownerCachePayload();
        if (!payload) {
          return responseWithPayload(disconnected("owner_cache_missing"), "no-store");
        }
        return responseWithPayload(
          payload,
          "public, s-maxage=30, stale-while-revalidate=300"
        );
      }
    }
  }

  let accessToken = request.cookies.get(spotifyCookieNames.accessToken)?.value ?? null;
  const refreshToken = request.cookies.get(spotifyCookieNames.refreshToken)?.value ?? null;
  const expiresAtRaw = request.cookies.get(spotifyCookieNames.expiresAt)?.value ?? null;
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  const shouldRefresh = !accessToken || !expiresAt || Date.now() >= expiresAt - 60_000;

  let refreshedCookieData:
    | {
        accessToken: string;
        refreshToken: string;
        expiresAt: number;
        secure: boolean;
        expiresIn: number;
      }
    | null = null;

  if (shouldRefresh) {
    if (!refreshToken) {
      const response = responseWithPayload(disconnected(ownerFailureReason ?? "no_refresh_token", "none"));
      clearSpotifyCookies(response);
      return response;
    }
    refreshedCookieData = await refreshIfPossible(request, refreshToken);
    if (!refreshedCookieData) {
      const response = responseWithPayload(disconnected(ownerFailureReason ?? "cookie_refresh_failed", "none"));
      clearSpotifyCookies(response);
      return response;
    }
    accessToken = refreshedCookieData.accessToken;
  }

  if (!accessToken) {
    const response = responseWithPayload(disconnected(ownerFailureReason ?? "no_access_token", "none"));
    clearSpotifyCookies(response);
    return response;
  }

  const payloadResult = await fetchSpotifyTopData(accessToken);
  if (!payloadResult.ok) {
    if (!refreshToken) {
      const response = responseWithPayload(
        disconnected(ownerFailureReason ?? `cookie_fetch_failed:${payloadResult.reason}`, "none")
      );
      clearSpotifyCookies(response);
      return response;
    }
    refreshedCookieData = await refreshIfPossible(request, refreshToken);
    if (!refreshedCookieData) {
      const response = responseWithPayload(disconnected(ownerFailureReason ?? "cookie_refresh_failed", "none"));
      clearSpotifyCookies(response);
      return response;
    }
    const retried = await fetchSpotifyTopData(refreshedCookieData.accessToken);
    if (!retried.ok) {
      const response = responseWithPayload(
        disconnected(ownerFailureReason ?? `cookie_fetch_failed:${retried.reason}`, "none")
      );
      clearSpotifyCookies(response);
      return response;
    }
    const response = responseWithPayload({
      ...retried.payload,
      mode: "cookie"
    });
    attachTokenCookies(response, refreshedCookieData);
    return response;
  }

  const response = responseWithPayload({
    ...payloadResult.payload,
    mode: "cookie"
  });
  if (refreshedCookieData) {
    attachTokenCookies(response, refreshedCookieData);
  }
  return response;
}
