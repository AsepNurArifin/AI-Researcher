"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";

const matchedSkills = ["Python", "NLP", "PostgreSQL", "FastAPI", "TypeScript"];
const missingSkills = ["pgvector", "Docker", "spaCy", "Resume parsing"];
const missingKeywords = [
  "ATS",
  "resume parsing",
  "semantic similarity",
  "vector search",
];
const weakWordingSamples = [
  {
    phrase: "Responsible for resume parsing",
    suggestion: "Built a resume parser that improved extraction accuracy by 12%.",
  },
  {
    phrase: "Helped with job matching",
    suggestion: "Improved job matching precision by 9% using embeddings.",
  },
];
const atsRecommendations = [
  "Start bullet points with action verbs and measurable outcomes.",
  "Place skills and certifications above projects for ATS visibility.",
  "Mirror job description terminology where accurate and truthful.",
];
const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedExtensions = [".pdf", ".doc", ".docx"];
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const extractedData = [
  {
    label: "Skills",
    value: "NLP, Transformers, Python, SQL, React, FastAPI",
  },
  {
    label: "Education",
    value: "B.Sc. Computer Science · 2023",
  },
  {
    label: "Experience",
    value: "3 years in ML · 2 industry internships",
  },
  {
    label: "Projects",
    value: "ATS Resume Analyzer, Job Matcher",
  },
  {
    label: "Certifications",
    value: "AWS ML Specialty, TensorFlow Developer",
  },
];

const improvementTracking = [
  {
    date: "Apr 02",
    score: "68%",
    note: "Added quantified impact statements.",
  },
  {
    date: "Apr 20",
    score: "74%",
    note: "Expanded NLP and parsing stack coverage.",
  },
  {
    date: "May 12",
    score: "82%",
    note: "Aligned keywords with job description.",
  },
];

const uploadHistory = [
  {
    id: "resume-v4",
    file: "Resume_v4.pdf",
    date: "Today, 10:24",
    status: "Parsed",
  },
  {
    id: "resume-v3",
    file: "Resume_v3.docx",
    date: "May 04",
    status: "Parsed",
  },
  {
    id: "internship-resume",
    file: "Internship_Resume.pdf",
    date: "Apr 19",
    status: "Needs review",
  },
];

const matchBreakdown = [
  {
    label: "Skills coverage",
    value: 84,
  },
  {
    label: "Experience alignment",
    value: 76,
  },
  {
    label: "Education fit",
    value: 88,
  },
  {
    label: "Keyword match",
    value: 69,
  },
];

const savedJobs = [
  {
    role: "AI Research Assistant",
    company: "Nova Labs",
    location: "Remote",
    status: "Saved",
    updated: "Today",
  },
  {
    role: "ML Engineer",
    company: "SignalFlow",
    location: "Singapore",
    status: "Applied",
    updated: "May 08",
  },
  {
    role: "Data Scientist",
    company: "BrightEdge",
    location: "Jakarta",
    status: "Saved",
    updated: "Apr 28",
  },
];

const matchHistory = [
  {
    id: "nova-ai-research",
    role: "AI Research Assistant",
    company: "Nova Labs",
    score: "82%",
    status: "Strong fit",
  },
  {
    id: "signalflow-ml-engineer",
    role: "ML Engineer",
    company: "SignalFlow",
    score: "74%",
    status: "Good fit",
  },
  {
    id: "brightedge-data-scientist",
    role: "Data Scientist",
    company: "BrightEdge",
    score: "63%",
    status: "Needs improvements",
  },
];

export default function CandidateDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [extractedDataState, setExtractedDataState] = useState<any | null>(null);
  
  const [jobDescription, setJobDescription] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadResume(file);
      setUploadedResumeId(res.resume_id);
      setExtractedDataState(res.parsed_data);
      alert("Resume uploaded successfully!");
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleMatch = async () => {
    if (!uploadedResumeId) {
      alert("Please upload a resume first!");
      return;
    }
    if (!jobDescription) {
      alert("Please enter a job description.");
      return;
    }
    setMatching(true);
    try {
      const res = await api.matchJob({
        resume_id: uploadedResumeId,
        job_description: jobDescription,
        job_title: "Target Job",
      });
      setMatchResult(res);
    } catch (err: any) {
      alert(err.message || "Matching failed");
    } finally {
      setMatching(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setUploadError(null);
      setSelectedFileName(null);
      setFileToUpload(null);
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const hasValidType =
      allowedMimeTypes.includes(file.type) || allowedExtensions.includes(extension);

    if (!hasValidType) {
      setUploadError("Only PDF or DOCX files are supported.");
      setSelectedFileName(null);
      setFileToUpload(null);
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setUploadError("File exceeds the 5MB limit.");
      setSelectedFileName(null);
      setFileToUpload(null);
      event.target.value = "";
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);
    setFileToUpload(file);
    handleUpload(file);
  };

  return (
    <div className="bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Candidate dashboard
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Resume → Job matching insights
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Upload your resume, paste a job description, and review fit scores,
            missing skills, and ATS recommendations.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Role: Candidate
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              JWT session: Active
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
              Access: Candidate-only
            </span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              label: "Resume status",
              value: "Parsed successfully",
              helper: "Last updated: Today, 10:24",
            },
            {
              label: "Latest match score",
              value: "82%",
              helper: "Semantic relevance: 0.86",
            },
            {
              label: "Missing skills",
              value: "4 skills",
              helper: "Focus for the next iteration",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{card.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Upload resume
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                PDF or DOCX only. Max 5MB. Files are scanned for safety.
              </p>
            </div>
            <label className="flex flex-col gap-3 rounded-xl border border-dashed border-white/20 bg-slate-950/60 px-6 py-8 text-sm text-slate-300">
              <span className="font-semibold text-white">
                Drag & drop or browse files
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="text-sm text-slate-300 file:rounded-full file:border-0 file:bg-emerald-400/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-emerald-200"
              />
              {uploadError ? (
                <span className="text-xs text-rose-300">{uploadError}</span>
              ) : uploading ? (
                <span className="text-xs text-emerald-200">Uploading...</span>
              ) : selectedFileName ? (
                <span className="text-xs text-emerald-200">
                  Selected: {selectedFileName}
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Accepted: PDF, DOC, DOCX · Max 5MB
                </span>
              )}
            </label>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Extracted data
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {extractedDataState ? (
                  <>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Skills</p>
                      <p className="mt-2 text-sm text-slate-200">{extractedDataState.skills?.join(", ")}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Education</p>
                      <p className="mt-2 text-sm text-slate-200">{extractedDataState.education}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Experience</p>
                      <p className="mt-2 text-sm text-slate-200">{extractedDataState.experience}</p>
                    </div>
                  </>
                ) : (
                  extractedData.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        {item.value}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Job description
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Paste a description to generate a matching score.
              </p>
            </div>
            <textarea
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleMatch}
              disabled={matching}
              className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {matching ? "Analyzing..." : "Run match analysis"}
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white">Match output</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Matching percentage
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {matchResult ? Math.round(matchResult.match_percentage) : 82}%
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Semantic relevance: {matchResult ? matchResult.semantic_relevance.toFixed(2) : 0.86}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  ATS readiness
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {matchResult ? (matchResult.match_percentage > 80 ? "High" : "Moderate") : "Moderate"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {matchResult ? matchResult.missing_skills?.length || 0 : 12} missing keywords flagged
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Matched skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {(matchResult ? matchResult.matched_skills : matchedSkills).map((skill: string) => (
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
                  {(matchResult ? matchResult.missing_skills : missingSkills).map((skill: string) => (
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
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Match visualization
              </p>
              <div className="mt-4 space-y-3">
                {matchBreakdown.map((item) => (
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
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Resume feedback</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Highlight impact with metrics and quantified outcomes.</li>
              <li>Add missing keywords: “pgvector”, “resume parsing”, “NLP”.</li>
              <li>Weak wording found: replace “responsible for” with action verbs.</li>
              <li>Simplify phrasing in the summary for ATS clarity.</li>
              <li>Move certifications above projects for this role.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Missing keyword suggestions
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {missingKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Weak wording detection
                </p>
                <div className="mt-3 space-y-3 text-xs text-slate-300">
                  {weakWordingSamples.map((item) => (
                    <div key={item.phrase}>
                      <p className="text-slate-400">“{item.phrase}”</p>
                      <p className="text-emerald-200">
                        Suggested: {item.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  ATS optimization recommendations
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {atsRecommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Improvement tracking
                </h2>
                <p className="text-sm text-slate-400">
                  Score progression across resume iterations.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                +14% in 6 weeks
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {improvementTracking.map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {entry.date}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{entry.note}</p>
                  </div>
                  <span className="text-lg font-semibold text-emerald-300">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Upload history</h2>
            <p className="text-sm text-slate-400">
              Track parsing status and resume versions.
            </p>
            <div className="mt-5 space-y-3">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div>
                    <Link
                      href={`/candidate/resume-analysis/${upload.id}`}
                      className="font-semibold text-white transition hover:text-emerald-200"
                    >
                      {upload.file}
                    </Link>
                    <p className="text-xs text-slate-400">{upload.date}</p>
                  </div>
                  <span
                    className={
                      upload.status === "Parsed"
                        ? "rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200"
                        : "rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200"
                    }
                  >
                    {upload.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Match history
              </h2>
              <p className="text-sm text-slate-400">
                Track your progress over time.
              </p>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-4 gap-4 border-b border-white/10 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Role</span>
              <span>Company</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-white/5">
              {matchHistory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-4 px-4 py-4 text-sm text-slate-200"
                >
                  <Link
                    href={`/candidate/matches/${item.id}`}
                    className="font-medium text-white transition hover:text-emerald-200"
                  >
                    {item.role}
                  </Link>
                  <span>{item.company}</span>
                  <span>{item.score}</span>
                  <span className="text-emerald-300">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Saved jobs</h2>
              <p className="text-sm text-slate-400">
                Roles you bookmarked for quick follow-up.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white"
            >
              Manage saved jobs
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {savedJobs.map((job) => (
              <div
                key={`${job.role}-${job.company}`}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{job.role}</p>
                  <p className="text-xs text-slate-400">
                    {job.company} · {job.location}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={
                      job.status === "Applied"
                        ? "rounded-full bg-emerald-400/20 px-3 py-1 font-semibold text-emerald-200"
                        : "rounded-full bg-amber-400/20 px-3 py-1 font-semibold text-amber-200"
                    }
                  >
                    {job.status}
                  </span>
                  <span className="text-slate-400">Updated {job.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
