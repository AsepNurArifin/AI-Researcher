import Link from "next/link";
import { notFound } from "next/navigation";

const matches = {
  "nova-ai-research": {
    role: "AI Research Assistant",
    company: "Nova Labs",
    location: "Remote",
    matchScore: "82%",
    relevance: "0.86",
    description:
      "Support semantic search pipelines, resume parsing, and recruiter ranking models.",
    matchedSkills: ["Python", "NLP", "FastAPI", "PostgreSQL"],
    missingSkills: ["pgvector", "Docker", "spaCy"],
    missingKeywords: ["ATS", "resume parsing", "semantic similarity"],
    weakWording: [
      {
        phrase: "Responsible for ranking models",
        suggestion: "Improved ranking model accuracy by 10%.",
      },
    ],
    atsNotes: [
      "Add measurable impact metrics to the experience section.",
      "Include missing keywords: pgvector, resume parsing, ATS.",
      "Replace weak verbs with action-oriented phrasing.",
    ],
    atsRecommendations: [
      "Mirror job description phrasing where accurate.",
      "Place skills above projects for ATS scanning.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 84 },
      { label: "Experience alignment", value: 76 },
      { label: "Education fit", value: 88 },
      { label: "Keyword match", value: 69 },
    ],
  },
  "signalflow-ml-engineer": {
    role: "ML Engineer",
    company: "SignalFlow",
    location: "Singapore",
    matchScore: "74%",
    relevance: "0.79",
    description:
      "Own model training pipelines, monitoring, and deployment workflows.",
    matchedSkills: ["Python", "SQL", "FastAPI"],
    missingSkills: ["Docker", "MLOps", "Kubernetes"],
    missingKeywords: ["MLOps", "deployment", "monitoring"],
    weakWording: [
      {
        phrase: "Worked on deployment pipelines",
        suggestion: "Built deployment pipelines cutting release time by 20%.",
      },
    ],
    atsNotes: [
      "Emphasize deployment experience and CI/CD tooling.",
      "Add MLOps keywords and on-call readiness.",
      "Clarify scale of models and datasets.",
    ],
    atsRecommendations: [
      "Add monitoring and incident response keywords.",
      "Quantify model performance improvements.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 72 },
      { label: "Experience alignment", value: 70 },
      { label: "Education fit", value: 85 },
      { label: "Keyword match", value: 68 },
    ],
  },
  "brightedge-data-scientist": {
    role: "Data Scientist",
    company: "BrightEdge",
    location: "Jakarta",
    matchScore: "63%",
    relevance: "0.71",
    description:
      "Lead experimentation, causal inference, and stakeholder insights.",
    matchedSkills: ["Python", "SQL"],
    missingSkills: ["Statistics", "Experimentation", "Causal inference"],
    missingKeywords: ["A/B testing", "causal inference", "experimentation"],
    weakWording: [
      {
        phrase: "Assisted with experiment analysis",
        suggestion: "Led A/B testing analysis for growth experiments.",
      },
    ],
    atsNotes: [
      "Add experimentation frameworks and A/B testing results.",
      "Highlight stakeholder collaboration and reporting cadence.",
      "Improve keyword alignment to analytics tooling.",
    ],
    atsRecommendations: [
      "Add experimentation tooling and reporting cadence.",
      "Clarify impact metrics and statistical methods used.",
    ],
    breakdown: [
      { label: "Skills coverage", value: 61 },
      { label: "Experience alignment", value: 64 },
      { label: "Education fit", value: 82 },
      { label: "Keyword match", value: 58 },
    ],
  },
} as const;

type MatchKey = keyof typeof matches;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = matches[matchId as MatchKey];

  if (!match) {
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
            Back to match history
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {match.role} · {match.company}
            </h1>
            <p className="text-sm text-slate-300">{match.description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Location: {match.location}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Match score: {match.matchScore}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Semantic relevance: {match.relevance}
            </span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              Match visualization
            </h2>
            <div className="mt-4 space-y-3">
              {match.breakdown.map((item) => (
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
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Skills alignment
              </h2>
              <p className="text-sm text-slate-400">
                Matched and missing skills for this role.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Matched skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {match.matchedSkills.map((skill) => (
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
                {match.missingSkills.map((skill) => (
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
            Weak wording and ATS optimization recommendations.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {match.atsNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Missing keyword suggestions
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {match.missingKeywords.map((keyword) => (
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
                {match.weakWording.map((item) => (
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
              {match.atsRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
