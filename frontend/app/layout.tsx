import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireSense AI",
  description:
    "AI recruitment assistant for resume and job description matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100" suppressHydrationWarning>
        <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white"
            >
              HireSense AI
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
              <Link href="/candidate" className="transition hover:text-white">
                Candidates
              </Link>
              <Link href="/recruiter" className="transition hover:text-white">
                Recruiters
              </Link>
              <Link href="/auth/login" className="transition hover:text-white">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white/60"
              >
                Register
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 bg-slate-950">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-400">
            <span>Focused MVP: Resume ↔ Job Description Matching.</span>
            <span>
              Built for candidates and recruiters to surface fit, missing
              skills, and rankings faster.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
