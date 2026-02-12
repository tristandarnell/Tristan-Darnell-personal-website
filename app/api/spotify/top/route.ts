import { NextRequest, NextResponse } from "next/server";

import {
  fetchSpotifyTopData,
  getSpotifyConfig,
  refreshAccessToken,
  type SpotifyTopPayload
} from "@/lib/spotify";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

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

type SpotifyClientTokenResponse = {
  access_token: string;
  expires_in: number;
};

type ArtistsLookupResponse = {
  artists: Array<{
    id: string;
    images?: Array<{ url: string }>;
  }>;
};

const OWNER_FALLBACK_PAYLOAD: SpotifyTopPayload = {
  connected: true,
  artists: [
    {
      id: "fallback-dominic-fike",
      name: "Dominic Fike",
      image: "/images/spotify-fallback-dominic-fike.svg",
      url: "https://open.spotify.com/artist/6USv9qhCn6zfxlBQIYJ9qs"
    },
    {
      id: "fallback-kanye-west",
      name: "Kanye West",
      image: "/images/spotify-fallback-kanye-west.svg",
      url: "https://open.spotify.com/artist/5K4W6rqBFWDnAN6FQUkS6x"
    },
    {
      id: "fallback-the-weeknd",
      name: "The Weeknd",
      image: "/images/spotify-fallback-the-weeknd.svg",
      url: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ"
    },
    {
      id: "fallback-don-toliver",
      name: "Don Toliver",
      image: "/images/spotify-fallback-don-toliver.svg",
      url: "https://open.spotify.com/artist/4Gso3d4CscCijv0lmajZWs"
    },
    {
      id: "fallback-mac-miller",
      name: "Mac Miller",
      image: "/images/spotify-fallback-mac-miller.svg",
      url: "https://open.spotify.com/artist/4LLpKhyESsyAXpc4laK94U"
    }
  ],
  tracks: [
    {
      id: "fallback-best-you-had",
      name: "Best You Had",
      artists: ["Don Toliver"],
      url: "https://open.spotify.com/search/Best%20You%20Had%20Don%20Toliver"
    },
    {
      id: "fallback-often",
      name: "Often",
      artists: ["The Weeknd"],
      url: "https://open.spotify.com/search/Often%20The%20Weeknd"
    },
    {
      id: "fallback-bodies",
      name: "Bodies",
      artists: ["Dominic Fike"],
      url: "https://open.spotify.com/search/Bodies%20Dominic%20Fike"
    },
    {
      id: "fallback-novacane",
      name: "Novacane",
      artists: ["Frank Ocean"],
      url: "https://open.spotify.com/search/Novacane%20Frank%20Ocean"
    },
    {
      id: "fallback-cough-syrup",
      name: "Cough Syrup",
      artists: ["Young the Giant"],
      url: "https://open.spotify.com/search/Cough%20Syrup%20Young%20the%20Giant"
    }
  ],
  profile: null
};

const OWNER_CACHE_TTL_MS = 1000 * 60 * 15;
const OWNER_STALE_TTL_MS = 1000 * 60 * 60 * 24;
const OWNER_DEFAULT_BACKOFF_MS = 1000 * 60 * 2;
const MAX_RETRY_BACKOFF_MS = 1000 * 60 * 60 * 24;
const RESPONSE_S_MAXAGE_SECONDS = 900;
const RESPONSE_STALE_WHILE_REVALIDATE_SECONDS = 3600;

const ownerCache: OwnerCache = {
  payload: null,
  expiresAt: 0,
  staleUntil: 0,
  nextRetryAt: 0
};
const appTokenCache = {
  token: null as string | null,
  expiresAt: 0
};
const fallbackArtistImageCache = new Map<string, string>();

type ResponseOptions = {
  cacheControl?: string;
  retryAfterSeconds?: number;
};

function responseWithPayload(payload: TopRoutePayload, options?: ResponseOptions) {
  const headers: Record<string, string> = {
    "Cache-Control": options?.cacheControl ?? "no-store"
  };

  if (options?.retryAfterSeconds && options.retryAfterSeconds > 0) {
    headers["Retry-After"] = String(options.retryAfterSeconds);
  }

  return NextResponse.json(payload, { headers });
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

  // Spotify Retry-After is documented as seconds.
  const asMs = raw * 1000;
  return Math.min(Math.max(asMs, 15_000), MAX_RETRY_BACKOFF_MS);
}

function toRetrySeconds(delayMs: number) {
  return Math.max(1, Math.ceil(delayMs / 1000));
}

function rateLimitCacheControl(retrySeconds: number) {
  const clamped = Math.max(60, Math.min(retrySeconds, 60 * 60));
  return `public, s-maxage=${clamped}, stale-while-revalidate=300`;
}

function stableCacheControl() {
  return `public, s-maxage=${RESPONSE_S_MAXAGE_SECONDS}, stale-while-revalidate=${RESPONSE_STALE_WHILE_REVALIDATE_SECONDS}`;
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

function parseArtistIdFromUrl(artistUrl: string) {
  const match = artistUrl.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

function spotifyAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function getSpotifyAppAccessToken() {
  const now = Date.now();
  if (appTokenCache.token && now < appTokenCache.expiresAt) {
    return appTokenCache.token;
  }

  const config = getSpotifyConfig();
  if (!config) {
    return null;
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      Authorization: spotifyAuthHeader(config.clientId, config.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as SpotifyClientTokenResponse;
  appTokenCache.token = json.access_token;
  appTokenCache.expiresAt = now + Math.max(60, json.expires_in - 60) * 1000;
  return appTokenCache.token;
}

async function fetchArtistImagesByIds(artistIds: string[]) {
  const uniqueIds = Array.from(new Set(artistIds.filter(Boolean)));
  const imageByArtistId = new Map<string, string>();
  if (!uniqueIds.length) {
    return imageByArtistId;
  }

  const accessToken = await getSpotifyAppAccessToken();
  if (!accessToken) {
    return imageByArtistId;
  }

  const query = new URLSearchParams({ ids: uniqueIds.join(",") });
  const response = await fetch(`${SPOTIFY_API_URL}/artists?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  if (!response.ok) {
    return imageByArtistId;
  }

  const json = (await response.json()) as ArtistsLookupResponse;
  json.artists.forEach((artist) => {
    const image = artist.images?.[0]?.url;
    if (image) {
      imageByArtistId.set(artist.id, image);
      fallbackArtistImageCache.set(artist.id, image);
    }
  });
  return imageByArtistId;
}

async function ownerFallbackPayload(reason: string): Promise<TopRoutePayload> {
  const fallbackArtists = OWNER_FALLBACK_PAYLOAD.artists;
  const artistIdsNeedingLookup = fallbackArtists
    .map((artist) => parseArtistIdFromUrl(artist.url))
    .filter((artistId): artistId is string => Boolean(artistId))
    .filter((artistId) => !fallbackArtistImageCache.has(artistId));
  if (artistIdsNeedingLookup.length > 0) {
    await fetchArtistImagesByIds(artistIdsNeedingLookup);
  }

  const artists = fallbackArtists.map((artist) => {
    const artistId = parseArtistIdFromUrl(artist.url);
    if (!artistId) {
      return artist;
    }
    const resolvedImage = fallbackArtistImageCache.get(artistId);
    return {
      ...artist,
      image: resolvedImage ?? artist.image
    };
  });

  return {
    ...OWNER_FALLBACK_PAYLOAD,
    artists,
    mode: "owner",
    reason
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
  try {
    const ownerRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();
    if (!ownerRefreshToken) {
      return responseWithPayload(await ownerFallbackPayload("owner_refresh_token_missing"), {
        cacheControl: "public, s-maxage=600, stale-while-revalidate=3600"
      });
    }

    const now = Date.now();
    if (ownerCache.payload && now < ownerCache.expiresAt) {
      const payload = ownerCachePayload();
      if (payload) {
        return responseWithPayload(payload, {
          cacheControl: stableCacheControl()
        });
      }
    }

    if (now < ownerCache.nextRetryAt) {
      const retrySeconds = toRetrySeconds(ownerCache.nextRetryAt - now);
      const payload = ownerCachePayload();
      if (payload) {
        return responseWithPayload(payload, {
          cacheControl: rateLimitCacheControl(retrySeconds),
          retryAfterSeconds: retrySeconds
        });
      }
      return responseWithPayload(await ownerFallbackPayload("owner_rate_limited_backoff"), {
        cacheControl: rateLimitCacheControl(retrySeconds),
        retryAfterSeconds: retrySeconds
      });
    }

    const ownerTokenData = await refreshIfPossible(ownerRefreshToken);
    if (!ownerTokenData) {
      const payload = ownerCachePayload();
      if (payload && now < ownerCache.staleUntil) {
        return responseWithPayload(payload, {
          cacheControl: stableCacheControl()
        });
      }
      return responseWithPayload(await ownerFallbackPayload("owner_refresh_failed"), {
        cacheControl: "public, s-maxage=300, stale-while-revalidate=1800"
      });
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
        {
          cacheControl: stableCacheControl()
        }
      );
    }

    const failureReason = `owner_fetch_failed:${ownerResult.reason}`;
    if (isRateLimited(ownerResult.reason)) {
      const delayMs = getRetryDelayMs(ownerResult.reason);
      ownerCache.nextRetryAt = now + delayMs;
      const retrySeconds = toRetrySeconds(delayMs);
      const payload = ownerCachePayload();
      if (payload && now < ownerCache.staleUntil) {
        return responseWithPayload(payload, {
          cacheControl: rateLimitCacheControl(retrySeconds),
          retryAfterSeconds: retrySeconds
        });
      }
      return responseWithPayload(await ownerFallbackPayload(failureReason), {
        cacheControl: rateLimitCacheControl(retrySeconds),
        retryAfterSeconds: retrySeconds
      });
    }

    const payload = ownerCachePayload();
    if (payload && now < ownerCache.staleUntil) {
      return responseWithPayload(payload, {
        cacheControl: stableCacheControl()
      });
    }

    return responseWithPayload(await ownerFallbackPayload(failureReason), {
      cacheControl: "public, s-maxage=300, stale-while-revalidate=1800"
    });
  } catch {
    return responseWithPayload(await ownerFallbackPayload("owner_unexpected_error"), {
      cacheControl: "public, s-maxage=300, stale-while-revalidate=1800"
    });
  }
}
