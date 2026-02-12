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

const EMPTY_RESPONSE: TopRoutePayload = {
  connected: false,
  artists: [],
  tracks: [],
  profile: null,
  mode: "none"
};

function disconnected(reason: string, mode: TopRoutePayload["mode"] = "none"): TopRoutePayload {
  return {
    ...EMPTY_RESPONSE,
    reason,
    mode
  };
}

function responseWithPayload(payload: TopRoutePayload) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
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
    const ownerTokenData = await refreshIfPossible(request, ownerRefreshToken);
    if (!ownerTokenData) {
      ownerFailureReason = "owner_refresh_failed";
    } else {
      const ownerPayload = await fetchSpotifyTopData(ownerTokenData.accessToken);
      if (ownerPayload) {
        return responseWithPayload({
          ...ownerPayload,
          mode: "owner"
        });
      }
      ownerFailureReason = "owner_fetch_failed";
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

  const payload = await fetchSpotifyTopData(accessToken);
  if (!payload) {
    if (!refreshToken) {
      const response = responseWithPayload(disconnected(ownerFailureReason ?? "cookie_fetch_failed", "none"));
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
    if (!retried) {
      const response = responseWithPayload(disconnected(ownerFailureReason ?? "cookie_fetch_failed", "none"));
      clearSpotifyCookies(response);
      return response;
    }
    const response = responseWithPayload({
      ...retried,
      mode: "cookie"
    });
    attachTokenCookies(response, refreshedCookieData);
    return response;
  }

  const response = responseWithPayload({
    ...payload,
    mode: "cookie"
  });
  if (refreshedCookieData) {
    attachTokenCookies(response, refreshedCookieData);
  }
  return response;
}
