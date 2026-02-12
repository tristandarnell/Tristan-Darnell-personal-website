import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { profile } from "@/content/resume";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap"
});

const siteUrl = "https://tristan-darnell.vercel.app";
const metaTitle = "Tristan Darnell – Software Engineer | Duke CS/Math";
const metaDescription =
  "Tristan Darnell is a Duke CS/Math student and incoming Lockheed Martin software engineering intern. Built production-grade systems, shipped full-stack products, and scaled an e-commerce operation to $1M+ annual sales.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: metaTitle,
    template: "%s | Tristan Darnell"
  },
  description: metaDescription,
  alternates: {
    canonical: "/"
  },
  keywords: [
    "Tristan Darnell",
    "Software Engineer",
    "Duke University",
    "Computer Science",
    "Mathematics",
    "Quantitative Research",
    "Full Stack Developer"
  ],
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: siteUrl,
    siteName: "Tristan Darnell Portfolio",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription
  }
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: siteUrl,
  image: `${siteUrl}/images/IMG_0106.jpeg`,
  email: `mailto:${profile.email}`,
  jobTitle: "Software Engineer Intern",
  description: metaDescription,
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Duke University"
  },
  worksFor: {
    "@type": "Organization",
    name: "Lockheed Martin"
  },
  sameAs: profile.links.map((link) => link.href),
  knowsAbout: [
    "Software Engineering",
    "Quantitative Research",
    "Full-Stack Development",
    "Algorithmic Trading",
    "Distributed Systems"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        {children}
      </body>
    </html>
  );
}
