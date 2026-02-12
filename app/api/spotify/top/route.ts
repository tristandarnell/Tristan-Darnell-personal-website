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

const ownerCache: OwnerCache = {
  payload: null,
  expiresAt: 0,
  staleUntil: 0,
  nextRetryAt: 0
};
const artistThumbnailCache = new Map<string, string | null>();

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

function ownerCachePayload(): TopRoutePayload | null {
  if (!ownerCache.payload) {
    return null;
  }
  return {
    ...ownerCache.payload,
    mode: "owner"
  };
}

function isSpotifyArtistUrl(url: string) {
  return url.includes("open.spotify.com/artist/");
}

async function fetchArtistThumbnailFromOEmbed(artistUrl: string) {
  const cached = artistThumbnailCache.get(artistUrl);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(artistUrl)}`, {
      headers: {
        "User-Agent": "tristan-portfolio/1.0"
      },
      cache: "force-cache"
    });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as { thumbnail_url?: string | null };
    return json.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

async function fetchArtistThumbnailFromOpenGraph(artistUrl: string) {
  try {
    const response = await fetch(artistUrl, {
      headers: {
        "User-Agent": "tristan-portfolio/1.0"
      },
      cache: "force-cache"
    });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const ogImageMatch =
      html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ??
      html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    return ogImageMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fetchArtistThumbnail(artistUrl: string) {
  const cached = artistThumbnailCache.get(artistUrl);
  if (cached !== undefined) {
    return cached;
  }

  const openGraphImage = await fetchArtistThumbnailFromOpenGraph(artistUrl);
  if (openGraphImage) {
    artistThumbnailCache.set(artistUrl, openGraphImage);
    return openGraphImage;
  }

  const oEmbedImage = await fetchArtistThumbnailFromOEmbed(artistUrl);
  artistThumbnailCache.set(artistUrl, oEmbedImage);
  return oEmbedImage;
}

async function withFallbackArtistThumbnails(payload: SpotifyTopPayload) {
  const missingAny = payload.artists.some((artist) => !artist.image && isSpotifyArtistUrl(artist.url));
  if (!missingAny) {
    return payload;
  }

  const artists = await Promise.all(
    payload.artists.map(async (artist) => {
      if (artist.image || !isSpotifyArtistUrl(artist.url)) {
        return artist;
      }
      const thumbnail = await fetchArtistThumbnail(artist.url);
      if (!thumbnail) {
        return artist;
      }
      return {
        ...artist,
        image: thumbnail
      };
    })
  );

  return {
    ...payload,
    artists
  };
}

async function ownerFallbackWithThumbnails(reason: string): Promise<TopRoutePayload> {
  const payloadWithImages = await withFallbackArtistThumbnails(OWNER_FALLBACK_PAYLOAD);
  return {
    ...payloadWithImages,
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
      return responseWithPayload(await ownerFallbackWithThumbnails("owner_refresh_token_missing"), {
        cacheControl: "public, s-maxage=600, stale-while-revalidate=3600"
      });
    }

    const now = Date.now();
    if (ownerCache.payload && now < ownerCache.expiresAt) {
      const payload = ownerCachePayload();
      if (payload) {
        return responseWithPayload(payload, {
          cacheControl: "public, s-maxage=180, stale-while-revalidate=1800"
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
      return responseWithPayload(await ownerFallbackWithThumbnails("owner_rate_limited_backoff"), {
        cacheControl: rateLimitCacheControl(retrySeconds),
        retryAfterSeconds: retrySeconds
      });
    }

    const ownerTokenData = await refreshIfPossible(ownerRefreshToken);
    if (!ownerTokenData) {
      const payload = ownerCachePayload();
      if (payload && now < ownerCache.staleUntil) {
        return responseWithPayload(payload, {
          cacheControl: "public, s-maxage=180, stale-while-revalidate=1800"
        });
      }
      return responseWithPayload(await ownerFallbackWithThumbnails("owner_refresh_failed"), {
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
          cacheControl: "public, s-maxage=180, stale-while-revalidate=1800"
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
      return responseWithPayload(await ownerFallbackWithThumbnails(failureReason), {
        cacheControl: rateLimitCacheControl(retrySeconds),
        retryAfterSeconds: retrySeconds
      });
    }

    const payload = ownerCachePayload();
    if (payload && now < ownerCache.staleUntil) {
      return responseWithPayload(payload, {
        cacheControl: "public, s-maxage=180, stale-while-revalidate=1800"
      });
    }

    return responseWithPayload(await ownerFallbackWithThumbnails(failureReason), {
      cacheControl: "public, s-maxage=300, stale-while-revalidate=1800"
    });
  } catch {
    return responseWithPayload(await ownerFallbackWithThumbnails("owner_unexpected_error"), {
      cacheControl: "public, s-maxage=300, stale-while-revalidate=1800"
    });
  }
}
