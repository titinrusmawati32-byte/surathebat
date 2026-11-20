# 📄 Generator Surat Aktif Lomba & Surat Tugas — SDN Sumberejo 04

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SheetJS](https://img.shields.io/badge/SheetJS-xlsx-green.svg)](https://sheetjs.com/)
[![A4 Precision](https://img.shields.io/badge/Cetak%20A4-Presisi%20100%25-indigo.svg)](#)

Aplikasi Web Administrasi Pendidikan modern untuk pembuatan **Surat Keterangan Aktif Belajar (Lomba)** dan **Surat Tugas Guru Pembina/Pendamping Lomba** secara instan, presisi tinggi pada kertas A4, serta ekspor dokumen Microsoft Word (`.doc`) yang rapi tanpa pergeseran stempel dan tanda tangan.

Dikembangkan khusus untuk **SD Negeri Sumberejo 04, Kecamatan Ambulu, Kabupaten Jember**.

---

## ✨ Fitur Unggulan

### 1. 🎯 Cetak PDF A4 Presisi & Fitur "Pas 1 Halaman" (Auto-Fit)
* **Mode Pas 1 Halaman Otomatis**: Tombol 1-klik yang secara cerdas mengalkulasi jumlah siswa dan memadatkan spasi, margin, dan ukuran font (12pt / 11pt / 10.5pt) agar dokumen **100% muat tepat dalam 1 lembar A4** tanpa risiko tumpah ke halaman 2.
* **Meteran Keterisian Kertas Real-Time (*Fit-to-Page Gauge*)**: Indikator persentase keterisian kertas A4 secara visual dengan peringatan jika konten melebihi batas printable area.
* **Kop Surat 3 Kolom Simetris**: Penempatan logo Kabupaten Jember dan logo sekolah yang seimbang memastikan teks identitas sekolah berada tepat di as tengah kertas.
* **Garis Ganda Kedinasan**: Garis bawah kop ganda (2.5pt tebal di atas & 0.75pt tipis di bawah) yang pekat dan presisi di semua browser.
* **QR Code Verifikasi Resmi**: Memuat data verifikasi nomor surat, sekolah, tanggal, dan nama siswa yang dapat dipindai langsung dengan kamera smartphone.

### 2. 📝 Ekspor Microsoft Word (.doc) 100% Rapi & Anti-Bergeser
* **Word Siap Cetak (TTD Digital)**: Menggunakan teknologi *Offscreen Canvas 2D Retina (2x DPI)* untuk menggabungkan stempel dan tanda tangan ke dalam satu berkas gambar komposit, sehingga posisi stempel dan tanda tangan tidak akan bergeser atau hilang saat dibuka di Word.
* **Word Tanda Tangan Basah**: Opsi unduh format bersih dengan ruang kosong 48pt untuk tanda tangan pena dan cap stempel manual asli sekolah.
* **Pembersihan Spasi Paragraf MSO**: Menggunakan reset XML khusus `mso-style-priority:99` untuk menghilangkan jarak kosong antar baris bawaan Word.

### 3. 📂 Integrasi Data & Ekstraksi Cerdas
* **Database Siswa (Excel Dapodik)**: Unggah file `.xlsx`/`.xls`/`.csv` hasil unduhan Dapodik, sistem otomatis memetakan kolom Nama, NISN, Tempat/Tanggal Lahir, dan Rombel.
* **Ekstraksi Gambar Otomatis dari .docx**: Unggah file `SURAT AKTIF .docx` lama, sistem dengan bantuan *JSZip* otomatis mengekstrak Logo Kiri, Logo Kanan, Stempel, dan Tanda Tangan tanpa perlu crop manual.
* **Penyimpanan Lokal & Cloud**: Mendukung penyimpanan di browser (`localStorage`) dan Google Sheets Database (7 sheet relasional).

### 4. 🔄 Paket Surat 2-in-1 (Siswa & Guru)
* **Surat Aktif Lomba Siswa**: Format resmi keterangan aktif belajar untuk pendaftaran lomba OSN, FLS2N, O2SN, Pramuka, PAI, dll.
* **Surat Tugas Guru Pembina**: Pembuatan surat tugas pendamping lomba secara instan dari data peserta yang sama tanpa ketik ulang.

---

## 🏗️ Struktur Berkas Repositori

```text
├── index.html                           # Antarmuka Utama Web App (Frontend PWA & Hybrid Engine)
├── Index.html                           # Salinan file untuk Google Apps Script (HTML Service)
├── Code.gs                              # Backend Google Apps Script (REST API & Mutex Lock 7 Sheet)
├── vercel.json                          # Konfigurasi routing & security headers Vercel Edge
├── api/
│   └── gas.js                           # Serverless Edge Proxy untuk bypass CORS Google Apps Script
├── package.json                         # Metadata proyek & script build Vercel
├── .gitignore                           # Berkas pengabaian Git (OS, cache, credentials)
├── push_ke_github.bat                   # Skrip otomatisasi commit & push Git Windows
├── prd_dan_master_prompt_siguru_sd.md   # Spesifikasi PRD & Master Architecture Blueprint
└── README.md                            # Dokumentasi resmi proyek ini
```

---

## ⚡ Panduan Deploy ke Vercel (Rekomendasi Utama)

### Metode 1: Hubungkan Repositori GitHub ke Vercel Dashboard (Otomatis & Gratis)
1. Pastikan kode Anda sudah di-push ke repositori GitHub (misal: `surat-aktif-sdn04`).
2. Masuk ke akun Anda di [vercel.com](https://vercel.com) (login dengan akun GitHub).
3. Di Dashboard Vercel, klik tombol **Add New... > Project**.
4. Cari repositori Anda (`surat-aktif-sdn04`) lalu klik **Import**.
5. Pada menu **Configure Project**:
   * **Framework Preset**: Pilih `Other`.
   * **Root Directory**: `./` (biarkan default).
   * *(Opsional)* Jika ingin menghubungkan ke Google Spreadsheet, buka **Environment Variables** dan tambahkan:
     * **Name**: `GAS_WEBAPP_URL`
     * **Value**: *URL Web App Google Apps Script Anda*
6. Klik tombol **Deploy**.
7. Dalam hitungan detik, aplikasi Anda sudah live dengan domain super cepat:
   ```text
   https://surat-aktif-sdn04.vercel.app
   ```
*(Setiap kali Anda melakukan `git push` ke GitHub, Vercel akan otomatis meng-update aplikasi Anda secara real-time!)*

---

### Metode 2: Deploy Cepat via Vercel CLI (Command Line)
Bagi Anda yang menyukai command-line di terminal/PowerShell:
```bash
# 1. Pastikan Vercel CLI terpasang di komputer Anda
npm i -g vercel

# 2. Masuk ke folder proyek
cd "lokasi-folder-proyek"

# 3. Jalankan perintah deploy
vercel

# 4. Untuk deploy ke domain production:
vercel --prod
```

---

## 📋 Alternatif Deployment Lainnya

### Opsi A: Deploy ke GitHub Pages
1. Di repositori GitHub Anda, buka tab **Settings > Pages**.
2. Pada bagian **Build and deployment > Branch**, pilih branch `main` dan folder `/(root)`.
3. Klik **Save**. Aplikasi akan aktif di `https://<username>.github.io/<repo-name>/`.

---

### Opsi B: Deploy ke Google Apps Script (Tersambung Google Sheets)
1. Buka [Google Spreadsheet](https://sheets.new) baru di akun Google Anda.
2. Buka menu **Ekstensi > Apps Script**.
3. Salin isi [`Code.gs`](./Code.gs) ke file `Code.gs`.
4. Buat file HTML baru dengan nama `Index`, lalu salin seluruh isi [`Index.html`](./Index.html).
5. Pilih fungsi `setupDatabase` lalu klik tombol **Run / Jalankan** untuk membentuk 7 sheet otomatis.
6. Klik **Deploy > New deployment** (Pilih *Web app*, *Execute as: Me*, *Who has access: Anyone*).

---

## 🛠️ Tumpukan Teknologi (*Tech Stack*)

* **Hosting & Edge Gateway**: [Vercel](https://vercel.com/) (Serverless Edge Functions & Fast CDN)
* **Antarmuka (Frontend)**: HTML5, Modern Vanilla JavaScript (ES6+), [Tailwind CSS CDN v3.4](https://tailwindcss.com/)
* **Manipulasi Spreadsheet**: [SheetJS (xlsx.full.js) v0.20.3](https://sheetjs.com/)
* **Dekompresi Berkas**: [JSZip v3.10.1](https://stuk.github.io/jszip/)
* **Generator Kode QR**: [QRCode.js v1.0.0](https://davidshimjs.github.io/qrcodejs/)
* **Backend Database**: Google Apps Script & Google Sheets (Relational 7-Sheet Storage)

---

## 👥 Pengembang & Hak Cipta

* **Instansi**: SD Negeri Sumberejo 04
* **Wilayah Kerja**: Koordinator Wilayah Bidang Pendidikan Kecamatan Ambulu, Kabupaten Jember, Jawa Timur
* **Lisensi**: [MIT License](LICENSE) — Bebas digunakan dan dikembangkan untuk kemajuan administrasi sekolah dasar di Indonesia.
