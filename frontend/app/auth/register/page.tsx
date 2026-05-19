"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const roles = ["Candidate", "Recruiter"];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("Candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.register({
        name,
        email,
        password,
        role: role.toLowerCase(),
      });
      // Redirect to login after successful registration
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold text-white">Create account</h1>
          <p className="text-slate-300">
            Get personalized fit scores and recruiter-ready rankings.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-8">
          {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white">
              Choose your role
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
                >
                  <input
                    type="radio"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-200">
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
          <p className="text-xs text-slate-400">
            Accounts are protected with JWT sessions and role-based access.
          </p>
        </form>
      </div>
    </div>
  );
}
