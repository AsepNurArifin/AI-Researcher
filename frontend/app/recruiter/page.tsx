"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";

const rankedCandidates = [
  {
    id: "alya-hartono",
    name: "Alya Hartono",
    title: "ML Engineer",
    score: "91%",
    relevance: "0.92",
    missingSkills: "Docker, pgvector",
  },
  {
    id: "rafi-prasetyo",
    name: "Rafi Prasetyo",
    title: "Data Scientist",
    score: "86%",
    relevance: "0.88",
    missingSkills: "spaCy",
  },
  {
    id: "maya-santoso",
    name: "Maya Santoso",
    title: "NLP Researcher",
    score: "79%",
    relevance: "0.82",
    missingSkills: "FastAPI",
  },
];

const jobPostings = [
  {
    title: "AI Research Assistant",
    slug: "ai-research-assistant",
    status: "Active",
    candidates: 12,
    updated: "Today",
  },
  {
    title: "ML Engineer",
    slug: "ml-engineer",
    status: "Draft",
    candidates: 0,
    updated: "May 10",
  },
  {
    title: "Data Scientist",
    slug: "data-scientist",
    status: "Closed",
    candidates: 28,
    updated: "Apr 22",
  },
];

const shortlistedCandidates = [
  {
    id: "alya-hartono",
    name: "Alya Hartono",
    role: "ML Engineer",
    score: "91%",
    stage: "Interview",
  },
  {
    id: "rafi-prasetyo",
    name: "Rafi Prasetyo",
    role: "Data Scientist",
    score: "86%",
    stage: "Reviewing",
  },
  {
    id: "maya-santoso",
    name: "Maya Santoso",
    role: "NLP Researcher",
    score: "79%",
    stage: "Assessment",
  },
];

export default function RecruiterDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async () => {
    if (!title || !description) return;
    setCreating(true);
    try {
      await api.createJob({
        title,
        description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      alert("Job created successfully!");
      setTitle("");
      setSkills("");
      setDescription("");
      fetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to create job");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Recruiter dashboard
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Rank candidates and manage job postings
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Create job descriptions, view semantic match scores, and shortlist
            the best-fit candidates.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Role: Recruiter
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              JWT session: Active
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Access: Recruiter-only
            </span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Create a job posting
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Add required skills and responsibilities to generate matches.
              </p>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-200">
                Job title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AI Research Assistant"
                  className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                Required skills
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="NLP, Python, FastAPI, pgvector"
                  className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                Job description
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleCreateJob}
              disabled={creating}
              className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {creating ? "Publishing..." : "Publish job posting"}
            </button>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Filters & shortlist
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Narrow candidates by score or missing skills.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200">
              <label className="grid gap-2">
                Minimum score
                <input
                  type="range"
                  min="60"
                  max="100"
                  defaultValue="80"
                  className="accent-emerald-400"
                />
              </label>
              <label className="grid gap-2">
                Must-have skills
                <input
                  type="text"
                  placeholder="Transformers, SQL"
                  className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-500"
                />
              </label>
              <label className="grid gap-2">
                Availability
                <select className="h-11 rounded-lg border border-white/10 bg-slate-950 px-4 text-sm text-white">
                  <option>Any</option>
                  <option>Immediate</option>
                  <option>2 weeks</option>
                  <option>1 month</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white"
            >
              Save shortlist
            </button>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Shortlist status</p>
              <p className="mt-1">3 candidates saved · Last update 09:14</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Job management
                </h2>
                <p className="text-sm text-slate-400">
                  Track active, draft, and closed roles.
                </p>
              </div>
              <Link
                href="/recruiter/jobs"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
              >
                View all jobs
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {jobs.length > 0 ? jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div>
                    <Link
                      href={`/recruiter/jobs/${job.id}`}
                      className="font-semibold text-white transition hover:text-emerald-200"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      ID: {job.id}
                    </p>
                  </div>
                  <span
                    className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200"
                  >
                    Active
                  </span>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No active jobs found.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Candidate shortlist
                </h2>
                <p className="text-sm text-slate-400">
                  Prioritize top-fit candidates for outreach.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
              >
                Share shortlist
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {shortlistedCandidates.map((candidate) => (
                <div
                  key={candidate.name}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div>
                    <Link
                      href={`/recruiter/candidates/${candidate.id}`}
                      className="font-semibold text-white transition hover:text-emerald-200"
                    >
                      {candidate.name}
                    </Link>
                    <p className="text-xs text-slate-400">{candidate.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-300">
                      {candidate.score}
                    </p>
                    <p className="text-xs text-slate-400">{candidate.stage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Candidate ranking
              </h2>
              <p className="text-sm text-slate-400">
                Sorted by semantic similarity and skill match.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
            >
              Export list
            </button>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-5 gap-4 border-b border-white/10 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Candidate</span>
              <span>Target role</span>
              <span>Match score</span>
              <span>Relevance</span>
              <span>Missing skills</span>
            </div>
            <div className="divide-y divide-white/5">
              {rankedCandidates.map((candidate) => (
                <div
                  key={candidate.name}
                  className="grid grid-cols-5 gap-4 px-4 py-4 text-sm text-slate-200"
                >
                  <Link
                    href={`/recruiter/candidates/${candidate.id}`}
                    className="font-medium text-white transition hover:text-emerald-200"
                  >
                    {candidate.name}
                  </Link>
                  <span>{candidate.title}</span>
                  <span className="text-emerald-300">{candidate.score}</span>
                  <span>{candidate.relevance}</span>
                  <span>{candidate.missingSkills}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
