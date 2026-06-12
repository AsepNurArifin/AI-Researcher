"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.register({
        name,
        email,
        password,
        role,
        company_name: role === "recruiter" ? companyName : undefined,
      });
      // Redirect to login after successful registration
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const isCandidate = role === "candidate";

  return (
    <div className="relative overflow-hidden bg-slate-950 flex-1 flex items-center justify-center py-16 px-6">
      {/* Dynamic Background Glows */}
      <div className={`absolute top-[-20%] left-[-20%] h-[400px] w-[400px] rounded-full blur-[100px] animate-float transition-all duration-700 ${isCandidate ? "bg-emerald-500/5" : "bg-violet-600/5"}`} />
      <div className={`absolute bottom-[-20%] right-[-20%] h-[400px] w-[400px] rounded-full blur-[100px] animate-float transition-all duration-700 ${isCandidate ? "bg-teal-500/5" : "bg-indigo-600/5"}`} style={{ animationDelay: "3s" }} />

      <div className="relative z-10 w-full max-w-xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 ${isCandidate ? "text-emerald-400" : "text-violet-400"}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isCandidate ? "text-emerald-300" : "text-violet-300"}`}>
            Daftar Akun Baru
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Buat Akun HireSense</h1>
          <p className="text-sm text-slate-400">
            Dapatkan hasil analisis resume yang dioptimasi dengan AI.
          </p>
        </div>

        {/* Register Form */}
        <form
          onSubmit={handleSubmit}
          className={`glass-card p-8 space-y-6 transition-all duration-500 ${isCandidate ? "glow-emerald" : "glow-violet"}`}
        >
          {error && (
            <div className="flex items-center gap-2.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl animate-fade-in">
              <svg className="h-4.5 w-4.5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Role Card Selection */}
          <div className="space-y-2.5">
            <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Pilih Peran Anda
            </span>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Candidate Card */}
              <div
                onClick={() => setRole("candidate")}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4.5 transition-all duration-300 ${
                  isCandidate
                    ? "border-emerald-400/50 bg-emerald-400/5 shadow-md shadow-emerald-400/2"
                    : "border-white/10 bg-slate-950/40 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/5 ${isCandidate ? "text-emerald-400" : "text-slate-400"}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {isCandidate && (
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Kandidat</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Uji kecocokan resume & gap kompetensi Anda.</p>
                </div>
              </div>

              {/* Recruiter Card */}
              <div
                onClick={() => setRole("recruiter")}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4.5 transition-all duration-300 ${
                  !isCandidate
                    ? "border-violet-400/50 bg-violet-400/5 shadow-md shadow-violet-400/2"
                    : "border-white/10 bg-slate-950/40 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/5 ${!isCandidate ? "text-violet-400" : "text-slate-400"}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  {!isCandidate && (
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-400 text-slate-950">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Perekrut / HR</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Kelola loker & saring peringkat kandidat terbaik.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Nama Lengkap
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className={`h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-1 ${
                    isCandidate
                      ? "focus:border-emerald-400/50 focus:ring-emerald-400/30"
                      : "focus:border-violet-400/50 focus:ring-violet-400/30"
                  }`}
                />
              </div>
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Email Kerja
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
                  placeholder="email@anda.com"
                  required
                  className={`h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-1 ${
                    isCandidate
                      ? "focus:border-emerald-400/50 focus:ring-emerald-400/30"
                      : "focus:border-violet-400/50 focus:ring-violet-400/30"
                  }`}
                />
              </div>
            </label>
          </div>

          {!isCandidate && (
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300 animate-fade-in">
              Nama Perusahaan
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nama Perusahaan / Instansi"
                  required={!isCandidate}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-1 focus:border-violet-400/50 focus:ring-violet-400/30"
                />
              </div>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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
                  className={`h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-1 ${
                    isCandidate
                      ? "focus:border-emerald-400/50 focus:ring-emerald-400/30"
                      : "focus:border-violet-400/50 focus:ring-violet-400/30"
                  }`}
                />
              </div>
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
              Konfirmasi Kata Sandi
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-1 ${
                    isCandidate
                      ? "focus:border-emerald-400/50 focus:ring-emerald-400/30"
                      : "focus:border-violet-400/50 focus:ring-violet-400/30"
                  }`}
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-950 shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
              isCandidate
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-400/5"
                : "bg-gradient-to-r from-violet-400 to-indigo-500 shadow-violet-500/5"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mendaftar...</span>
              </>
            ) : (
              <span>Daftar Akun Baru</span>
            )}
          </button>

          <p className="text-center text-sm text-slate-400">
            Sudah memiliki akun?{" "}
            <a
              href="/auth/login"
              className={`font-bold transition ${isCandidate ? "text-emerald-400 hover:text-emerald-300" : "text-violet-400 hover:text-violet-300"}`}
            >
              Masuk di Sini
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
