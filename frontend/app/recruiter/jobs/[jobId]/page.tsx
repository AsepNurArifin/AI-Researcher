"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [job, setJob] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const jobsList = await api.getJobs();
        const foundJob = jobsList.find((j: any) => j.id.toString() === jobId);
        if (foundJob) {
          setJob(foundJob);
          const cands = await api.getJobCandidates(jobId);
          setCandidates(cands.candidates);
        } else {
          setJob(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [jobId]);

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  if (!job) {
    return <div className="p-10 text-white">Job not found.</div>;
  }

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <Link
            href="/recruiter/jobs"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"
          >
            Back to job postings
          </Link>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-white">{job.title}</h1>
            <p className="text-sm text-slate-300">{job.description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Status: Active
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              ID: {job.id}
            </span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Candidate ranking</h2>
            <p className="text-sm text-slate-400">
              Sorted by semantic similarity and skill coverage.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-5 gap-4 border-b border-white/10 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Candidate</span>
                <span>Match</span>
                <span>Relevance</span>
                <span>Missing skills</span>
                <span>Stage</span>
              </div>
              <div className="divide-y divide-white/5">
                {candidates.length > 0 ? candidates.map((c: any) => (
                  <div
                    key={c.candidate_id}
                    className="grid grid-cols-5 gap-4 px-4 py-4 text-sm text-slate-200"
                  >
                    <span className="font-medium text-white transition hover:text-emerald-200">
                      {c.candidate_name}
                    </span>
                    <span className="text-emerald-300">{Math.round(c.match_percentage)}%</span>
                    <span>{c.semantic_relevance.toFixed(2)}</span>
                    <span>{c.missing_skills?.length || 0} missing</span>
                    <span>Reviewing</span>
                  </div>
                )) : (
                  <div className="px-4 py-4 text-sm text-slate-400">No candidates matched yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Job requirements
              </h2>
              <p className="text-sm text-slate-400">
                Skills used to compute matching scores.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {job.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Filters</p>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-2 text-xs text-slate-300">
                  Minimum match score
                  <input
                    type="range"
                    min="60"
                    max="100"
                    defaultValue="80"
                    className="accent-emerald-400"
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-300">
                  Must-have skills
                  <input
                    type="text"
                    placeholder="NLP, SQL"
                    className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white placeholder:text-slate-500"
                  />
                </label>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950"
                >
                  Apply filters
                </button>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white"
            >
              Export candidate list
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
