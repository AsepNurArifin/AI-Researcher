"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] h-[400px] w-[400px] rounded-full bg-rose-500/5 blur-[100px] animate-float" />
      
      <div className="relative z-10 w-full max-w-md space-y-6 text-center animate-fade-in">
        <div className="glass-card p-8 space-y-6 border-rose-500/20 shadow-lg shadow-rose-500/2">
          {/* Animated Alert icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <svg
              className="h-8 w-8 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Terjadi Kesalahan
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Maaf, terjadi kesalahan yang tidak terduga pada aplikasi. Silakan coba kembali beberapa saat lagi.
            </p>
            {error.message && (
              <p className="mt-4 rounded-xl bg-slate-950/70 border border-white/5 p-3.5 text-xs text-slate-500 font-mono break-all text-left">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={reset}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-sm font-semibold text-slate-950 shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              Coba Lagi
            </button>
            <a
              href="/"
              className="flex h-11 w-full items-center justify-center rounded-xl border border-white/10 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
