# 🧠 HireSense AI — Enterprise-Grade Resume ↔ Job Matching System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Alembic](https://img.shields.io/badge/Migrations-Alembic-8A2BE2?style=for-the-badge)](https://alembic.sqlalchemy.org)
[![ONNX](https://img.shields.io/badge/ML_Runtime-ONNX-005C99?style=for-the-badge&logo=onnx&logoColor=white)](https://onnxruntime.ai)

HireSense AI adalah platform sistem pelacakan pelamar (ATS) cerdas berbasis kecerdasan buatan (AI) semantik. Platform ini dirancang untuk mencocokkan resume kandidat dengan deskripsi pekerjaan secara akurat menggunakan pemrosesan bahasa alami (NLP) dan pencarian vektor, serta menyajikan peringkat pelamar secara real-time untuk para rekruter melalui arsitektur multi-tenant yang aman dan terisolasi.

---

## 🛠️ Fitur Utama

### 🧑‍💻 Portal Kandidat (Candidate Hub)
- **Upload & Parsing Resume**: Unggah resume berformat PDF/DOCX dengan validasi tipe berkas berbasis *Magic Bytes* (keamanan tingkat tinggi untuk menangkal spoofing berkas).
- **Ekstraksi Informasi Berbasis Struktur**: Mengekstrak data riwayat pekerjaan, pendidikan, proyek, sertifikasi, dan keterampilan (*skills*) secara otomatis.
- **Analisis Keselarasan (Matching Score)**: Menghitung persentase kecocokan keterampilan statis serta kecocokan makna semantik terhadap lowongan pekerjaan tertentu.
- **ATS Feedback Loop**: Memberikan umpan balik langsung mengenai frasa lemah yang perlu diperbaiki, kata kunci (*keywords*) yang hilang, dan rekomendasi kepatuhan format ATS.
- **Apply Flow**: Melamar pekerjaan secara langsung dengan resume terunggah terbaru, yang secara otomatis mencatat dan mengevaluasi data kecocokan di sisi rekruter.

### 🏢 Portal Rekruter (Recruiter Suite)
- **Multi-Tenant Isolation**: Pemisahan data ketat antarperusahaan. Rekruter dari Perusahaan A hanya dapat mengelola lowongan dan melihat peringkat pelamar di dalam perusahaannya sendiri.
- **Manajemen Lowongan**: Membuat, membaca, memperbarui (re-extract skills & re-compute embeddings), dan menghapus lowongan pekerjaan secara dinamis.
- **Peringkat Pelamar Instan (pgvector Cosine Similarity)**: Peringkat kandidat langsung diurutkan berdasarkan kesamaan semantik cosine menggunakan ekstensi `pgvector` di PostgreSQL.
- **Penyaringan Real-Time**: Slider dinamis untuk memfilter skor kecocokan minimum (0-100%) dan pencarian cepat berbasis nama kandidat.
- **Ekspor CSV**: Mengunduh daftar peringkat pelamar beserta skor pencocokan dan keterampilan yang kurang ke format CSV dalam satu klik.

---

## 🏗️ Arsitektur Sistem

HireSense AI dibangun dengan arsitektur bersih ber-layer (*Routes → Services → Storage / Data Access Layer → Database*), memisahkan logika bisnis dari manipulasi data secara ketat.

```
                                    ┌──────────────────────────┐
                                    │    Frontend (Next.js)    │
                                    │  ┌──────┐  ┌──────┐      │
                                    │  │Candidate│  │Recruiter│  │
                                    │  └──────┘  └──────┘      │
                                    └──────────┬───────────────┘
                                               │ REST API + JWT
                                    ┌──────────▼───────────────┐
                                    │    Backend (FastAPI)     │
                                    │                          │
                                    │  ┌──────────────────────┐│
                                    │  │   API Layer (main.py) ││
                                    │  │  /register /login     ││
                                    │  │  /upload-resume       ││
                                    │  │  /match-job /apply    ││
                                    │  │  /jobs /candidates    ││
                                    │  └──────────┬───────────┘│
                                    │             │            │
                                    │  ┌──────────▼───────────┐│
                                    │  │    Services Layer     ││
                                    │  │ ┌────┐ ┌─────┐ ┌───┐ ││
                                    │  │ │ ML │ │Parse│ │Mtch│││
                                    │  │ │    │ │     │ │Fdbk│││
                                    │  │ └────┘ └─────┘ └───┘ ││
                                    │  └──────────┬───────────┘│
                                    │             │            │
                                    │  ┌──────────▼───────────┐│
                                    │  │  Storage Layer (DAL)  ││
                                    │  │  DatabaseStore        ││
                                    │  └──────────┬───────────┘│
                                    └─────────────┬────────────┘
                                                  │
                    ┌─────────────────────────────▼─────────────────────────────┐
                    │                   PostgreSQL + pgvector                    │
                    │                                                           │
                    │  companies ──┐                                            │
                    │       │      │                                            │
                    │       ▼      ▼                                            │
                    │    users    jobs     resumes    matches   applications     │
                    │   ┌─role:   ┌─company_id  ┌─global     ┌─resume_id  ┌─job_id    │
                    │   │recr     │             │ (no comp)  │─job_id     │─resume_id │
                    │   │cand     │             │            │─score      │─applied_at│
                    │   └─comp_id └─            └─           └─           └─          │
                    │                                                           │
                    │  ISOLASI: recruiter & jobs terikat company                 │
                    │  GLOBAL:  candidates & resumes lintas perusahaan           │
                    │  JEMBATAN: applications/matches menghubungkan candidate → job│
                    └───────────────────────────────────────────────────────────┘
```

### Penjelasan Desain Multi-Tenant Hybrid
Sistem ini menggunakan pendekatan isolasi data hibrida:
1. **Recruiter & Jobs** terikat secara ketat pada entitas `companies` melalui kunci asing `company_id`. Rekruter dari Perusahaan A tidak dapat melihat, mengubah, atau menghapus data lowongan milik Perusahaan B.
2. **Candidate & Resumes** bersifat *global*. Kandidat terdaftar tanpa `company_id` dan resume mereka tidak terikat pada perusahaan mana pun, memungkinkan mereka mencari dan melamar ke lowongan kerja dari berbagai perusahaan di platform.
3. **Matches & Applications** bertindak sebagai tabel jembatan. Ketika kandidat melamar suatu lowongan, data lamaran disimpan dan rekruter perusahaan pemilik lowongan dapat melihat resume kandidat tersebut dalam daftar peringkat pelamar.

---

## 🔬 Studi Kasus Optimasi AI & Database

Selama transisi sistem ke tingkat produksi, dilakukan dua optimasi krusial untuk mencegah kegagalan sistem (*system crashes*) dan mempercepat latensi API:

### 1. Mitigasi Risiko OOM (Out of Memory) pada AI Service
- **Masalah Awal**: Model embedding kalimat awal (`sentence-transformers/all-MiniLM-L6-v2`) bergantung penuh pada *PyTorch*. Cold start dan inference membutuhkan RAM **500MB hingga 1GB**. Pada penyedia PaaS gratisan seperti Render Free Tier (kapasitas 512MB RAM), container mengalami **OOM Crash berulang kali** (Exit code 137).
- **Solusi Optimasi**: Mengganti ketergantungan PyTorch secara total dengan mengadopsi runtime **ONNX** menggunakan pustaka `fastembed` dengan model `BAAI/bge-small-en-v1.5` (dimensi embedding tetap 384d).
- **Hasil**: Kebutuhan RAM turun drastis menjadi hanya **~50MB** selama inference. Kecepatan inisialisasi model meningkat pesat dan container berjalan stabil di Render Free Tier tanpa risiko OOM.

### 2. Optimasi Kueri Peringkat Kandidat dengan pgvector
- **Masalah Awal**: Pencarian dan peringan kandidat sebelumnya dilakukan dengan memuat seluruh data resume ke memori Python, lalu melakukan perulangan (*looping*) untuk menghitung nilai cosine similarity di memori backend. Hal ini sangat tidak efisien (kompleksitas waktu dan memori $O(N)$) dan memicu OOM saat volume data tumbuh besar.
- **Solusi Optimasi**: Memindahkan kalkulasi similarity langsung ke database PostgreSQL menggunakan operator jarak cosine `<=>` yang didukung oleh ekstensi `pgvector`.
- **Kueri SQL Teroptimasi**:
  ```sql
  SELECT r.id, r.user_id, u.name AS candidate_name, r.parsed_data,
         (r.embedding <=> :job_embedding::vector) AS distance
  FROM resumes r
  JOIN users u ON u.id = r.user_id
  WHERE u.role = 'candidate' AND r.embedding IS NOT NULL
  ORDER BY distance ASC LIMIT :limit
  ```
- **Hasil**: Latensi peringan turun dari **beberapa detik menjadi <10ms** untuk ribuan data resume, serta meminimalkan penggunaan memori pada aplikasi backend.

---

## 🚀 Panduan Memulai Cepat (Local Setup)

### Prasyarat
- Python 3.12+
- Node.js 20+
- Database PostgreSQL dengan ekstensi `pgvector`

### 1. Kloning Repositori & Persiapan Backend
```bash
cd backend
python -m venv .venv

# Aktifkan virtual environment (Windows)
.venv\Scripts\activate
# Aktifkan virtual environment (macOS/Linux)
source .venv/bin/activate

# Install dependensi
pip install -r requirements.txt
```

### 2. Konfigurasi Environment & Migrasi Database
Salin berkas `.env.example` menjadi `.env` di dalam folder `backend/`:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
HIRESENSE_SECRET_KEY=string-rahasia-jwt-anda
```
Kemudian jalankan migrasi skema database menggunakan Alembic:
```bash
alembic upgrade head
```

### 3. Mengisi Database dengan Data Demo (Database Seeding)
Untuk mempermudah pengujian alur kerja rekruter dan kandidat tanpa perlu mendaftar dan mengunggah berkas secara manual dari awal, Anda dapat menggunakan skrip seeding otomatis:
```bash
# Menjalankan seeding (hanya jalan jika DB kosong)
python -m app.seed

# Memaksa reset data lama dan menulis ulang data demo baru
python -m app.seed --force
```

Skrip ini akan membuat:
- 3 Perusahaan (Acme Corporation, Wayne Enterprises, Stark Industries).
- 2 Akun Rekruter beserta lowongan pekerjaan aktif (Python Backend Developer, React Frontend Developer, Data Scientist).
- 3 Akun Kandidat dengan resume terunggah dan kecocokan yang terhitung otomatis.

**Akun Demo yang Siap Digunakan:**
* **Rekruter Acme**: `recruiter.acme@example.com` (password: `password123`)
* **Rekruter Wayne**: `recruiter.wayne@example.com` (password: `password123`)
* **Kandidat Developer**: `alice.dev@example.com` (password: `password123`)
* **Kandidat UI/UX**: `bob.frontend@example.com` (password: `password123`)

### 4. Menjalankan Server Lokal
```bash
# Jalankan Backend (FastAPI berjalan di port 8000)
python -m uvicorn app.main:app --reload --port 8000

# Jalankan Frontend (Next.js berjalan di port 3000)
cd ../frontend
npm install
npm run dev
```

*Shortcut (Windows)*: Anda juga dapat mengeklik dua kali berkas `start_local.bat` di direktori utama untuk menjalankan backend dan frontend sekaligus secara otomatis.

---

## 🧪 Pengujian Otomatis

HireSense AI dilengkapi dengan suite pengujian otomatis yang komprehensif menggunakan pytest, mencakup pengujian unit (layanan ML, parsing, pencocokan) hingga integrasi API (isolasi multi-tenant, autentikasi, pagination, upload/magic bytes).

Untuk menjalankan pengujian dan memeriksa persentase cakupan kode (*code coverage*):
```bash
cd backend
pytest --cov=app tests/ -v
```
*Hasil Cakupan Kode Saat Ini*: **89% Code Coverage** (32/32 tests passed).

---

## 🌐 Alur Deployment Produksi

Informasi lengkap mengenai langkah demi langkah penyebaran sistem ke lingkungan produksi dapat dilihat pada [Deployment Guide](file:///C:/Users/Arifi/.gemini/antigravity-ide/brain/11bba160-84c3-460d-a243-ceda754d90c5/deployment_guide.md).

- **Database**: Supabase PostgreSQL + pgvector
- **Backend API**: Render Web Service (Menggunakan start command `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`)
- **Frontend App**: Vercel (Next.js Standalone Build)

---

## 📝 Lisensi & Kode Etik

- Proyek ini dilisensikan di bawah [MIT License](file:///c:/Users/Arifi/Desktop/AI%20researcher/LICENSE).
- Semua kontributor wajib mematuhi [Code of Conduct](file:///c:/Users/Arifi/Desktop/AI%20researcher/CODE_OF_CONDUCT.md) platform ini.
