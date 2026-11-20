# 📑 PRODUCT REQUIREMENTS DOCUMENT (PRD) & MASTER MEGA-PROMPT
## Platform Administrasi Pendidikan Sekolah Dasar: SiGuru SD Digital
**Versi Spesifikasi: 3.5.0-ENTERPRISE-STRICT**  
**Penyusun:** Tim Pengembang SiGuru SD • Wilayah Kerja: Koorwil Bidang Pendidikan Kecamatan Ambulu, Kabupaten Jember  
**Status Dokumen:** Master Engineering Blueprint & Generation Prompt

---

# BAGIAN 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Visi Produk
Membangun platform administrasi mandiri digital jenjang Sekolah Dasar (SD) yang **ringan, cepat, aman, dan berorientasi mobile-first** (*smartphone/tablet/laptop*) untuk memudahkan Guru Kelas dan Guru Mata Pelajaran dalam mengelola seluruh beban administrasi kurikulum (Kurikulum Merdeka & K-13): mulai dari buku induk data siswa, presensi harian berbasis scanner kamera QR Code, pengolahan nilai formatif/sumatif/SAS otomatis, penulisan jurnal harian, hingga pencadangan data mandiri tanpa ketergantungan pada server database berbayar yang rumit.

### 1.2 Masalah yang Diselesaikan (*Problem Statement*)
1. **Beban Administrasi Manual**: Guru SD masih banyak mencatat presensi dan lembar nilai di buku fisik tebal atau file Excel terpisah-pisah yang rentan hilang atau terhapus.
2. **Keterbatasan Perangkat Guru**: Mayoritas guru mengoperasikan ponsel cerdas (*smartphone*) kelas menengah dengan spesifikasi memori terbatas; aplikasi administrasi yang berat (*overdraw/heavy JS frameworks*) sering macet atau lambat saat di-scroll.
3. **Isolasi Lembaga (*Multi-Tenancy*)**: Dalam satu kecamatan terdapat belasan sekolah negeri (14 SDN di Ambulu). Diperlukan sistem terisolasi per NPSN agar data antar lembaga tidak saling tumpang tindih.
4. **Keamanan Tanpa Membebani**: Guru memerlukan login instan (NPSN + PIN 6-digit) tanpa harus repot mengingat password rumit, sedangkan akses Administrator membutuhkan proteksi ketat (*Google SSO / 2FA*).
5. **Cetak Dokumen Sesuai Format Dinas**: Kebutuhan cetak laporan rekapitulasi nilai dan presensi yang harus memiliki Kop Surat resmi Dinas/Koorwil, KKM, titimangsa, dan tanda tangan Kepala Sekolah.

---

## 2. Sasaran Pengguna (*User Personas & RBAC*)

Sistem menerapkan pembagian peran tegas (*Role-Based Access Control*):

| Peran Pengguna | Sasaran Pengguna | Metode Autentikasi | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Guru Kelas & Guru Mapel** | Seluruh guru SD aktif per satuan pendidikan | NPSN (8 Digit) + Kode Unik Lembaga + PIN Guru (4–6 Angka) | Mengelola rombel sendiri, input/impor siswa, scan QR presensi, input nilai & cetak rekap, tulis jurnal, ekspor JSON mandiri. |
| **Guru Baru (Pemohon)** | Guru pindahan/baru bertugas | Formulir pendaftaran guru baru (NIP, WA, Jabatan, PIN) | Akun ditahan (*Pending*) hingga disetujui Admin Sekolah. Tidak bisa membuka data kelas sebelum disetujui. |
| **Admin Sekolah / Kepsek** | Operator / Kepala Sekolah per SDN | Panel Admin `/admin` via Google SSO Firebase | Memverifikasi pendaftaran guru baru, mereset PIN guru lupa sandi, memantau data seluruh rombel sekolah. |
| **Superadmin Koorwil** | Pengelola Pusat Kecamatan Ambulu | Google SSO Whitelist Email di Firebase | Manajemen direktori NPSN 14 SD, deploy pembaruan script Google Apps Script, upload perangkat pembelajaran Google Drive. |

---

## 3. Arsitektur Teknis & Tumpukan Teknologi (*Tech Stack*)

Aplikasi dirancang dengan arsitektur **Zero-Maintenance Backend & Edge Serverless Proxy**:

```
+---------------------------------------------------------------------------------+
|                       CLIENT TIER (BROWSER & MOBILE PWA)                        |
|   HTML5 + Vanilla Modern JavaScript (ES6+) + Tailwind CSS CDN v3.4             |
|   Audio Synthesis + html5-qrcode.js + qrcode.js + xlsx.full.js (SheetJS)        |
+---------------------------------------------------------------------------------+
                                       │  HTTPS Fetch (JSON REST API)
                                       ▼
+---------------------------------------------------------------------------------+
|                    VERCEL EDGE SERVERLESS PROXY & GATEWAY                       |
|   /api/gas.js            : Reverse proxy bypass CORS Google Apps Script        |
|   /api/firebase-config.js: Dynamic token distributor (process.env.FIREBASE_API) |
+---------------------------------------------------------------------------------+
                                       │  JSON POST/GET Webhook
                                       ▼
+---------------------------------------------------------------------------------+
|                  BACKEND TIER (GOOGLE WORKSPACE ENGINE)                         |
|   Google Apps Script (Code.gs Web App)                                          |
|   - DoGet / DoPost REST Router                                                  |
|   - LockService.getScriptLock() (Anti Concurrency Race Condition)               |
|   - Multi-tenant Sheet Router per NPSN Lembaga                                  |
+---------------------------------------------------------------------------------+
                                       │  SpreadsheetApp API
                                       ▼
+---------------------------------------------------------------------------------+
|                      STORAGE TIER (DATABASE MULTI-TENANT)                       |
|   Google Sheets Master Spreadsheet                                              |
|   Sheets: [Sekolah], [Guru_NPSN], [Kelas_NPSN], [Siswa_NPSN], [Presensi_NPSN]  |
|           [Nilai_NPSN], [Jurnal_NPSN], [Jadwal_NPSN]                            |
+---------------------------------------------------------------------------------+
```

### Rincian Tumpukan Teknologi:
1. **Frontend**:
   - Single Page Application (SPA) murni tanpa framework kompilasi (*Zero Build Step*), berjalan instan via CDN.
   - **Styling**: Tailwind CSS CDN dengan palet kustom: *Soft Pastel Lavender* (`#7C6EE6`, `#F0EEF9`) untuk mode terang dan *Cyber-Clean Glowing Dark Mode* (`#060911`, `#121828`) untuk mode gelap.
   - **Typography**: Google Fonts (*Plus Jakarta Sans*, *Outfit*, dan *JetBrains Mono*).
   - **Kamera & QR**: Library `html5-qrcode` v2.3.8 untuk video viewfinder kamera dan `qrcodejs` v1.0.0 untuk generator cetak kartu.
   - **Manipulasi Excel**: `xlsx.full.min.js` (SheetJS) v0.18.5 untuk ekspor-impor berkas `.xlsx`.
2. **Serverless Middleware (Vercel)**:
   - Node.js Serverless Functions (`/api/gas.js`) sebagai jembatan request dari frontend ke Google Apps Script guna menghindari masalah CORS dan header redirect 302.
   - Node.js Serverless Functions (`/api/firebase-config.js`) untuk mendistribusikan Firebase Web API Key dari `process.env.FIREBASE_API_KEY` agar repositori GitHub publik 100% bebas dari kebocoran kunci (*Secret Scanning Safe*).
3. **Backend & Database**:
   - **Google Apps Script (GAS)** ter-deploy sebagai Web App dengan izin eksekusi *"Anyone"*.
   - **Google Sheets** bertindak sebagai *Relational Multi-Tenant Database* dengan pemisahan sheet per NPSN.
   - Dilengkapi *Mutex Lock* (`LockService.getScriptLock()`) untuk mencegah data tertimpa saat puluhan guru menyimpan nilai dan presensi secara bersamaan.

---

## 4. Spesifikasi Fungsional Modul Aplikasi

### 4.1 Modul 0: Autentikasi Guru & Wizard Registrasi
- **Input NPSN (8 Digit)**: Memvalidasi keberadaan sekolah di direktori master 14 SDN Ambulu.
- **Input Kode Unik Lembaga**: Memverifikasi kode rahasia sekolah (contoh: `SMB04-3918`).
- **Pilihan Nama Guru**: Dropdown otomatis yang terisi nama-nama guru terverifikasi pada sekolah tersebut.
- **Input PIN Guru (4–6 Angka)**: Masukan angka rahasia tersamar (`••••••`) dengan tombol lupa PIN yang merujuk ke Admin Sekolah.
- **Tab Guru Baru (Registrasi)**: Menginput Nama Lengkap, Gelar, NIP/NUPTK, No WA, Jabatan (*Guru Kelas, PAI, PJOK, Mapel*), dan membuat PIN. Akun otomatis berstatus `isPending = true`.
- **Cinematic Fullscreen Splash Screen**: Menampilkan animasi cincin progress SVG (0% -> 45% -> 75% -> 100%) dan transisi sambutan sebelum masuk ke dashboard.

### 4.2 Modul Dashboard Beranda Utama
- **Top Bar**: Avatar guru, sapaan dinamis (*Pagi/Siang/Malam*), nama sekolah, indikator sinkronisasi real-time cloud, toggle Dark Mode instan tanpa flicker, dan tombol keluar.
- **Pencarian Cepat Cerdas (*Smart Search*)**: Filter langsung ke modul, nama siswa, atau kelas.
- **Date Ribbon 7 Hari**: Kalender pita horizontal 7 hari dengan penanda jadwal mengajar aktif hari ini.
- **Hero Widget Capaian**: Jam digital WIB berdetik, tanggal lengkap, persentase kehadiran hari ini, dan grafik tren interaktif 7 hari.
- **Grid 8 Modul Mandiri**: Kartu akses cepat beraksen modern dengan tombol ripple effect.
- **Floating Bottom Navigation Dock**: Bar melayang berposisi `fixed` di bawah layar dengan center elevated diamond button untuk pemindai kamera QR cepat.

### 4.3 Modul 1: Manajemen Rombel & Kelas (`guru-kelas`)
- Pembuatan kelas baru dengan parameter: Tingkat (I s/d VI), Nama Rombel (misal: `Kelas IV-A`), Tahun Ajaran (`2026/2027`), dan Semester (`Ganjil/Genap`).
- Pemilihan rombel aktif (*Active Class Switcher*) yang secara dinamis memfilter modul Siswa, Presensi, dan Nilai.
- Penghapusan rombel beserta validasi konfirmasi.

### 4.4 Modul 2: Buku Induk Data Siswa (`guru-siswa`)
- **Responsive 2x2 Action Grid**:
  1. `📥 Unduh Template`: Mengunduh template `.xlsx` resmi berisi kolom NISN, Nama, JK, Tempat Lahir, Tgl Lahir, Nama Ortu.
  2. `📤 Upload Excel`: Drag-and-drop file spreadsheet, auto-parse data SheetJS, validasi duplikasi NISN, dan batch save ke cloud.
  3. `🪪 Cetak Kartu QR`: Generator kartu presensi siswa ukuran CR80 (54x86 mm) vertikal, tertata presisi **8 kartu per A4 Landscape** dengan garis putus-putus pembantu gunting.
  4. `➕ Tambah Manual`: Modal pengisian data siswa satu per satu.
- **Tabel Buku Induk**: Pencarian live nama/NISN, indikator total siswa, tombol edit profil siswa, dan tombol hapus.

### 4.5 Modul 3: Presensi Harian Siswa (`guru-presensi`)
- **Pencatatan Presensi Manual**: 4 tombol status kehadiran (*Hadir, Sakit, Izin, Alfa*) per siswa dengan penyimpanan otomatis.
- **Tombol 1-Klik "Hadir Semua Hari Ini"**: Otomatis mengubah status seluruh siswa di kelas aktif menjadi Hadir (H) dalam 1 kali sentuh.
- **Pemindai Kamera QR Cepat (Diamond FAB Center)**: Membuka modal kamera dengan viewfinder laser hijau, memindai QR siswa dalam <1 detik, konfirmasi audio sintesis ucapan *"Hadir"*, dan auto-update ke database.
- **Pemilihan Tanggal Fleksibel**: Pilihan pencatatan untuk hari ini maupun melengkapi presensi hari-hari lampau.

### 4.6 Modul 4: Input & Olah Nilai Pembelajaran (`guru-nilai`)
- **Sub-Tab Input Nilai**: Formatif TP, Sumatif Lingkup Materi / UH, Tugas Harian, PTS, dan SAS/PAS.
- **Sub-Tab Rekap & Riwayat**:
  - Konfigurasi batas KKM/KKTP (default 75).
  - Pembobotan nilai akhir otomatis: Tugas (20%), UH (30%), PTS (20%), SAS (30%).
  - Rumus nilai akhir terbobot otomatis menghasilkan angka, predikat mutu (A/B/C/D), dan status ketuntasan (*Tuntas / Belum Tuntas*).
- **Engine Cetak Laporan Nilai Resmi**:
  - Format kertas A4 Portrait ber-Kop Surat Dinas Pendidikan Koorwil Ambulu dan Satuan Pendidikan.
  - Ringkasan statistik: Rata-rata kelas, nilai tertinggi, nilai terendah, dan % ketuntasan.
  - Titimangsa Ambulu dan kolom tanda tangan Mengetahui Kepala Sekolah & Guru Pengampu lengkap dengan NIP.

### 4.7 Modul 5: Jurnal Mengajar Harian (`guru-jurnal`)
- Pencatatan jurnal: Hari/Tanggal, Jam Ke-, Mata Pelajaran, Materi Pokok / TP, Kegiatan Belajar Mengajar, Refleksi / Kendala Kelas.
- Riwayat kronologis catatan mengajar guru yang siap dicetak sebagai arsip supervisi akademik.

### 4.8 Modul 6: Jadwal Pelajaran Mingguan (`guru-jadwal`)
- Roster mata pelajaran dari Senin sampai Sabtu per jam pelajaran.
- Terintegrasi langsung dengan widget kalender ribbon di Beranda Dashboard.

### 4.9 Modul 7: Perangkat Pembelajaran (`guru-perangkat`)
- Daftar tautan langsung ke folder resmi Google Drive Koorwil Ambulu: Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Modul Ajar, dan Modul P5.

### 4.10 Modul 8: Cadangkan & Pulihkan Data Mandiri (`guru-backup`)
- **Ekspor JSON**: Mengunduh seluruh data kelas, profil siswa, riwayat presensi harian, nilai, dan jurnal ke dalam file `.json` lokal.
- **Impor JSON**: Memulihkan data instan saat guru berpindah perangkat HP atau komputer tanpa kehilangan riwayat data.

### 4.11 Panel Administrator Wilayah (`/admin`)
- Autentikasi khusus Google SSO Firebase (hanya email terdaftar di whitelist).
- Filter 14 Satuan Pendidikan se-Kecamatan Ambulu.
- Pengelolaan status guru: *Menunggu Verifikasi (Pending)*, *Terverifikasi (Verified)*, dan *Ditolak (Rejected)*.
- Fitur reset PIN guru dalam 1-klik jika guru lupa sandi.

---

## 5. Skema Relasi Database (Google Sheets Data Model)

Setiap entitas data dikelompokkan ke dalam sheet terpisah di Google Spreadsheet:

```
[ Master_Sekolah ]
├── id (SCH-20524058)
├── npsn (20524058)
├── kodeUnik (SMB04-3918)
├── nama (SDN Sumberejo 04)
├── desa (Sumberejo)
└── status (Terverifikasi)

[ Guru_{NPSN} ]
├── id (TCH-UUID)
├── nama & gelar
├── nip
├── jabatan (Guru Kelas / Mapel)
├── noWa
├── pin (Hashed / Protected PIN)
└── status (Pending / Verified / Rejected)

[ Kelas_{NPSN} ]
├── id (KLS-UUID)
├── idGuru
├── tingkat (I - VI)
├── namaRombel (Kelas IV-A)
├── tahunAjaran (2026/2027)
└── semester (Ganjil / Genap)

[ Siswa_{NPSN} ]
├── id (SIS-UUID)
├── idKelas
├── nisn (10 Digit)
├── namaLengkap
├── jenisKelamin (L / P)
├── tempatLahir & tanggalLahir
└── namaOrtu

[ Presensi_{NPSN} ]
├── id (ATT-UUID)
├── idKelas
├── idSiswa
├── tanggal (YYYY-MM-DD)
├── status (H / S / I / A)
└── timestamp

[ Nilai_{NPSN} ]
├── id (GRD-UUID)
├── idKelas
├── mapel
├── jenisAsesmen (Formatif / Sumatif / PTS / SAS)
├── materiPokok
└── scores: [ { idSiswa, nilaiAngka } ]

[ Jurnal_{NPSN} ] & [ Jadwal_{NPSN} ]
└── Entitas pendukung agenda mengajar dan roster mingguan
```

---

## 6. Persyaratan Non-Fungsional (*Non-Functional Requirements*)

1. **Performa Touch & Scroll Layar Mobile**:
   - Menghilangkan delay sentuh 300ms dengan CSS `touch-action: manipulation;`.
   - Menghilangkan `transform` pada tag `body` untuk menjamin elemen `position: fixed` (Floating Bottom Nav Dock) selalu terkunci sempurna di viewport bawah HP tanpa terdorong ke bawah konten.
   - Safe bottom clearance padding (`pb-32 sm:pb-24`) pada seluruh container halaman utama agar tidak ada tombol yang tertutup oleh navigation dock.
2. **Keamanan Tanpa Kebocoran Publik (*Secret Scanning Immunity*)**:
   - Dilarang keras menaruh API Key mentah di repositori Git publik.
   - Kunci API Firebase dikelola di Vercel Dashboard Environment Variables (`FIREBASE_API_KEY`) dan disalurkan secara terproteksi via serverless endpoint `/api/firebase-config`.
   - Domain restriction di Google Cloud Console dikunci hanya untuk domain resmi produksi (`aladminguru.vercel.app`).
3. **Ketahanan Koneksi (*Resilience & Mutex Lock*)**:
   - Google Apps Script wajib menggunakan `LockService.getScriptLock()` dengan batas tunggu timeout 30 detik agar operasi concurrent write dari banyak guru tidak merusak baris sheet.
4. **Pencetakan Presisi Standar Industri**:
   - Modul cetak memanfaatkan iframe terisolasi atau class `@media print` dengan CSS reset margin dan background forced-render (`-webkit-print-color-adjust: exact; print-color-adjust: exact;`).

---
---

# BAGIAN 2: MASTER MEGA-PROMPT PEMBUATAN APLIKASI
*(Gunakan Mega-Prompt berikut ini untuk menginstruksikan AI Coding Agent / LLM dalam membuat ulang atau meregenerasi seluruh sistem SiGuru SD dari nol tanpa ada logika yang terlewat).*

---

```markdown
### MASTER MEGA-PROMPT: FULL-STACK DEVELOPMENT "SIGURU SD DIGITAL"

Bertindaklah sebagai Senior Principal Full-Stack Engineer, UI/UX Designer kelas dunia, dan Spesialis Sistem Informasi Pendidikan Sekolah Dasar. Tugas Anda adalah membangun aplikasi web lengkap bernama "SiGuru SD Digital" (Platform Administrasi Guru SD Multi-Tenant Terpadu Berbasis Google Workspace & Serverless Edge) dari awal hingga tuntas.

Aplikasi ini ditujukan untuk seluruh Guru SD Negeri di Kecamatan Ambulu, Kabupaten Jember, dengan standar produksi tinggi: modern, ultra-ringan di HP, responsif, elegan, bebas dependensi berat, dan aman.

Patuhi seluruh instruksi arsitektur, desain, alur data, dan keamanan berikut ini:

---

### 1. TUJUAN & RUANG LINGKUP SISTEM
Buat sistem Single-Page Application (SPA) komprehensif yang terdiri dari 2 portal:
1. Portal Guru Mandiri (`index.html`): Mengelola Rombel, Buku Induk Siswa, Impor/Ekspor Excel, Cetak Kartu Presensi QR Jumbo A4, Scanner Kamera QR Presensi Cepat, Olah Nilai Formatif/Sumatif/SAS terbobot, Jurnal Mengajar Harian, Roster Jadwal Mingguan, Unduh Perangkat Pembelajaran Drive, dan Cadangkan Data JSON.
2. Portal Administrator (`admin.html`): Mengelola persetujuan akun guru baru (Pending/Verified/Rejected), filter 14 SD se-Kecamatan Ambulu, reset PIN guru, verifikasi struktur sheet, dan integrasi Google SSO resmi.
3. Serverless Edge Gateway (`vercel.json`, `/api/gas.js`, `/api/firebase-config.js`): Jembatan CORS bypass untuk Google Apps Script dan pengaman API Key Firebase via Environment Variables.
4. Backend API Script (`gas/Code.gs`): REST API JSON lengkap untuk Google Apps Script berbasis DoGet/DoPost dengan Mutex Lock.

---

### 2. TATA KELOLA TAMPILAN & DESIGN SYSTEM (UI/UX)
1. Gunakan Tailwind CSS CDN v3.4+ dengan ekstensi font Plus Jakarta Sans, Outfit, dan JetBrains Mono.
2. Palet Warna "Soft Pastel Lavender & Cyber Dark Mode":
   - Light Mode: Background `#F0EEF9`, Card White dengan border `#E2DEF7` dan soft shadow `0 10px 30px rgba(124,110,230,0.08)`. Brand Color `#7C6EE6` (Primary), `#6C5CE7` (Hover), `#1E1B4B` (Dark Text), `#7C7A9C` (Muted).
   - Dark Mode: Background `#060911`, Card Glass Dark `rgba(18, 24, 40, 0.88)` dengan border `rgba(167, 139, 250, 0.18)` dan glowing neon accents. Dark mode harus terinisialisasi instan sebelum render DOM via localStorage agar tidak ada screen-flash putih.
3. Optimasi Touch Mobile & Tablet:
   - Dilarang keras menaruh `transform: translate3d` pada tag `body` karena akan merusak posisi elemen anak yang berposisi `fixed` (seperti bottom navigation dock) sesuai spesifikasi W3C CSS Transforms.
   - Tambahkan `touch-action: manipulation;` untuk menghilangkan delay 300ms sentuhan mobile.
   - Seluruh kontainer view utama (`#portalDashboardView` dan `#moduleView`) wajib memiliki padding bawah aman `pb-32 sm:pb-24` agar konten paling bawah tidak tertutup oleh dock navigasi melayang.
4. Floating Bottom Navigation Dock:
   - Posisi `fixed !important; bottom: calc(0.85rem + env(safe-area-inset-bottom)) !important; left: 50% !important; transform: translate3d(-50%, 0, 0) !important; z-index: 50 !important;`.
   - Grid 5 kolom: Beranda, Kelas, Center Diamond Elevated FAB (Kamera QR Scan Cepat), Perangkat, dan Pengaturan.

---

### 3. KEAMANAN & MANAJEMEN RAHASIA (SECRET SCANNING IMMUNITY)
1. Dilarang keras menaruh string mentah Google/Firebase API Key (`AIzaSy...`) di dalam repositori Git publik (misal di `config.js`).
2. Implementasikan serverless function `api/firebase-config.js` yang membaca `process.env.FIREBASE_API_KEY` dari Vercel Environment Variables dan mengembalikannya dalam format JSON melalui header CORS yang aman.
3. Pada `admin.html`, buat fungsi async `loadFirebaseConfigFromApi()` yang memanggil endpoint `/api/firebase-config` saat halaman dimuat, lalu fallback ke `localStorage` jika pengujian offline lokal.
4. Di `config.js`, kosongkan properti `apiKey: ""` dan beri keterangan bahwa kredensial diinjeksi via Vercel Edge.

---

### 4. SPESIFIKASI BACKEND REST API (Code.gs)
Buat file `gas/Code.gs` untuk Google Apps Script dengan spesifikasi:
1. Entry point `doPost(e)` dan `doGet(e)` yang menerima payload `{ action, payload }`.
2. Gunakan `const lock = LockService.getScriptLock(); lock.waitLock(30000);` di awal setiap operasi tulis dan pastikan selalu `lock.releaseLock()` di blok `finally`.
3. Multi-School Sheet Router:
   - Sheet `Master_Sekolah`: Daftar NPSN, Kode Unik Lembaga, Nama Sekolah, Desa, Status.
   - Sheet otomatis per sekolah: `TCH_{NPSN}`, `KLS_{NPSN}`, `SIS_{NPSN}`, `ATT_{NPSN}`, `GRD_{NPSN}`, `JRN_{NPSN}`, `JDW_{NPSN}`.
4. Action Handlers Wajib:
   - `loginTeacherWithPin`: Validasi NPSN, Kode Unik, TeacherID, dan PIN.
   - `registerTeacher`: Mendaftarkan guru baru dengan status `isPending = true`.
   - `getTeacherPortalData`: Mengambil bundle data lengkap kelas, siswa, presensi, nilai, jadwal, dan jurnal milik guru tersebut dalam 1 kali round-trip hemat kuota.
   - `saveClassTeacher`, `deleteClassTeacher`: CRUD rombel guru.
   - `saveStudentsBatch`: Menyimpan batch siswa dari hasil impor Excel SheetJS.
   - `saveAttendanceBatch`: Menyimpan presensi harian siswa (H, S, I, A).
   - `saveGradeSheet`: Menyimpan lembar penilaian formatif/sumatif/SAS.
   - `saveJournal`: Menyimpan catatan jurnal mengajar harian.
   - `adminGetPendingTeachers`, `adminVerifyTeacher`, `adminResetTeacherPin`: Fungsi kontrol panel administrator.

---

### 5. SPESIFIKASI MODUL GURU MANDIRI (index.html)
Bangun Single-Page Application di `public/index.html` dengan seluruh alur kerja:

1. Autentikasi Guru:
   - Validasi NPSN 8 digit dan Kode Unik sekolah (ambil master dari `config.js` MASTER_SEKOLAH_AMBULU).
   - Dropdown guru terverifikasi.
   - Input PIN 6 digit tersamar (`••••••`).
   - Tombol "+ Belum Terdaftar?" untuk membuka tab pendaftaran guru baru.
   - Fullscreen Cinematic Splash Screen dengan progress ring SVG dan teks status bertahap.
2. Dashboard Guru:
   - Header profil, greeting dinamis, real-time sync dot badge, mode gelap glowing toggle, logout.
   - Smart search bar live filter.
   - 7-Day calendar ribbon dengan penanda roster hari ini.
   - Hero widget jam digital WIB, tanggal Indonesia, target kehadiran %, dan interactive SVG wave chart.
   - 8 Card Grid menu guru mandiri.
3. Modul Buku Induk Data Siswa:
   - Header aksi 2x2 Responsive Grid di mobile (`grid grid-cols-2 sm:flex sm:flex-wrap gap-2`):
     * `📥 Unduh Template`: Men-generate dan mengunduh berkas Excel `.xlsx` resmi menggunakan SheetJS.
     * `📤 Upload Excel`: Modal upload file drag-and-drop, validasi parsing SheetJS, pemetaan kolom NISN, Nama, JK, Tempat Lahir, Tgl Lahir, Ortu, dan batch insert.
     * `🪪 Cetak Kartu QR`: Generator kartu presensi siswa CR80 (54x86 mm) vertikal, 8 kartu per A4 Landscape lengkap dengan garis potong putus-putus.
     * `➕ Tambah Manual`: Modal tambah siswa satu per satu.
   - Empty state responsif dengan tombol yang tidak tumpang-tindih.
4. Modul Presensi Siswa:
   - Tombol 1-klik "Hadir Semua Hari Ini" yang mengubah seluruh siswa aktif menjadi Hadir seketika.
   - Tombol kamera Diamond FAB tengah di floating nav dock yang membuka modal kamera scanner `html5-qrcode` dengan laser reticle hijau, deteksi instan 1 detik per anak, dan suara audio konfirmasi "Hadir".
   - Pencatatan manual 4 status (H, S, I, A) per siswa.
   - Pemilih tanggal presensi fleksibel.
5. Modul Input & Olah Nilai:
   - Sub-tab Lembar Input (Formatif TP, Sumatif Bab/UH, Tugas, PTS, SAS).
   - Sub-tab Rekap Nilai terbobot otomatis (Tugas 20%, UH 30%, PTS 20%, SAS 30%, batas KKM/KKTP 75).
   - Engine Cetak Rekapitulasi Nilai Resmi ber-Kop Surat Dinas, Koorwil Ambulu, Satuan Pendidikan, Titimangsa Ambulu, dan Tanda Tangan Kepala Sekolah & Guru (lengkap NIP).
6. Modul Jurnal & Jadwal:
   - Tulis jurnal mengajar harian (Mapel, materi pokok, refleksi/kendala).
   - Roster jadwal Senin–Sabtu yang terhubung ke kalender beranda.
7. Modul Cadangkan Data:
   - Ekspor seluruh database lokal guru ke file `.json`.
   - Impor pemulihan data instan dari file `.json` saat berganti perangkat.
8. Pengaturan Profil & Kop Cetak:
   - Modal edit identitas guru, NIP, jabatan, ganti PIN.
   - Penyetelan nama & NIP Kepala Sekolah, titimangsa kota.
   - Penyetelan 4 baris teks Kop Surat resmi laporan.

---

### 6. PANDUAN PENGGUNA TERINTEGRASI (panduan-guru.html)
Buat halaman cetak buku panduan resmi A4 di `public/panduan-guru.html` dengan CSS `@media print` A4 Portrait, kop surat resmi Koorwil Ambulu, penomoran halaman, tombol "🖨️ Cetak / Simpan sebagai PDF", dan penjelasan lengkap langkah demi langkah dari Login hingga seluruh fitur modul.

---

### 7. STANDAR KUALITAS KODE & DELIVERABLES
- Tulis kode secara bersih, modular, terstruktur, tanpa potongan kode placeholder (`// TODO` atau kode terpotong).
- Semua fungsi event listener, modal dialog, parsing Excel, rendering tabel, dan sinkronisasi cloud harus berfungsi 100% secara nyata.
- Sediakan file konfigurasi Vercel `vercel.json` dengan route proxy `/api/(.*)` dan rewrites yang tepat.
- Sediakan script automasi push Git lokal Windows `push_ke_github.bat` yang otomatis melakukan add, commit, dan push tanpa meminta input manual berulang.
```

---
*Dokumen ini merupakan cetak biru spesifikasi teknis dan prompt master resmi untuk pengembangan dan pemeliharaan aplikasi SiGuru SD Digital.*
