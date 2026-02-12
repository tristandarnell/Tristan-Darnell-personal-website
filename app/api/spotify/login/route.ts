import { NextRequest, NextResponse } from "next/server";

import { getCookieSecurity, getSpotifyRedirectUri, spotifyCookieNames } from "@/lib/spotify";

const SPOTIFY_SCOPE = "user-top-read user-read-private";

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/?spotify_error=missing_client_id", request.url));
  }

  const setupMode = request.nextUrl.searchParams.get("setup") === "1";
  const state = crypto.randomUUID();
  const redirectUri = getSpotifyRedirectUri(request);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPE,
    redirect_uri: redirectUri,
    state
  });
  if (setupMode) {
    params.set("show_dialog", "true");
  }

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  response.cookies.set(spotifyCookieNames.state, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getCookieSecurity(request),
    path: "/",
    maxAge: 60 * 10
  });
  response.cookies.set(spotifyCookieNames.setupMode, setupMode ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: getCookieSecurity(request),
    path: "/",
    maxAge: 60 * 10
  });

  return response;
}
