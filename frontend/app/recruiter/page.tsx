"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, getUserRole } from "@/lib/api";
import ScoreRing from "@/components/ScoreRing";
import SkeletonCard from "@/components/SkeletonCard";

export default function RecruiterDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const role = getUserRole();
    if (role && role !== "recruiter") {
      router.push("/candidate");
    }
  }, [router]);

  // Job creation form
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit Job states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updatingJob, setUpdatingJob] = useState(false);

  // Data from backend
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Filters
  const [minScore, setMinScore] = useState(0);
  const [mustHaveSkills, setMustHaveSkills] = useState("");
  const [searchName, setSearchName] = useState("");

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
      // Auto-select first job
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchCandidates = async (jobId: string) => {
    setLoadingCandidates(true);
    try {
      const data = await api.getJobCandidates(jobId);
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const role = getUserRole();
    if (role && role !== "recruiter") return;
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  const handleCreateJob = async () => {
    if (!title || !description) return;
    setCreating(true);
    try {
      const newJob = await api.createJob({
        title,
        description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setTitle("");
      setSkills("");
      setDescription("");
      await fetchJobs();
      setSelectedJobId(newJob.id);
    } catch (err: any) {
      alert(err.message || "Gagal membuat lowongan pekerjaan");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditJobId(job.id);
    setEditTitle(job.title);
    setEditSkills(job.skills?.join(", ") || "");
    setEditDescription(job.description);
    setShowEditModal(true);
  };

  const handleUpdateJob = async () => {
    if (!editJobId || !editTitle || !editDescription) return;
    setUpdatingJob(true);
    try {
      await api.updateJob(editJobId, {
        title: editTitle,
        description: editDescription,
        skills: editSkills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setShowEditModal(false);
      await fetchJobs();
      if (selectedJobId === editJobId) {
        await fetchCandidates(editJobId);
      }
      alert("Lowongan pekerjaan berhasil diperbarui!");
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui lowongan pekerjaan");
    } finally {
      setUpdatingJob(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedJobId || filteredCandidates.length === 0) return;
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    const jobTitle = selectedJob ? selectedJob.title : "Lowongan";
    const headers = ["Nama Kandidat", "Skor Cocok (%)", "Relevansi Semantik", "Keahlian Kurang (Missing)"];
    const rows = filteredCandidates.map(c => [
      c.candidate_name,
      Math.round(c.match_percentage),
      c.semantic_relevance?.toFixed(2) || "0.00",
      (c.missing_skills || []).join("; ")
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Peringkat_Kandidat_${jobTitle.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    if (c.match_percentage == null || c.match_percentage < minScore) return false;
    if (searchName.trim() && !c.candidate_name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (mustHaveSkills.trim()) {
      const required = mustHaveSkills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      const candidateMissing = (c.missing_skills || []).map((s: string) => s.toLowerCase());
      if (required.some(r => candidateMissing.includes(r))) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) return "Hari ini";
    if (diffHours < 48) return "Kemarin";
    return d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background Glows */}
      <div className="absolute top-[5%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px] animate-float" />
      <div className="absolute bottom-[10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px] animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 animate-fade-in">
        {/* Header Section */}
        <header className="flex flex-col gap-3 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              Dasbor Perekrut
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Sesi Aktif
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Pemeringkatan Kandidat & Lowongan
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
            Buat posisi pekerjaan baru, tetapkan filter skor minimal atau keahlian wajib, dan lihat peringkat kandidat terurut secara real-time.
          </p>
        </header>

        {/* Action Panel: Create Job & Filters */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Create Job Form */}
          <div className="glass-card glow-violet p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Terbitkan Lowongan Baru</h2>
              <p className="text-xs text-slate-400">Tambahkan informasi lowongan dan daftar keahlian utama untuk mulai mencocokkan.</p>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                Nama / Judul Pekerjaan
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AI Research Engineer (contoh)"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-650 transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                Keahlian Wajib (pisahkan dengan koma)
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Python, NLP, PyTorch, PySpark (contoh)"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-655 transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                Deskripsi Tanggung Jawab / Syarat Lengkap
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi Lowongan secara lengkap..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-655 transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none resize-none leading-relaxed"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleCreateJob}
              disabled={creating}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {creating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menerbitkan...</span>
                </>
              ) : (
                <>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Terbitkan Lowongan Pekerjaan</span>
                </>
              )}
            </button>
          </div>

          {/* Filters Form */}
          <div className="glass-card glow-violet p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Saring & Filter Kandidat</h2>
              <p className="text-xs text-slate-400">Sesuaikan kriteria minimum untuk mengerucutkan daftar pelamar secara instan.</p>
            </div>

            <div className="space-y-6 flex-1 py-4">
              {/* Range Slider for Score */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-350">
                  <span>Skor Minimum Kecocokan</span>
                  <span className="text-violet-400 text-sm">{minScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-violet-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              {/* Search Name Input */}
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                Cari Nama Pelamar
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ketik nama kandidat..."
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-655 transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                />
              </label>

              {/* Must have skills filter input */}
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                Keahlian Wajib Dimiliki Pelamar (Filter)
                <input
                  type="text"
                  value={mustHaveSkills}
                  onChange={(e) => setMustHaveSkills(e.target.value)}
                  placeholder="Python, NLP (contoh)"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white placeholder:text-slate-655 transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4.5 text-xs text-slate-400 space-y-2">
              <span className="font-bold text-white uppercase tracking-wider block">Status Penyaringan</span>
              <p className="leading-relaxed">
                Menampilkan <strong className="text-violet-300">{filteredCandidates.length}</strong> dari <strong className="text-white">{candidates.length}</strong> kandidat terdaftar untuk lowongan ini.
              </p>
            </div>
          </div>
        </section>

        {/* Jobs List & Quick Analytics */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Job Management list */}
          <div className="glass-card glow-violet p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Manajemen Daftar Lowongan</h2>
              <p className="text-xs text-slate-400">Pilih salah satu posisi untuk melihat dan mengurutkan database pelamar.</p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loadingJobs ? (
                <SkeletonCard count={2} layout="list" />
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 text-sm transition-all duration-300 ${
                      selectedJobId === job.id
                        ? "border-violet-400/40 bg-violet-400/5"
                        : "border-white/5 bg-slate-950/40 hover:border-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`font-bold transition ${selectedJobId === job.id ? "text-violet-300" : "text-white"}`}>
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500">Terbit: {formatDate(job.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        selectedJobId === job.id
                          ? "bg-violet-400/20 text-violet-300"
                          : "bg-slate-900 text-slate-400"
                      }`}>
                        {selectedJobId === job.id ? "Terpilih" : "Buka"}
                      </span>
                      <button
                        onClick={(e) => openEditModal(job, e)}
                        className="text-slate-500 hover:text-violet-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Edit Lowongan"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">Belum ada lowongan diterbitkan.</p>
              )}
            </div>
          </div>

          {/* Quick stats on selected job */}
          <div className="glass-card glow-violet p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Ikhtisar Pelamar Lowongan</h2>
              <p className="text-xs text-slate-400">Statistik pelamar yang mengirimkan resume pada posisi terpilih.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 flex flex-col justify-between min-h-[90px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Total Pendaftar</span>
                <span className="text-3xl font-extrabold text-white mt-2">{candidates.length}</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 flex flex-col justify-between min-h-[90px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Lolos Filter</span>
                <span className="text-3xl font-extrabold text-violet-400 mt-2">{filteredCandidates.length}</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4.5 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Kecocokan Tertinggi</span>
                  <span className="text-sm text-slate-400 block mt-1">Skor tertinggi dari pelamar tersaring</span>
                </div>
                <span className="text-3xl font-extrabold text-white">
                  {filteredCandidates.length > 0 ? `${Math.round(filteredCandidates[0].match_percentage || 0)}%` : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Candidate Ranking List */}
        <section className="glass-card glow-violet p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Peringkat Pelamar Teratas</h2>
              <p className="text-xs text-slate-400">
                Diurutkan secara otomatis berdasarkan kedekatan semantik resume dengan kriteria lowongan.
              </p>
            </div>
            {filteredCandidates.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="h-10 px-4 rounded-xl border border-white/10 hover:border-violet-400/40 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-violet-300 text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ekspor ke CSV
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_2fr_1fr] gap-4 border-b border-white/5 bg-slate-950 px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 items-center">
              <span>Kandidat Pelamar</span>
              <span>Skor Cocok</span>
              <span>Relevansi Semantik</span>
              <span>Keahlian Kurang (Missing)</span>
              <span className="text-right">Rekomendasi</span>
            </div>

            <div className="divide-y divide-white/5">
              {loadingCandidates ? (
                <div className="p-8">
                  <SkeletonCard count={3} layout="list" />
                </div>
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate: any, index) => (
                  <div
                    key={candidate.candidate_id || index}
                    className="grid grid-cols-[1.2fr_0.8fr_0.8fr_2fr_1fr] gap-4 px-5 py-4 text-sm text-slate-300 hover:bg-white/2 transition-colors items-center"
                  >
                    {/* Name */}
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">
                        {candidate.candidate_name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        ID: {candidate.candidate_id?.substring(0, 8) || "—"}
                      </span>
                    </div>

                    {/* ATS Match Score */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-violet-300">
                        {Math.round(candidate.match_percentage)}%
                      </span>
                    </div>

                    {/* Semantic Relevance */}
                    <span className="font-semibold text-slate-200">
                      {candidate.semantic_relevance?.toFixed(2) || "—"}
                    </span>

                    {/* Missing Skills */}
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.missing_skills?.length > 0 ? (
                        candidate.missing_skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="rounded-full bg-rose-500/10 border border-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Tidak ada
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="text-right">
                      {candidate.match_percentage >= 80 ? (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider inline-block">
                          Sangat Cocok
                        </span>
                      ) : candidate.match_percentage >= 60 ? (
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider inline-block">
                          Sedang
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/10 px-3 py-1 text-[10px] font-bold text-rose-300 uppercase tracking-wider inline-block">
                          Perlu Ditinjau
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : selectedJobId ? (
                <div className="px-5 py-10 text-center text-sm text-slate-550 leading-relaxed">
                  Tidak ada kandidat pelamar yang memenuhi kriteria filter saat ini.
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-550 leading-relaxed">
                  Pilih lowongan untuk melihat peringkat kandidat pelamar.
                </div>
              )}
            </div>
          </div>
        </section>
        {/* Edit Job Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6">
            <div className="glass-card glow-violet w-full max-w-xl p-6 space-y-6 animate-fade-in bg-slate-900/90">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">Edit Lowongan Pekerjaan</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                  Nama / Judul Pekerjaan
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                  Keahlian Wajib (pisahkan dengan koma)
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-300">
                  Deskripsi Tanggung Jawab / Syarat Lengkap
                  <textarea
                    rows={6}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none resize-none leading-relaxed"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="h-10 px-4 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateJob}
                  disabled={updatingJob}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-400 to-indigo-500 hover:opacity-90 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  {updatingJob ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
