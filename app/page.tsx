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

export default function Home() {
  const [showImageErrors, setShowImageErrors] = useState({ arya: false, omar: false });
  const homePhotos = media.personalPhotos.slice(0, 2);
  const homePhotoFallbacks = ["/images/profile-portrait.svg", "/images/profile-campus.svg"];
  const [homePhotoErrors, setHomePhotoErrors] = useState<boolean[]>(homePhotos.map(() => false));
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
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

  return (
    <div className="playful-shell relative min-h-screen">
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
          <div className="hero-float-layer" aria-hidden="true">
            <div className="hero-float hero-float-arya">
              <img src={showImageSrc("arya")} alt="" onError={() => onShowImageError("arya")} className="hero-float-base" />
            </div>
            <div className="hero-float hero-float-omar">
              <img src={showImageSrc("omar")} alt="" onError={() => onShowImageError("omar")} className="hero-float-base" />
            </div>
          </div>
          <div className="max-w-3xl">
            <div className="flex flex-col justify-center gap-6">
              <Badge variant="glow" className="w-fit">
                {profile.tagline}
              </Badge>
              <h1 className="name-gradient text-4xl font-semibold leading-tight sm:text-5xl">{profile.name}</h1>
              <p className="max-w-2xl text-lg text-muted">{profile.blurb}</p>
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
                <a className="inline-flex items-center gap-2 transition-colors hover:text-foreground" href={`mailto:${profile.email}`}>
                  <Mail className="h-4 w-4" />
                  <span className="tag-chip rounded-full px-2 py-0.5">Email</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <div className="section-heading">
            <Badge className="w-fit">Experience</Badge>
            <h2 className="section-title text-3xl font-semibold text-slate-900">Experience</h2>
            <p className="max-w-3xl text-muted">Role history with clear technical ownership and outcomes.</p>
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
            <Card className="photo-card p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="inline-flex items-center gap-2 text-2xl text-slate-900">
                  <Music4 className="h-5 w-5 text-blue-700" />
                  Spotify
                </CardTitle>
                <CardDescription className="text-base text-muted">
                  Drop your public Spotify playlist link and I will wire your exact listening profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  title="Spotify player"
                  src={media.spotifyEmbedUrl}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full rounded-xl border border-blue-100"
                />
                <a
                  href={media.spotifyLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-primary transition-colors hover:text-blue-700"
                >
                  Open on Spotify
                </a>
              </CardContent>
            </Card>
            <Card className="photo-card p-5">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-slate-900">Photos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 p-0">
                {homePhotos.map((photo, idx) => (
                  <figure key={photo.src} className={`photo-polaroid ${idx === 0 ? "tilt-left" : "tilt-right"}`}>
                    <img
                      src={homePhotoSrc(idx)}
                      alt={photo.alt}
                      onError={() => onHomePhotoError(idx)}
                      className="h-56 w-full rounded-lg border border-blue-100 object-cover"
                    />
                  </figure>
                ))}
                <div className="col-span-2 pt-1">
                  <Button asChild variant="ghost">
                    <a href="/photos">View Photography 📸</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>
    </div>
  );
}
