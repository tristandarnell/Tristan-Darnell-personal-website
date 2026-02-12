import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Tristan Darnell | Engineer & Quant Builder",
  description:
    "Next.js portfolio for Tristan Darnell — marketplace automation, quant research systems, and end-to-end product builds."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
