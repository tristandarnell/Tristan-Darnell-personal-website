"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

function readRefreshTokenFromHash() {
  if (typeof window === "undefined") {
    return "";
  }
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return params.get("refresh_token") ?? "";
}

export default function SpotifySetupPage() {
  const [refreshToken, setRefreshToken] = useState("");
  const [copied, setCopied] = useState(false);
  const error = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return new URLSearchParams(window.location.search).get("spotify_error");
  }, []);

  useEffect(() => {
    setRefreshToken(readRefreshTokenFromHash());
  }, []);

  const copyToken = async () => {
    if (!refreshToken) {
      return;
    }
    await navigator.clipboard.writeText(refreshToken);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="container py-16">
      <div className="photo-card mx-auto max-w-2xl rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Spotify Setup</h1>
        <p className="mt-2 text-sm text-muted">
          Copy this refresh token and set it as <code>SPOTIFY_REFRESH_TOKEN</code> in Vercel environment variables.
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-600">
            Could not get a refresh token. Re-run setup from <code>/api/spotify/login?setup=1</code>.
          </p>
        ) : null}

        <div className="mt-4 rounded-xl border border-blue-200 bg-white p-3 text-xs break-all text-slate-700">
          {refreshToken || "No refresh token found yet."}
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={copyToken} disabled={!refreshToken}>
            {copied ? "Copied" : "Copy token"}
          </Button>
          <Button asChild variant="ghost">
            <a href="/">Back to site</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
