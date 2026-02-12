"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { media, profile } from "@/content/resume";

const galleryPhotos = media.personalPhotos.slice(0, 2);
const galleryFallbacks = ["/images/profile-portrait.svg", "/images/profile-campus.svg"];

export default function PhotosPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [photoErrors, setPhotoErrors] = useState<boolean[]>(galleryPhotos.map(() => false));

  const photoSrc = (idx: number) => (photoErrors[idx] ? galleryFallbacks[idx] : galleryPhotos[idx].src);
  const onPhotoError = (idx: number) => {
    setPhotoErrors((prev) => prev.map((value, i) => (i === idx ? true : value)));
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

  return (
    <div className="playful-shell min-h-screen pb-16">
      <header className="playful-header sticky top-0 z-50 border-b border-border/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="leading-tight">
            <p className="name-gradient text-base font-semibold">{profile.name}</p>
            <p className="text-xs text-muted">Photos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button asChild variant="ghost">
              <a href="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="section gap-8 pt-10">
        <div className="section-heading">
          <Badge className="w-fit">Photos</Badge>
          <h1 className="section-title text-4xl font-semibold text-slate-900">Photos</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {galleryPhotos.map((photo, idx) => (
            <figure
              key={photo.src}
              className={`photo-polaroid ${idx % 3 === 1 ? "tilt-left" : ""} ${idx % 3 === 2 ? "tilt-right" : idx % 3 === 0 ? "tilt-soft" : ""}`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <img
                src={photoSrc(idx)}
                alt={photo.alt}
                onError={() => onPhotoError(idx)}
                className="h-[320px] w-full rounded-lg border border-blue-100 object-cover md:h-[360px]"
              />
            </figure>
          ))}
        </div>
      </main>
    </div>
  );
}
