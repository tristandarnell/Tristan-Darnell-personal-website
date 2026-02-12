import { NextRequest, NextResponse } from "next/server";

import { getCookieSecurity, getSpotifyConfig, getSpotifyRedirectUri, spotifyCookieNames } from "@/lib/spotify";

const SPOTIFY_SCOPE = "user-top-read user-read-private";

export async function GET(request: NextRequest) {
  const config = getSpotifyConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/?spotify_error=missing_config", request.url));
  }

  const state = crypto.randomUUID();
  const redirectUri = getSpotifyRedirectUri(request);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    scope: SPOTIFY_SCOPE,
    redirect_uri: redirectUri,
    state
  });

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  response.cookies.set(spotifyCookieNames.state, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getCookieSecurity(request),
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
