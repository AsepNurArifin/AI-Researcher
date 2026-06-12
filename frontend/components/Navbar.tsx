"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getUserRole, removeToken } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    if (token) {
      setUserRole(getUserRole());
    } else {
      setUserRole(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUserRole(null);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const isCandidateActive = pathname.startsWith("/candidate");
  const isRecruiterActive = pathname.startsWith("/recruiter");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white transition hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-violet-500 shadow-md">
            <svg
              className="h-5 w-5 text-slate-950"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 21l8.982-11.795H14l1-6.105L6.018 14.904H9.81z"
              />
            </svg>
          </div>
          <span>
            HireSense<span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">.AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link
            href="/candidate"
            className={`relative py-1 transition hover:text-white ${
              isCandidateActive ? "text-emerald-400 font-semibold" : ""
            }`}
          >
            Kandidat
            {isCandidateActive && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-emerald-400 animate-fade-in" />
            )}
          </Link>
          <Link
            href="/recruiter"
            className={`relative py-1 transition hover:text-white ${
              isRecruiterActive ? "text-violet-400 font-semibold" : ""
            }`}
          >
            Perekrut
            {isRecruiterActive && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-violet-400 animate-fade-in" />
            )}
          </Link>

          <span className="h-4 w-px bg-white/10" />

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider animate-fade-in ${
                  userRole === "candidate"
                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                    : userRole === "recruiter"
                    ? "bg-violet-400/10 text-violet-300 border border-violet-400/20"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {userRole === "candidate" ? "Kandidat" : userRole === "recruiter" ? "Perekrut" : "User"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/15 px-4.5 py-2 text-xs font-semibold text-white transition hover:bg-white/5 hover:border-white/30"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="transition hover:text-white">
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-gradient-to-r from-emerald-400/20 to-violet-400/20 border border-white/15 px-4.5 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:from-emerald-400/30 hover:to-violet-400/30"
              >
                Daftar
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white md:hidden"
        >
          <span className="sr-only">Buka menu</span>
          {isMobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="border-t border-white/5 bg-slate-950 px-6 py-6 md:hidden animate-fade-in">
          <div className="flex flex-col gap-4">
            <Link
              href="/candidate"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm py-2 transition ${isCandidateActive ? "text-emerald-400 font-semibold" : "text-slate-300"}`}
            >
              Area Kandidat
            </Link>
            <Link
              href="/recruiter"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm py-2 transition ${isRecruiterActive ? "text-violet-400 font-semibold" : "text-slate-300"}`}
            >
              Area Perekrut
            </Link>

            <hr className="border-white/5 my-2" />

            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Masuk sebagai</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      userRole === "candidate"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-violet-400/10 text-violet-300"
                    }`}
                  >
                    {userRole === "candidate" ? "Kandidat" : "Perekrut"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Keluar dari Akun
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg border border-white/10 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
                >
                  Masuk ke Akun
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg bg-emerald-400/10 border border-emerald-400/20 py-2.5 text-sm font-semibold text-emerald-300"
                >
                  Daftar Baru
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
