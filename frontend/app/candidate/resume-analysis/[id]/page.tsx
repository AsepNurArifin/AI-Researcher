import Link from "next/link";
import { notFound } from "next/navigation";

const analyses = {
  "resume-v4": {
    fileName: "Resume_v4.pdf",
    candidate: "Alya Hartono",
    uploaded: "Today, 10:24",
    skills: ["NLP", "Python", "FastAPI", "PostgreSQL", "TypeScript"],
    education: "B.Sc. Computer Science · 2023",
    experience: "3 years in ML · 2 internships",
    projects: "ATS Resume Analyzer, Job Matcher",
    certifications: "AWS ML Specialty, TensorFlow Developer",
    score: "82%",
    relevance: "0.86",
    atsReadiness: "Moderate",
    matchedSkills: ["Python", "NLP", "PostgreSQL", "FastAPI"],
    missingSkills: ["pgvector", "Docker", "spaCy"],
    missingKeywords: ["ATS", "resume parsing", "semantic similarity"],
    weakWording: [
      {
        phrase: "Responsible for model evaluation",
        suggestion: "Evaluated models with 15% accuracy lift.",
      },
      {
        phrase: "Helped build a matching system",
        suggestion: "Built a matching system improving precision by 12%.",
      },
    ],
    feedback: [
      "Highlight impact with metrics and quantified outcomes.",
      "Add missing keywords: pgvector, resume parsing, NLP.",
      "Replace weak verbs with measurable actions.",
      "Optimize summary for ATS readability.",
    ],
    atsRecommendations: [
      "Start bullet points with strong action verbs.",
      "Keep the skills section above projects for ATS parsing.",
      "Mirror the job description's terminology where accurate.",
    ],
  },
  "resume-v3": {
    fileName: "Resume_v3.docx",
    candidate: "Alya Hartono",
    uploaded: "May 04",
    skills: ["Python", "SQL", "React", "FastAPI"],
    education: "B.Sc. Computer Science · 2023",
    experience: "2 years in ML · 1 internship",
    projects: "Job Description Analyzer",
    certifications: "Google Data Analytics",
    score: "74%",
    relevance: "0.79",
    atsReadiness: "Needs improvement",
    matchedSkills: ["Python", "SQL", "FastAPI"],
    missingSkills: ["NLP", "pgvector", "Docker"],
    missingKeywords: ["semantic search", "vector database", "ATS"],
    weakWording: [
      {
        phrase: "Worked on data pipelines",
        suggestion: "Designed pipelines reducing processing time by 30%.",
      },
    ],
    feedback: [
      "Add semantic search tooling experience.",
      "Expand ML pipeline description.",
      "Include ATS keywords from job descriptions.",
    ],
    atsRecommendations: [
      "Include quantifiable outcomes for each project.",
      "Move certifications above projects to increase visibility.",
    ],
  },
  "internship-resume": {
    fileName: "Internship_Resume.pdf",
    candidate: "Alya Hartono",
    uploaded: "Apr 19",
    skills: ["Python", "SQL", "Statistics"],
    education: "B.Sc. Computer Science · 2023",
    experience: "1 internship in data science",
    projects: "NLP Coursework, Data Dashboard",
    certifications: "None",
    score: "63%",
    relevance: "0.71",
    atsReadiness: "Low",
    matchedSkills: ["Python", "SQL"],
    missingSkills: ["NLP", "FastAPI", "pgvector"],
    missingKeywords: ["ATS", "semantic similarity", "resume parsing"],
    weakWording: [
      {
        phrase: "Assisted with analysis tasks",
        suggestion: "Delivered weekly analysis reports for 5 stakeholders.",
      },
    ],
    feedback: [
      "Add project outcomes and measurable impact.",
      "Include ML deployment or API experience.",
      "Reorder sections for ATS clarity.",
    ],
    atsRecommendations: [
      "Add a concise summary aligned with target roles.",
      "List technical skills in a dedicated section.",
    ],
  },
} as const;

type AnalysisKey = keyof typeof analyses;

export default async function ResumeAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = analyses[id as AnalysisKey];

  if (!analysis) {
    notFound();
  }

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <Link
            href="/candidate"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"
          >
            Back to candidate dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Resume analysis
            </h1>
            <p className="text-sm text-slate-300">
              {analysis.fileName} · Uploaded {analysis.uploaded}
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              Extracted data
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Candidate", value: analysis.candidate },
                { label: "Education", value: analysis.education },
                { label: "Experience", value: analysis.experience },
                { label: "Projects", value: analysis.projects },
                { label: "Certifications", value: analysis.certifications },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">{item.value}</p>
                </div>
              ))}
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {analysis.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Matching summary
              </h2>
              <p className="text-sm text-slate-400">
                Compatibility with the latest job description.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Match score
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {analysis.score}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Semantic relevance: {analysis.relevance}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Matched skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {analysis.matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Missing skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {analysis.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-rose-400/20 px-3 py-1 text-rose-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Resume feedback
              </h2>
              <p className="text-sm text-slate-400">
                Weak wording detection and ATS recommendations.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
              ATS readiness: {analysis.atsReadiness}
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {analysis.feedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Missing keyword suggestions
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {analysis.missingKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Weak wording detection
              </p>
              <div className="mt-3 space-y-3 text-xs text-slate-300">
                {analysis.weakWording.map((item) => (
                  <div key={item.phrase}>
                    <p className="text-slate-400">“{item.phrase}”</p>
                    <p className="text-emerald-200">
                      Suggested: {item.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              ATS optimization recommendations
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {analysis.atsRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
