import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-slate-950 min-h-screen">
      {/* Background Gradient Mesh Blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-float" />
      <div className="absolute top-[30%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px] animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px] animate-float" style={{ animationDelay: "4s" }} />

      {/* Main Content Area */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20 md:py-28 animate-fade-in">
        <div className="flex flex-col gap-6 max-w-4xl">
          <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 animate-pulse-glow">
            ✨ Powered by AI Semantik
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
            HireSense AI memetakan kecocokan resume secara akurat dalam hitungan detik.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Unggah resume PDF/DOCX, tempel deskripsi pekerjaan, dan biarkan model bahasa mengekstrak keahlian, menganalisis kesenjangan skill, dan memberikan rekomendasi siap-ATS. Perekrut langsung mendapatkan peringkat kandidat terurut berdasarkan relevansi semantik.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold pt-4">
            <Link
              href="/candidate"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-7 py-3.5 text-slate-950 shadow-lg shadow-emerald-400/10 transition hover:shadow-emerald-400/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Dasbor Kandidat</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/recruiter"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 border border-violet-400/25 px-7 py-3.5 text-white shadow-lg shadow-violet-500/5 transition hover:shadow-violet-500/15 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Dasbor Perekrut</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Ekstraksi NLP Cerdas",
              description: "Mengekstrak keahlian, riwayat kerja, dan sertifikasi secara otomatis dari format resume standar (PDF/DOCX).",
              icon: (
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              ),
              stat: "Instan",
            },
            {
              title: "Kecocokan Semantik",
              description: "Menggunakan model semantik canggih untuk memetakan relevansi makna dari resume kandidat dengan deskripsi pekerjaan.",
              icon: (
                <svg className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 21l8.982-11.795H14l1-6.105L6.018 14.904H9.81z" />
                </svg>
              ),
              stat: "98% Akurasi",
            },
            {
              title: "Pemeringkatan Talenta",
              description: "Membantu rekruter menyaring puluhan pelamar dengan filter keahlian wajib dan pengurutan skor secara otomatis.",
              icon: (
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              ),
              stat: "Real-time",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`glass-card p-6 flex flex-col justify-between animate-fade-in delay-${index + 1}`}
            >
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Metode Analisis</span>
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-white border border-white/5">
                  {item.stat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Timeline Section */}
      <section className="relative z-10 border-t border-white/10 bg-slate-950/40 py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 lg:grid-cols-2">
          {/* Candidate Workflow */}
          <div className="space-y-8 animate-fade-in delay-2">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Target Pelamar</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Alur Kerja Kandidat
              </h2>
              <p className="text-sm text-slate-400">Optimalkan resume Anda sesuai deskripsi pekerjaan sebelum melamar.</p>
            </div>
            
            <div className="relative border-l border-emerald-400/20 pl-6 ml-3 space-y-8">
              {[
                {
                  title: "Daftar & Unggah",
                  description: "Buat akun kandidat, lalu unggah resume Anda dalam format PDF atau DOCX secara aman.",
                },
                {
                  title: "Tempel Deskripsi Pekerjaan",
                  description: "Masukkan teks deskripsi pekerjaan (job description) dari posisi yang Anda incar.",
                },
                {
                  title: "Dapatkan Feedback Instan",
                  description: "Lihat ringkasan keahlian yang kurang, kata kunci penting, dan skor kesiapan ATS Anda.",
                },
              ].map((step, i) => (
                <div key={i} className="relative">
                  {/* Glowing Node */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Workflow */}
          <div className="space-y-8 animate-fade-in delay-3">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Target HR & Perekrut</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Alur Kerja Perekrut
              </h2>
              <p className="text-sm text-slate-400">Urutkan puluhan pelamar dengan kecocokan semantik otomatis.</p>
            </div>
            
            <div className="relative border-l border-violet-400/20 pl-6 ml-3 space-y-8">
              {[
                {
                  title: "Buat Lowongan Pekerjaan",
                  description: "Terbitkan nama posisi lengkap dengan persyaratan keahlian wajib yang dibutuhkan.",
                },
                {
                  title: "Saring Kandidat Otomatis",
                  description: "Sistem memproses resume pelamar dan mengurutkannya dari skor kecocokan tertinggi.",
                },
                {
                  title: "Seleksi & Shortlist",
                  description: "Filter kandidat berdasarkan keahlian wajib, tandai pelamar potensial, dan ekspor data.",
                },
              ].map((step, i) => (
                <div key={i} className="relative">
                  {/* Glowing Node */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-violet-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
