import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            MVP: Resume ↔ Job Matching
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            HireSense AI shows candidates their fit and helps recruiters rank
            talent in seconds.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Upload a resume, paste a job description, and get a matching score,
            missing skills, and ATS-ready recommendations. Recruiters get
            ranked candidates with clear skill gaps and semantic relevance.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href="/candidate"
              className="rounded-full bg-white px-6 py-3 text-slate-950 transition hover:bg-slate-200"
            >
              Go to Candidate Dashboard
            </Link>
            <Link
              href="/recruiter"
              className="rounded-full border border-white/20 px-6 py-3 text-white transition hover:border-white/60"
            >
              Go to Recruiter Dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Resume parsing",
              description:
                "Upload PDF/DOCX resumes with size limits and safe validation.",
            },
            {
              title: "AI matching output",
              description:
                "Matching percentage, semantic relevance, and skill gaps in one view.",
            },
            {
              title: "Recruiter ranking",
              description:
                "Automatic candidate ranking and shortlisting with filters.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-white/10 bg-slate-900/40">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Candidate workflow
            </h2>
            <ol className="space-y-4 text-sm text-slate-300">
              <li>1. Register and upload a resume (PDF/DOCX).</li>
              <li>2. Paste a job description you want to target.</li>
              <li>
                3. Review matching score, missing skills, and ATS feedback.
              </li>
            </ol>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">
              Recruiter workflow
            </h2>
            <ol className="space-y-4 text-sm text-slate-300">
              <li>1. Create a job posting and define must-have skills.</li>
              <li>2. See ranked candidates based on semantic similarity.</li>
              <li>3. Shortlist top fits and export the list.</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
