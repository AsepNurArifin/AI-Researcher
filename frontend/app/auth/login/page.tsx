"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.login({
        email,
        password,
      });
      setToken(response.access_token);

      if (response.user.role === "candidate") {
        router.push("/candidate");
      } else {
        router.push("/recruiter");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 flex-1 flex items-center justify-center py-16 px-6">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[100px] animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo / Header */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Akses Sesi Aman
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Selamat Datang Kembali</h1>
          <p className="text-sm text-slate-400">
            Masuk untuk mengakses dasbor HireSense Anda.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-card p-8 space-y-6 glow-emerald"
        >
          {error && (
            <div className="flex items-center gap-2.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl animate-fade-in">
              <svg className="h-4.5 w-4.5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Alamat Email
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
                />
              </div>
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Kata Sandi
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-sm font-semibold text-slate-950 shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Masuk...</span>
              </>
            ) : (
              <span>Masuk Sekarang</span>
            )}
          </button>

          <p className="text-center text-sm text-slate-400">
            Belum memiliki akun?{" "}
            <a
              href="/auth/register"
              className="font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              Daftar Gratis
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
