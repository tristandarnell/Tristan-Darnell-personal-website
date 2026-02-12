"use client";

import { useEffect, useState } from "react";
import { Activity, Code2, Database, Github, Linkedin, Mail, Menu, Moon, Music4, Sun, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { education, experience, leadership, media, profile, projects, skills } from "@/content/resume";

const projectIcons = [Code2, Database, Activity];
const navItems = [
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#resume-info", label: "Resume Info" },
  { href: "#personality", label: "Personality" },
  { href: "/photos", label: "Photos" }
] as const;

type SpotifyArtist = {
  id: string;
  name: string;
  image: string | null;
  url: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  url: string;
};

type SpotifyTopResponse = {
  connected: boolean;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  reason?: string;
  mode?: "owner" | "cookie" | "none";
  profile: {
    displayName: string;
    url: string;
  } | null;
};

type SpotifyClientCache = {
  savedAt: number;
  data: SpotifyTopResponse;
};

const SPOTIFY_CLIENT_CACHE_KEY = "spotify_top_cache_v1";
const SPOTIFY_CLIENT_CACHE_TTL_MS = 1000 * 60 * 30;

function hasSpotifyRows(data: SpotifyTopResponse | null | undefined) {
  if (!data) {
    return false;
  }
  return Boolean(data.connected) || data.artists.length > 0 || data.tracks.length > 0;
}

function isDegradedSpotifyResponse(data: SpotifyTopResponse) {
  return Boolean(data.reason);
}

function formatSpotifyReason(reason?: string): string {
  if (!reason) {
    return "";
  }

  if (reason.includes("owner_rate_limited_backoff")) {
    return "Spotify is rate limited right now. Showing cached data while it recovers.";
  }

  if (reason.includes(":429")) {
    const retryMatch = reason.match(/retry_after=(\d+)/);
    if (!retryMatch) {
      return "Spotify is rate limited right now. Retrying shortly.";
    }
    const raw = Number(retryMatch[1]);
    const delaySec = Number.isFinite(raw) ? Math.max(1, Math.round(raw)) : 0;
    if (delaySec >= 3600) {
      return `Spotify is rate limited right now. Retrying in about ${Math.ceil(delaySec / 3600)}h.`;
    }
    if (delaySec >= 120) {
      return `Spotify is rate limited right now. Retrying in about ${Math.ceil(delaySec / 60)}m.`;
    }
    return `Spotify is rate limited right now. Retrying in about ${delaySec}s.`;
  }

  if (reason.includes(":401") || reason.includes("owner_refresh_failed")) {
    return "Spotify authentication needs to be refreshed.";
  }

  return "Spotify is temporarily unavailable.";
}

export default function Home() {
  const [showImageErrors, setShowImageErrors] = useState({ arya: false, omar: false });
  const homePhotos = media.personalPhotos.slice(2);
  const homePhotoFallbacks = ["/images/profile-portrait.svg", "/images/profile-campus.svg"];
  const [homePhotoErrors, setHomePhotoErrors] = useState<boolean[]>(homePhotos.map(() => false));
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [spotifyData, setSpotifyData] = useState<SpotifyTopResponse | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(true);
  const spotifyDisplayData = hasSpotifyRows(spotifyData) ? spotifyData : null;
  const spotifyArtistCount = spotifyDisplayData?.artists.length ?? 0;
  const spotifyTrackCount = spotifyDisplayData?.tracks.length ?? 0;
  const linkedinUrl = profile.links.find((link) => link.label === "LinkedIn")?.href ?? "#";
  const githubUrl = profile.links.find((link) => link.label === "GitHub")?.href ?? "#";
  const showImageSrc = (character: "arya" | "omar") => {
    if (character === "arya") {
      return showImageErrors.arya ? media.aryaFallback : media.aryaImage;
    }
    return showImageErrors.omar ? media.omarFallback : media.omarImage;
  };
  const onShowImageError = (character: "arya" | "omar") => {
    setShowImageErrors((prev) => (prev[character] ? prev : { ...prev, [character]: true }));
  };
  const homePhotoSrc = (idx: number) => (homePhotoErrors[idx] ? homePhotoFallbacks[idx] : homePhotos[idx].src);
  const onHomePhotoError = (idx: number) => {
    setHomePhotoErrors((prev) => prev.map((value, i) => (i === idx ? true : value)));
  };
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const storedTheme = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
    const preferredDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    const updateScrollMetrics = () => {
      rafId = 0;
      const scrollTop = window.scrollY || root.scrollTop || 0;
      const maxScrollable = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, scrollTop / maxScrollable);
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--scroll-parallax", `${(scrollTop * 0.08).toFixed(2)}px`);
      root.style.setProperty("--scroll-parallax-soft", `${(scrollTop * 0.045).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(updateScrollMetrics);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".section, .photo-card, .highlight-card, .hero-photo-chip, .hero-show-item, .spotify-artist-pill, .spotify-table-row"
      )
    );

    revealTargets.forEach((el) => el.classList.add("reveal-on-scroll"));
    if (reduceMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("scroll-effects-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealTargets.forEach((el) => {
      if (el.classList.contains("is-visible")) {
        return;
      }
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [spotifyArtistCount, spotifyTrackCount]);

  useEffect(() => {
    let active = true;
    const readSpotifyCache = () => {
      try {
        const raw = window.localStorage.getItem(SPOTIFY_CLIENT_CACHE_KEY);
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw) as SpotifyClientCache;
        if (!parsed || typeof parsed.savedAt !== "number" || !parsed.data) {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    };

    const writeSpotifyCache = (data: SpotifyTopResponse) => {
      try {
        const payload: SpotifyClientCache = { savedAt: Date.now(), data };
        window.localStorage.setItem(SPOTIFY_CLIENT_CACHE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore client cache write failures.
      }
    };

    const loadSpotifyTop = async () => {
      const cached = readSpotifyCache();
      const hasCachedData = hasSpotifyRows(cached?.data);

      if (cached && hasCachedData && active) {
        setSpotifyData(cached.data);
        setSpotifyLoading(false);
      }

      if (cached && Date.now() - cached.savedAt < SPOTIFY_CLIENT_CACHE_TTL_MS) {
        return;
      }

      try {
        const response = await fetch("/api/spotify/top", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch Spotify data");
        }
        const data: SpotifyTopResponse = await response.json();
        const degraded = isDegradedSpotifyResponse(data);
        if (active) {
          if (degraded && cached?.data && hasCachedData) {
            setSpotifyData(cached.data);
          } else {
            setSpotifyData(data);
          }
          if (!degraded && hasSpotifyRows(data)) {
            writeSpotifyCache(data);
          }
        }
      } catch {
        if (active) {
          if (!cached) {
            setSpotifyData({ connected: false, artists: [], tracks: [], profile: null });
          }
        }
      } finally {
        if (active) {
          setSpotifyLoading(false);
        }
      }
    };
    loadSpotifyTop();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="playful-shell relative min-h-screen">
      <div className="scroll-progress" aria-hidden="true" />
      <header className="playful-header sticky top-0 z-50 border-b border-border/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <p className="name-gradient text-base font-semibold">{profile.name}</p>
              <p className="text-xs text-muted">Software Engineer Intern @ Lockheed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="header-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="site-nav-drawer"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              title={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div id="site-nav-drawer" className={`menu-drawer-wrap ${menuOpen ? "open" : ""}`}>
          <div className="menu-drawer-scrim" onClick={() => setMenuOpen(false)} />
          <aside className="menu-drawer">
            <nav className="menu-list" aria-label="Site sections">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="menu-link" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="menu-quick-actions">
              <Button asChild variant="ghost">
                <a href="/resume.pdf" download onClick={() => setMenuOpen(false)}>
                  Resume
                </a>
              </Button>
              <Button asChild>
                <a href={`mailto:${profile.email}`} onClick={() => setMenuOpen(false)}>
                  Email
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </header>

      <main className="site-main space-y-16 pb-20 pt-10 md:space-y-20 md:pt-14">
        <section className="section hero-section gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-col justify-center gap-6">
              <Badge variant="glow" className="w-fit">
                {profile.tagline}
              </Badge>
              <h1 className="name-gradient text-4xl font-semibold leading-tight sm:text-5xl">{profile.name}</h1>
              <p className="max-w-2xl text-lg text-muted">{profile.blurb}</p>
              <div className="hero-personal-photos">
                {homePhotos.map((photo, idx) => (
                  <figure key={photo.src} className={`hero-photo-chip ${idx === 0 ? "hero-photo-left" : "hero-photo-right"}`}>
                    <img
                      src={homePhotoSrc(idx)}
                      alt={photo.alt}
                      onError={() => onHomePhotoError(idx)}
                      className="hero-photo-img"
                    />
                  </figure>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href={`mailto:${profile.email}`}>Email</a>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <a href="/resume.pdf" download>
                    Download resume
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <a className="inline-flex items-center gap-2 transition-colors hover:text-foreground" href={linkedinUrl} target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4" />
                  <span className="tag-chip rounded-full px-2 py-0.5">LinkedIn</span>
                </a>
                <a className="inline-flex items-center gap-2 transition-colors hover:text-foreground" href={githubUrl} target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="tag-chip rounded-full px-2 py-0.5">GitHub</span>
                </a>
                <a className="hero-email-link inline-flex items-center gap-2 transition-colors hover:text-foreground" href={`mailto:${profile.email}`}>
                  <span className="hero-email-icon" aria-hidden="true">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span className="tag-chip rounded-full px-2 py-0.5">Email</span>
                </a>
              </div>
            </div>
          </div>
          <div className="hero-float-layer" aria-hidden="true">
            <div className="hero-shows-block">
              <p className="hero-shows-heading">Favorite Shows</p>
              <div className="hero-shows-grid">
                <div className="hero-show-item hero-show-item-arya">
                  <div className="hero-float">
                    <img src={showImageSrc("arya")} alt="" onError={() => onShowImageError("arya")} className="hero-float-base" />
                  </div>
                  <p className="hero-show-label">Game of Thrones</p>
                </div>
                <div className="hero-show-item hero-show-item-omar">
                  <div className="hero-float">
                    <img src={showImageSrc("omar")} alt="" onError={() => onShowImageError("omar")} className="hero-float-base" />
                  </div>
                  <p className="hero-show-label">The Wire</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <div className="section-heading">
            <h2 className="section-title text-3xl font-semibold text-slate-900">Experience</h2>
          </div>
          <div className="relative ml-2 border-l border-blue-100 pl-7">
            {experience.map((item) => (
              <div key={item.role} className="relative mb-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-soft last:mb-0">
                <span className="absolute -left-[34px] top-6 h-3.5 w-3.5 rounded-full bg-primary" />
                <p className="text-xs uppercase tracking-[0.12em] text-blue-700">{item.dates}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{item.role}</h3>
                <p className="text-sm text-muted">{item.org}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="section">
          <div className="section-heading">
            <Badge variant="glow" className="w-fit">
              Projects
            </Badge>
            <h2 className="section-title text-3xl font-semibold text-slate-900">Projects</h2>
            <p className="max-w-3xl text-muted">Systems work across trading research, automation, and data infrastructure.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {projects.map((project, index) => {
              const Icon = projectIcons[index % projectIcons.length];
              return (
                <Card key={project.title} className="photo-card border-blue-100">
                  <CardHeader className="gap-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="accent" className="w-fit">
                      {project.stage}
                    </Badge>
                    <CardTitle className="text-2xl text-slate-900">{project.title}</CardTitle>
                    <CardDescription className="text-base text-muted">{project.blurb}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tool) => (
                        <span key={tool} className="tag-chip rounded-full px-2 py-0.5 text-xs font-semibold">
                          {tool}
                        </span>
                      ))}
                    </div>
                    <ul className="space-y-2 text-sm text-muted">
                      {project.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="resume-info" className="section">
          <div className="section-heading">
            <Badge className="w-fit">Resume Information</Badge>
            <h2 className="section-title text-3xl font-semibold text-slate-900">Education, coursework, and technical stack</h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr,1.1fr]">
            <Card className="photo-card p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-slate-900">{education.school}</CardTitle>
                <CardDescription className="text-base text-muted">
                  {education.degree} • {education.graduation} • GPA {education.gpa}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-0">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-700">Coursework</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {education.coursework.map((course) => (
                      <li key={course}>{course}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-700">Campus Involvement</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {education.involvement.map((item) => (
                      <span key={item} className="tag-chip rounded-full px-2 py-0.5 text-xs font-semibold">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5">
              <Card className="photo-card p-5">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-2xl text-slate-900">Technical Skills</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 p-0">
                  {skills.map((skillGroup) => (
                    <div key={skillGroup.group}>
                      <p className="text-xs uppercase tracking-[0.12em] text-blue-700">{skillGroup.group}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skillGroup.items.map((item) => (
                          <span key={item} className="tag-chip rounded-full px-2 py-0.5 text-xs font-semibold">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="photo-card p-5">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-2xl text-slate-900">Leadership and Awards</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-0">
                  {leadership.map((item) => (
                    <div key={item.title} className="highlight-card rounded-xl p-3">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{item.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="personality" className="section">
          <div className="grid gap-5 xl:grid-cols-[1fr,1.1fr]">
            <Card className="photo-card spotify-card p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="spotify-title inline-flex items-center gap-2 text-2xl text-slate-900">
                  <Music4 className="h-5 w-5 text-blue-700" />
                  Spotify
                </CardTitle>
                <CardDescription className="spotify-subtitle text-base text-muted">
                  Live top artists and songs from my Spotify account.
                </CardDescription>
              </CardHeader>
              <CardContent className="spotify-content p-0">
                {spotifyLoading ? (
                  <p className="spotify-state">Loading Spotify data...</p>
                ) : !spotifyDisplayData ? (
                  <p className="spotify-state">
                    Spotify data is unavailable right now. Check back shortly.
                    {spotifyData?.reason ? ` ${formatSpotifyReason(spotifyData.reason)}` : ""}
                  </p>
                ) : (
                  <>
                    <section className="spotify-strip-block">
                      <p className="spotify-panel-label">Top Artists</p>
                      <ul className="spotify-artist-rail">
                        {spotifyDisplayData.artists.map((artist, index) => (
                          <li key={artist.id}>
                            <a href={artist.url} target="_blank" rel="noreferrer" className="spotify-artist-pill">
                              <span className="spotify-index">{index + 1}</span>
                              {artist.image ? (
                                <img src={artist.image} alt={artist.name} className="spotify-avatar" />
                              ) : (
                                <span className="spotify-avatar spotify-avatar-fallback" />
                              )}
                              <span className="spotify-link truncate">{artist.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="spotify-table-block">
                      <div className="spotify-table-head">
                        <span>#</span>
                        <span>Song</span>
                        <span>Artist</span>
                      </div>
                      <ul className="spotify-table-list">
                        {spotifyDisplayData.tracks.map((track, index) => (
                          <li key={track.id} className="spotify-table-row">
                            <span className="spotify-index">{index + 1}</span>
                            <a href={track.url} target="_blank" rel="noreferrer" className="spotify-link truncate">
                              {track.name}
                            </a>
                            <span className="spotify-artist-text truncate">{track.artists.join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {spotifyDisplayData.profile ? (
                      <a href={spotifyDisplayData.profile.url} target="_blank" rel="noreferrer" className="spotify-profile-link">
                        Open {spotifyDisplayData.profile.displayName}&apos;s Spotify profile
                      </a>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="photo-card p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-slate-900">Photography</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Button asChild variant="ghost">
                  <a href="/photos">View Photography 📸</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>
    </div>
  );
}
