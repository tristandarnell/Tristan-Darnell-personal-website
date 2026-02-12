import { NextRequest, NextResponse } from "next/server";

import {
  exchangeCodeForTokens,
  getCookieSecurity,
  getSpotifyConfig,
  getSpotifyRedirectUri,
  spotifyCookieNames
} from "@/lib/spotify";

function clearSpotifyCookies(response: NextResponse) {
  response.cookies.set(spotifyCookieNames.state, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.accessToken, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.refreshToken, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.expiresAt, "", { path: "/", maxAge: 0 });
}

export async function GET(request: NextRequest) {
  const config = getSpotifyConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(spotifyCookieNames.state)?.value;
  const response = NextResponse.redirect(new URL("/", request.url));

  if (!config || !code || !state || !expectedState || expectedState !== state) {
    clearSpotifyCookies(response);
    return response;
  }

  const redirectUri = getSpotifyRedirectUri(request);
  const tokens = await exchangeCodeForTokens({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    code,
    redirectUri
  });

  if (!tokens) {
    clearSpotifyCookies(response);
    return response;
  }

  const secure = getCookieSecurity(request);
  response.cookies.set(spotifyCookieNames.state, "", { path: "/", maxAge: 0 });
  response.cookies.set(spotifyCookieNames.accessToken, tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: Math.max(tokens.expires_in - 60, 60)
  });
  response.cookies.set(spotifyCookieNames.expiresAt, String(Date.now() + tokens.expires_in * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: Math.max(tokens.expires_in - 60, 60)
  });

  if (tokens.refresh_token) {
    response.cookies.set(spotifyCookieNames.refreshToken, tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 180
    });
  }

  return response;
}
