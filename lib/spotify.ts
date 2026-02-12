import type { NextRequest } from "next/server";

const ACCOUNTS_BASE_URL = "https://accounts.spotify.com";
const API_BASE_URL = "https://api.spotify.com/v1";
const TOP_ARTISTS_LIMIT = 5;
const TOP_TRACKS_LIMIT = 5;
const TOP_RANGE = "medium_term";
const ARTISTS_LOOKUP_BATCH_SIZE = 50;
const SPOTIFY_ARTIST_IMAGE_FALLBACKS: Record<string, string> = {
  "dominic fike": "/images/spotify-fallback-dominic-fike.svg",
  "kanye west": "/images/spotify-fallback-kanye-west.svg",
  "the weeknd": "/images/spotify-fallback-the-weeknd.svg",
  "don toliver": "/images/spotify-fallback-don-toliver.svg",
  "mac miller": "/images/spotify-fallback-mac-miller.svg"
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type TopArtistsResponse = {
  items: Array<{
    id: string;
    name: string;
    external_urls?: { spotify?: string };
    images?: Array<{ url: string }>;
  }>;
};

type TopTracksResponse = {
  items: Array<{
    id: string;
    name: string;
    external_urls?: { spotify?: string };
    artists: Array<{ name: string }>;
  }>;
};

type UserProfileResponse = {
  display_name?: string;
  external_urls?: { spotify?: string };
};

type ArtistsLookupResponse = {
  artists: Array<{
    id: string;
    images?: Array<{ url: string }>;
  }>;
};

export type SpotifyTopPayload = {
  connected: boolean;
  artists: Array<{
    id: string;
    name: string;
    image: string | null;
    url: string;
  }>;
  tracks: Array<{
    id: string;
    name: string;
    artists: string[];
    url: string;
  }>;
  profile: {
    displayName: string;
    url: string;
  } | null;
};

export type SpotifyTopFetchResult =
  | {
      ok: true;
      payload: SpotifyTopPayload;
    }
  | {
      ok: false;
      reason: string;
    };

export const spotifyCookieNames = {
  state: "spotify_auth_state",
  setupMode: "spotify_auth_setup",
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expiresAt: "spotify_expires_at"
} as const;

export function getSpotifyRedirectUri(request: NextRequest): string {
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI;
  }
  return `${request.nextUrl.origin}/api/spotify/callback`;
}

export function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

export function getCookieSecurity(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

function authHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export async function exchangeCodeForTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<TokenResponse | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri
  });

  const tokenResponse = await fetch(`${ACCOUNTS_BASE_URL}/api/token`, {
    method: "POST",
    headers: {
      Authorization: authHeader(params.clientId, params.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!tokenResponse.ok) {
    return null;
  }

  return (await tokenResponse.json()) as TokenResponse;
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenResponse | null> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken
  });

  const tokenResponse = await fetch(`${ACCOUNTS_BASE_URL}/api/token`, {
    method: "POST",
    headers: {
      Authorization: authHeader(params.clientId, params.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!tokenResponse.ok) {
    return null;
  }

  return (await tokenResponse.json()) as TokenResponse;
}

async function parseSpotifyError(response: Response, fallback: string): Promise<string> {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterPart = retryAfter ? `:retry_after=${retryAfter}` : "";

  try {
    const json = (await response.json()) as { error?: { message?: string } | string };
    if (typeof json.error === "string" && json.error) {
      return `${fallback}:${response.status}:${json.error}${retryAfterPart}`;
    }
    if (typeof json.error === "object" && json.error?.message) {
      return `${fallback}:${response.status}:${json.error.message}${retryAfterPart}`;
    }
  } catch {
    // Ignore parse errors and return fallback.
  }
  return `${fallback}:${response.status}${retryAfterPart}`;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function normalizeArtistName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getArtistFallbackImage(artistName: string) {
  return SPOTIFY_ARTIST_IMAGE_FALLBACKS[normalizeArtistName(artistName)] ?? null;
}

async function fetchArtistImagesByIds(accessToken: string, artistIds: string[]) {
  const uniqueIds = Array.from(new Set(artistIds.filter(Boolean)));
  const imageByArtistId = new Map<string, string>();
  if (!uniqueIds.length) {
    return imageByArtistId;
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  const batches = chunkItems(uniqueIds, ARTISTS_LOOKUP_BATCH_SIZE);

  await Promise.all(
    batches.map(async (ids) => {
      const query = new URLSearchParams({ ids: ids.join(",") });
      const response = await fetch(`${API_BASE_URL}/artists?${query.toString()}`, {
        headers,
        cache: "no-store"
      });
      if (!response.ok) {
        return;
      }
      const json = (await response.json()) as ArtistsLookupResponse;
      json.artists.forEach((artist) => {
        const image = artist.images?.[0]?.url;
        if (image) {
          imageByArtistId.set(artist.id, image);
        }
      });
    })
  );

  return imageByArtistId;
}

export async function fetchSpotifyTopData(accessToken: string): Promise<SpotifyTopFetchResult> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [artistsRes, tracksRes, profileRes] = await Promise.all([
    fetch(`${API_BASE_URL}/me/top/artists?limit=${TOP_ARTISTS_LIMIT}&time_range=${TOP_RANGE}`, {
      headers,
      cache: "no-store"
    }),
    fetch(`${API_BASE_URL}/me/top/tracks?limit=${TOP_TRACKS_LIMIT}&time_range=${TOP_RANGE}`, {
      headers,
      cache: "no-store"
    }),
    fetch(`${API_BASE_URL}/me`, {
      headers,
      cache: "no-store"
    })
  ]);

  if (!artistsRes.ok) {
    return { ok: false, reason: await parseSpotifyError(artistsRes, "artists_request_failed") };
  }

  if (!tracksRes.ok) {
    return { ok: false, reason: await parseSpotifyError(tracksRes, "tracks_request_failed") };
  }

  const artistsJson = (await artistsRes.json()) as TopArtistsResponse;
  const tracksJson = (await tracksRes.json()) as TopTracksResponse;
  const profileJson = profileRes.ok ? ((await profileRes.json()) as UserProfileResponse) : null;
  const topArtists = artistsJson.items.map((artist) => ({
    id: artist.id,
    name: artist.name,
    image: artist.images?.[0]?.url ?? getArtistFallbackImage(artist.name),
    url: artist.external_urls?.spotify ?? "https://open.spotify.com"
  }));
  const artistImagesById = await fetchArtistImagesByIds(
    accessToken,
    topArtists.map((artist) => artist.id)
  );

  return {
    ok: true,
    payload: {
      connected: true,
      artists: topArtists.map((artist) => ({
        ...artist,
        image: artistImagesById.get(artist.id) ?? artist.image ?? getArtistFallbackImage(artist.name)
      })),
      tracks: tracksJson.items.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => artist.name),
        url: track.external_urls?.spotify ?? "https://open.spotify.com"
      })),
      profile:
        profileJson?.display_name && profileJson.external_urls?.spotify
          ? {
              displayName: profileJson.display_name,
              url: profileJson.external_urls.spotify
            }
          : null
    }
  };
}
