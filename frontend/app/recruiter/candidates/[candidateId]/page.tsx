import Link from "next/link";
import { notFound } from "next/navigation";

const candidates = {
  "alya-hartono": {
    name: "Alya Hartono",
    headline: "ML Engineer · 3 years experience",
    location: "Remote",
    matchScore: "91%",
    relevance: "0.92",
    jobTitle: "AI Research Assistant",
    jobSlug: "ai-research-assistant",
    skills: ["Python", "NLP", "FastAPI", "PostgreSQL", "TypeScript"],
    missingSkills: ["Docker", "pgvector"],
    education: "B.Sc. Computer Science · 2023",
    experience: "3 years in ML · 2 internships",
    projects: "ATS Resume Analyzer, Job Matcher",
    certifications: "AWS ML Specialty, TensorFlow Developer",
    feedback: [
      "Add measurable impact metrics to recent projects.",
      "Include missing keywords: pgvector, resume parsing, ATS.",
      "Replace weak verbs with action-oriented phrasing.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 88 },
      { label: "Experience alignment", value: 84 },
      { label: "Education fit", value: 90 },
      { label: "Keyword match", value: 78 },
    ],
  },
  "rafi-prasetyo": {
    name: "Rafi Prasetyo",
    headline: "Data Scientist · 2 years experience",
    location: "Singapore",
    matchScore: "86%",
    relevance: "0.88",
    jobTitle: "AI Research Assistant",
    jobSlug: "ai-research-assistant",
    skills: ["Python", "SQL", "Statistics", "FastAPI"],
    missingSkills: ["spaCy"],
    education: "B.Sc. Statistics · 2022",
    experience: "2 years in data science",
    projects: "Customer Segmentation, NLP Classifier",
    certifications: "Google Data Analytics",
    feedback: [
      "Emphasize semantic search tooling experience.",
      "Add structured ATS keywords from job descriptions.",
      "Clarify scale of datasets used in experiments.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 82 },
      { label: "Experience alignment", value: 80 },
      { label: "Education fit", value: 86 },
      { label: "Keyword match", value: 72 },
    ],
  },
  "maya-santoso": {
    name: "Maya Santoso",
    headline: "NLP Researcher · 4 years experience",
    location: "Jakarta",
    matchScore: "79%",
    relevance: "0.82",
    jobTitle: "AI Research Assistant",
    jobSlug: "ai-research-assistant",
    skills: ["NLP", "Python", "Transformers", "Research"],
    missingSkills: ["FastAPI"],
    education: "M.Sc. Computer Science · 2021",
    experience: "4 years in NLP research",
    projects: "Text Summarization, Intent Detection",
    certifications: "None",
    feedback: [
      "Add deployment or API experience to strengthen fit.",
      "Include ATS keywords for backend services.",
      "Quantify model improvements and impact.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 78 },
      { label: "Experience alignment", value: 74 },
      { label: "Education fit", value: 92 },
      { label: "Keyword match", value: 68 },
    ],
  },
  "isabel-tan": {
    name: "Isabel Tan",
    headline: "ML Engineer · 5 years experience",
    location: "Singapore",
    matchScore: "77%",
    relevance: "0.79",
    jobTitle: "ML Engineer",
    jobSlug: "ml-engineer",
    skills: ["Python", "PyTorch", "MLOps", "AWS"],
    missingSkills: ["Docker"],
    education: "B.Eng. Software Engineering · 2019",
    experience: "5 years in ML engineering",
    projects: "Model Monitoring, Feature Store",
    certifications: "AWS ML Specialty",
    feedback: [
      "Include Docker and CI/CD tooling details.",
      "Quantify model latency improvements.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 75 },
      { label: "Experience alignment", value: 78 },
      { label: "Education fit", value: 88 },
      { label: "Keyword match", value: 66 },
    ],
  },
  "lia-purnama": {
    name: "Lia Purnama",
    headline: "Data Scientist · 3 years experience",
    location: "Jakarta",
    matchScore: "88%",
    relevance: "0.9",
    jobTitle: "Data Scientist",
    jobSlug: "data-scientist",
    skills: ["Python", "SQL", "Experimentation", "Statistics"],
    missingSkills: ["Causal inference"],
    education: "B.Sc. Applied Math · 2020",
    experience: "3 years in data science",
    projects: "Growth Experiments, Forecasting",
    certifications: "None",
    feedback: [
      "Add causal inference tooling experience.",
      "Highlight stakeholder impact metrics.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 84 },
      { label: "Experience alignment", value: 86 },
      { label: "Education fit", value: 85 },
      { label: "Keyword match", value: 74 },
    ],
  },
} as const;

type CandidateKey = keyof typeof candidates;

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const candidate = candidates[candidateId as CandidateKey];

  if (!candidate) {
    notFound();
  }

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <Link
            href="/recruiter"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"
          >
            Back to recruiter dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {candidate.name}
            </h1>
            <p className="text-sm text-slate-300">{candidate.headline}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Location: {candidate.location}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Match score: {candidate.matchScore}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Semantic relevance: {candidate.relevance}
            </span>
            <Link
              href={`/recruiter/jobs/${candidate.jobSlug}`}
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200"
            >
              {candidate.jobTitle}
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              Candidate profile
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Education", value: candidate.education },
                { label: "Experience", value: candidate.experience },
                { label: "Projects", value: candidate.projects },
                { label: "Certifications", value: candidate.certifications },
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
                  {candidate.skills.map((skill) => (
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
                Match visualization
              </h2>
              <p className="text-sm text-slate-400">
                Breakdown of the candidate’s fit for {candidate.jobTitle}.
              </p>
            </div>
            <div className="space-y-3">
              {candidate.breakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{item.label}</span>
                    <span className="text-emerald-200">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Missing skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {candidate.missingSkills.map((skill) => (
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
          <h2 className="text-lg font-semibold text-white">
            Resume feedback
          </h2>
          <p className="text-sm text-slate-400">
            ATS recommendations for strengthening the candidate’s profile.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {candidate.feedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
