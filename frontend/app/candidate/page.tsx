"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, getUserRole } from "@/lib/api";
import ScoreRing from "@/components/ScoreRing";
import SkeletonCard from "@/components/SkeletonCard";

const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedExtensions = [".pdf", ".doc", ".docx"];
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function CandidateDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const role = getUserRole();
    if (role && role !== "candidate") {
      router.push("/recruiter");
    }
  }, [router]);

  // Upload state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [extractedDataState, setExtractedDataState] = useState<any | null>(null);

  // Job description + matching state
  const [jobDescription, setJobDescription] = useState("");
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);

  // Data loaded from backend
  const [resumes, setResumes] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // New Fase 4 states
  const [activeTab, setActiveTab] = useState<"evaluations" | "jobs">("evaluations");
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [appliedJobsStatus, setAppliedJobsStatus] = useState<{ [jobId: string]: boolean }>({});

  // Fetch resume list and match history on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const role = getUserRole();
    if (role && role !== "candidate") return;

    async function fetchData() {
      try {
        const resumeData = await api.getResumes();
        setResumes(resumeData);
        // Auto-select the latest resume
        if (resumeData.length > 0) {
          setUploadedResumeId(resumeData[0].resume_id);
          setExtractedDataState(resumeData[0].parsed_data);
        }
      } catch (err) {
        console.error("Failed to load resumes:", err);
      } finally {
        setLoadingResumes(false);
      }

      try {
        const matchData = await api.getMatches();
        setMatchHistory(matchData);
      } catch (err) {
        console.error("Failed to load matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    }
    fetchData();
  }, []);

  // Fetch public jobs list when tab switches
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const jobsData = await api.getJobs();
      setAvailableJobs(jobsData);
      
      const statusMap: { [jobId: string]: boolean } = {};
      await Promise.all(
        jobsData.map(async (job: any) => {
          try {
            const statusRes = await api.checkAppliedStatus(job.id);
            statusMap[job.id] = statusRes.applied;
          } catch (e) {
            console.error("Error checking applied status:", job.id, e);
          }
        })
      );
      setAppliedJobsStatus(statusMap);
    } catch (err) {
      console.error("Failed to load available jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs();
    }
  }, [activeTab]);

  const handleDeleteResume = async (resumeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus resume ini? Semua data analisis dan lamaran terkait akan terhapus secara permanen.")) {
      return;
    }
    try {
      await api.deleteResume(resumeId);
      const resumeData = await api.getResumes();
      setResumes(resumeData);
      if (uploadedResumeId === resumeId) {
        if (resumeData.length > 0) {
          setUploadedResumeId(resumeData[0].resume_id);
          setExtractedDataState(resumeData[0].parsed_data);
        } else {
          setUploadedResumeId(null);
          setExtractedDataState(null);
        }
      }
      const matchData = await api.getMatches();
      setMatchHistory(matchData);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus resume");
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    try {
      await api.applyJob(selectedJob.id);
      alert(`Berhasil mengirimkan lamaran untuk posisi ${selectedJob.title}!`);
      setAppliedJobsStatus(prev => ({ ...prev, [selectedJob.id]: true }));
      const matchData = await api.getMatches();
      setMatchHistory(matchData);
    } catch (err: any) {
      alert(err.message || "Gagal melamar pekerjaan");
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadResume(file);
      setUploadedResumeId(res.resume_id);
      setExtractedDataState(res.parsed_data);
      // Refresh resume list
      const resumeData = await api.getResumes();
      setResumes(resumeData);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah resume. Pastikan backend berjalan di http://127.0.0.1:8000");
    } finally {
      setUploading(false);
    }
  };

  const handleMatch = async () => {
    if (!uploadedResumeId) {
      alert("Silakan unggah resume terlebih dahulu!");
      return;
    }
    if (!jobDescription) {
      alert("Silakan masukkan deskripsi pekerjaan.");
      return;
    }
    setMatching(true);
    try {
      const res = await api.matchJob({
        resume_id: uploadedResumeId,
        job_description: jobDescription,
        job_title: selectedJob ? selectedJob.title : "Analisis Manual (Ad-hoc)",
      });
      setMatchResult(res);
      // Refresh match history
      const matchData = await api.getMatches();
      setMatchHistory(matchData);
    } catch (err: any) {
      alert(err.message || "Pencocokan gagal");
    } finally {
      setMatching(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setUploadError(null);
      setSelectedFileName(null);
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const hasValidType =
      allowedMimeTypes.includes(file.type) || allowedExtensions.includes(extension);

    if (!hasValidType) {
      setUploadError("Hanya berkas PDF atau DOCX yang didukung.");
      setSelectedFileName(null);
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setUploadError("Ukuran berkas melebihi batas 5MB.");
      setSelectedFileName(null);
      event.target.value = "";
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);
    handleUpload(file);
  };

  // Helper to format dates
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return "Hari ini";
    if (diffHours < 48) return "Kemarin";
    return d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  // Summary cards computed from real data
  const latestScore = matchHistory.length > 0 ? matchHistory[0].score : null;
  const latestRelevance = matchHistory.length > 0 ? matchHistory[0].semantic_relevance : null;
  const latestMissing = matchHistory.length > 0 ? matchHistory[0].missing_skills?.length : null;

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-[5%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] animate-float" />
      <div className="absolute bottom-[10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px] animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 animate-fade-in">
        {/* Header Section */}
        <header className="flex flex-col gap-3 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              Dasbor Kandidat
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sesi Aktif
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Analisis & Keselarasan Resume
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
            Unggah resume Anda, tempel deskripsi pekerjaan, lalu tinjau skor keselarasan semantik, keahlian yang kurang, serta rekomendasi optimasi ATS.
          </p>
        </header>

        {/* Summary metrics section */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Resume Status */}
          <div className="glass-card glow-emerald p-6 flex flex-col justify-between min-h-[140px] animate-fade-in delay-1">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Status Resume</span>
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-white mt-4">
                {resumes.length > 0 ? "Terunggah & Diekstrak" : "Belum Ada Resume"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {resumes.length > 0 ? `${resumes.length} Berkas • Terbaru: ${formatDate(resumes[0].created_at)}` : "Unggah resume untuk menganalisis"}
              </p>
            </div>
          </div>

          {/* Card 2: Latest Match Score */}
          <div className="glass-card glow-emerald p-6 flex items-center justify-between min-h-[140px] animate-fade-in delay-2">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 block">Skor Match Terbaru</span>
              <div>
                <p className="text-xl font-bold text-white">
                  {latestScore !== null ? "Evaluasi Sukses" : "Belum Menganalisis"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {latestRelevance !== null ? `Relevansi Semantik: ${latestRelevance.toFixed(2)}` : "Tunggu hasil pemindaian"}
                </p>
              </div>
            </div>
            {latestScore !== null && (
              <ScoreRing score={latestScore} size={70} strokeWidth={6} color="emerald" />
            )}
          </div>

          {/* Card 3: Missing Skills */}
          <div className="glass-card glow-emerald p-6 flex flex-col justify-between min-h-[140px] animate-fade-in delay-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Kesenjangan Skill</span>
              <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-white mt-4">
                {latestMissing !== null ? `${latestMissing} Keahlian Kurang` : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {latestMissing !== null ? "Perbaiki resume untuk melengkapi ATS" : "Hasil pencocokan akan muncul di sini"}
              </p>
            </div>
          </div>
        </section>

        {/* Upload + Job description inputs */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Upload card */}
          <div className="glass-card glow-emerald p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Unggah Berkas Resume</h2>
              <p className="text-xs text-slate-400">Mendukung format PDF atau DOCX dengan ukuran berkas maksimum 5MB.</p>
            </div>

            <label className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center transition hover:border-emerald-400/40 hover:bg-slate-950/80 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 group-hover:text-emerald-400 group-hover:scale-105 transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              </div>
              <span className="mt-4 text-sm font-semibold text-white">Tarik & letakkan file di sini atau cari berkas</span>
              <span className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX up to 5MB</span>
              
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-950/90 backdrop-blur-sm z-10 px-8">
                  <svg className="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="mt-4 text-xs font-semibold text-emerald-300">Sedang mengekstrak resume dengan AI...</span>
                  <div className="mt-2.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-shimmer" style={{ width: "100%" }} />
                  </div>
                </div>
              )}
            </label>

            {uploadError && (
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
                <svg className="h-4.5 w-4.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}
            {selectedFileName && !uploading && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <svg className="h-4.5 w-4.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Terpilih: <strong>{selectedFileName}</strong></span>
              </div>
            )}

            {/* Extracted Data Display */}
            <div className="space-y-3 pt-2">
              <span className="block text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Data Hasil Ekstraksi AI</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {extractedDataState ? (
                  <>
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Keahlian</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">
                        {extractedDataState.skills?.join(", ") || "Tidak ada keahlian terdeteksi"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Pendidikan</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">
                        {extractedDataState.education || "Tidak terdeteksi"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4.67 12.848a5.25 5.25 0 11-5.34 0m.682-11.848h7.98c.418 0 .736.384.622.787l-2.007 7.026a2.25 2.25 0 01-2.162 1.633H8.927a2.25 2.25 0 01-2.162-1.633L4.758 7.587A.622.622 0 015.38 7.18h7.98" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Pengalaman</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">
                        {extractedDataState.experience || "Tidak terdeteksi"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Proyek</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-3 leading-relaxed">
                        {extractedDataState.projects || "Tidak terdeteksi"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Sertifikasi</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {extractedDataState.certifications || "Tidak terdeteksi"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 rounded-2xl border border-white/5 bg-slate-950/30 p-8 text-center text-sm text-slate-500">
                    Sistem akan memecah data resume setelah berkas terunggah di atas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job description input card */}
          <div className="glass-card glow-emerald p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Evaluasi Deskripsi Lowongan</h2>
              <p className="text-xs text-slate-400">Tempel deskripsi lowongan pekerjaan (job description) dari perusahaan.</p>
            </div>

            <div className="flex-1 flex flex-col min-h-[220px]">
              <textarea
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Deskripsi Pekerjaan:&#10;- Minimal 2 tahun pengalaman dengan Python / Django&#10;- Memiliki keahlian REST API, SQL database, dan Docker... (contoh)"
                className="w-full flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="button"
              onClick={handleMatch}
              disabled={matching}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-sm font-semibold text-slate-950 shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {matching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mencocokkan...</span>
                </>
              ) : (
                <>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H14l1-6.105L6.018 14.904H9.81z" />
                  </svg>
                  <span>Jalankan Analisis Kecocokan</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Match output results details */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Detailed Match Percentages Card */}
          <div className="glass-card glow-emerald p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Evaluasi Kecocokan AI</h2>
            {matchResult ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Skor Kecocokan</span>
                    <p className="text-2xl font-bold text-white">ATS Matching</p>
                    <p className="text-xs text-slate-500">Persentase kata kunci relevan</p>
                  </div>
                  <ScoreRing score={matchResult.match_percentage} size={80} strokeWidth={7} color="emerald" />
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kemiripan Arti</span>
                    <p className="text-2xl font-bold text-white">Semantik NLP</p>
                    <p className="text-xs text-slate-400 font-semibold text-emerald-300">
                      Relevansi: {matchResult.semantic_relevance?.toFixed(2) || "—"}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                {/* Match Skills Tags */}
                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Keahlian yang Cocok ({matchResult.matched_skills?.length || 0})</span>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matched_skills?.length > 0 ? (
                      matchResult.matched_skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Tidak ada kecocokan terdeteksi</span>
                    )}
                  </div>
                </div>

                  {/* Missing Skills Tags */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-5 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Keahlian yang Kurang ({matchResult.missing_skills?.length || 0})</span>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.missing_skills?.length > 0 ? (
                        matchResult.missing_skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Keahlian lengkap!
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedJob && (
                    <div className="col-span-2 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-slate-400">
                        Anda sedang mengevaluasi lowongan: <strong className="text-white">{selectedJob.title}</strong>
                      </div>
                      {appliedJobsStatus[selectedJob.id] ? (
                        <button
                          disabled
                          className="w-full sm:w-auto h-10 px-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Sudah Dilamar
                        </button>
                      ) : (
                        <button
                          onClick={handleApply}
                          className="w-full sm:w-auto h-10 px-5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 hover:opacity-95 text-slate-950 text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Kirim Lamaran Pekerjaan
                        </button>
                      )}
                    </div>
                  )}
                </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-slate-950/30 py-12 text-center text-sm text-slate-500">
                Unggah resume dan jalankan analisis kecocokan untuk melihat metrik AI.
              </div>
            )}
          </div>

          {/* Feedback details */}
          <div className="glass-card glow-emerald p-6 space-y-6 flex flex-col">
            <h2 className="text-lg font-bold text-white tracking-tight">Masukan Rekomendasi AI</h2>
            {matchResult?.feedback ? (
              <div className="space-y-5 flex-1 overflow-y-auto max-h-[350px] pr-1">
                {/* ATS Tips */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tips Lolos ATS</span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {matchResult.feedback.ats_recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-emerald-400 font-bold shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Keywords suggestions */}
                {matchResult.feedback.missing_keywords.length > 0 && (
                  <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rekomendasi Kata Kunci Tambahan</span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.feedback.missing_keywords.map((keyword: string) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak phrases */}
                {matchResult.feedback.weak_phrases.length > 0 && (
                  <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deteksi Kalimat Kurang Kuat</span>
                    <div className="divide-y divide-white/5 space-y-2 text-xs">
                      {matchResult.feedback.weak_phrases.map((item: any) => (
                        <div key={item.phrase} className="pt-2 first:pt-0">
                          <p className="text-slate-500 italic">&ldquo;{item.phrase}&rdquo;</p>
                          <p className="text-emerald-300 font-semibold mt-1">
                            Saran: {item.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-slate-950/30 py-12 text-center text-sm text-slate-500 flex-1 flex items-center justify-center">
                Hasil umpan balik AI personal akan muncul setelah pengujian.
              </div>
            )}
          </div>
        </section>

        {/* History panels */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Resumes uploads history */}
          <div className="glass-card glow-emerald p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Riwayat Berkas Resume</h2>
              <p className="text-xs text-slate-400">Resume yang telah Anda unggah ke sistem. Klik untuk memilih.</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loadingResumes ? (
                <SkeletonCard count={2} layout="list" />
              ) : resumes.length > 0 ? (
                resumes.map((resume: any) => (
                  <div
                    key={resume.resume_id}
                    onClick={() => {
                      setUploadedResumeId(resume.resume_id);
                      setExtractedDataState(resume.parsed_data);
                    }}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-sm transition-all duration-300 ${
                      uploadedResumeId === resume.resume_id
                        ? "border-emerald-400/40 bg-emerald-400/5"
                        : "border-white/5 bg-slate-950/40 hover:border-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`font-bold transition ${uploadedResumeId === resume.resume_id ? "text-emerald-300" : "text-white"}`}>
                        {resume.file_name}
                      </p>
                      <p className="text-[11px] text-slate-500">{formatDate(resume.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        uploadedResumeId === resume.resume_id
                          ? "bg-emerald-400/20 text-emerald-300"
                          : "bg-slate-900 text-slate-400"
                      }`}>
                        {uploadedResumeId === resume.resume_id ? "Aktif" : "Gunakan"}
                      </span>
                      <button
                        onClick={(e) => handleDeleteResume(resume.resume_id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Hapus Resume"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">Belum ada resume terunggah.</p>
              )}
            </div>
          </div>

          {/* Tabbed matching history & lowongan kerja list */}
          <div className="glass-card glow-emerald p-6 space-y-5">
            <div className="flex border-b border-white/5 pb-1">
              <button
                onClick={() => {
                  setActiveTab("evaluations");
                  setSelectedJob(null);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "evaluations"
                    ? "border-emerald-400 text-emerald-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Riwayat Evaluasi
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "jobs"
                    ? "border-emerald-400 text-emerald-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Lowongan Tersedia
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {activeTab === "evaluations" ? (
                loadingMatches ? (
                  <SkeletonCard count={2} layout="list" />
                ) : matchHistory.length > 0 ? (
                  matchHistory.map((m: any) => (
                    <div
                      key={m.match_id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-950/40 p-4 text-sm"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-white leading-tight">{m.job_title || "Evaluasi Manual (Ad-hoc)"}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatDate(m.created_at)} • {m.missing_skills?.length || 0} skill kurang
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <span className="text-base font-bold text-emerald-300 block">
                            {Math.round(m.score)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Semantik: {m.semantic_relevance?.toFixed(2) || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Belum ada riwayat kecocokan.</p>
                )
              ) : (
                loadingJobs ? (
                  <SkeletonCard count={2} layout="list" />
                ) : availableJobs.length > 0 ? (
                  availableJobs.map((job: any) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setJobDescription(job.description);
                        setMatchResult(null);
                      }}
                      className={`flex flex-col cursor-pointer gap-2.5 rounded-xl border p-4 text-sm transition-all duration-300 ${
                        selectedJob?.id === job.id
                          ? "border-emerald-400/40 bg-emerald-400/5"
                          : "border-white/5 bg-slate-950/40 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className={`font-bold transition ${selectedJob?.id === job.id ? "text-emerald-300" : "text-white"}`}>
                            {job.title}
                          </p>
                          <p className="text-[11px] text-slate-500">Dibuat pada {formatDate(job.created_at)}</p>
                        </div>
                        {appliedJobsStatus[job.id] ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            Sudah Dilamar
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-900 text-slate-500 border border-white/5 px-2.5 py-0.5 text-[10px] font-bold hover:text-emerald-300 transition-colors">
                            Belum Dilamar
                          </span>
                        )}
                      </div>
                      {selectedJob?.id === job.id && (
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed border-t border-white/5 pt-2 mt-1">
                          {job.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">Belum ada lowongan pekerjaan tersedia.</p>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
