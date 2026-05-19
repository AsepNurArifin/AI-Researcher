import Link from "next/link";

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

export default function RecruiterJobsPage() {
  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Recruiter jobs
          </p>
          <h1 className="text-3xl font-semibold text-white">Job postings</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Track role status, candidate volume, and open details to view ranked
            applicants.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Active job listings
              </h2>
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
              >
                Create new job
              </button>
            </div>
            <div className="space-y-3">
              {jobPostings.map((job) => (
                <div
                  key={job.title}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div>
                    <Link
                      href={`/recruiter/jobs/${job.slug}`}
                      className="font-semibold text-white transition hover:text-emerald-200"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {job.candidates} candidates · Updated {job.updated}
                    </p>
                  </div>
                  <span
                    className={
                      job.status === "Active"
                        ? "rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200"
                        : job.status === "Draft"
                          ? "rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200"
                          : "rounded-full bg-slate-400/20 px-3 py-1 text-xs font-semibold text-slate-200"
                    }
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Job performance
              </h2>
              <p className="text-sm text-slate-400">
                Snapshot of candidate flow and matching quality.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-slate-200">
              {[
                {
                  label: "Average match score",
                  value: "78%",
                  helper: "Top 10 candidates",
                },
                {
                  label: "Resumes processed",
                  value: "143",
                  helper: "Past 30 days",
                },
                {
                  label: "Shortlisted candidates",
                  value: "18",
                  helper: "Awaiting review",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{metric.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
