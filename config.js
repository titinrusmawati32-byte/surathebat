/**
 * ============================================================================
 * KONFIGURASI DATABASE GOOGLE APPS SCRIPT (SDN SUMBEREJO 04)
 * ============================================================================
 * File ini menghubungkan Frontend (Vercel / GitHub Pages / Lokal)
 * dengan Backend Google Apps Script & Google Sheets.
 *
 * CARA PAKAI:
 * 1. Buka Google Spreadsheet Anda > Ekstensi > Apps Script.
 * 2. Deploy sebagai Web App (Execute as: Me, Who has access: Anyone).
 * 3. Salin Web App URL yang berakhiran "/exec".
 * 4. Tempelkan URL tersebut pada variabel GAS_WEBAPP_URL di bawah ini.
 * ============================================================================
 */

const APP_CONFIG = {
  // Ganti teks di bawah ini dengan URL Web App Google Apps Script Anda:
  GAS_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbz_GANTI_DENGAN_URL_WEB_APP_ANDA/exec",

  // Identitas Satuan Pendidikan
  NAMA_SEKOLAH: "SD NEGERI SUMBEREJO 04",
  KECAMATAN_KABUPATEN: "Kec. Ambulu Kab. Jember",
  NPSN: "20524058",

  // Konfigurasi Proxy Vercel
  // Saat dideploy ke Vercel, request akan melalui /api/gas untuk mem-bypass CORS secara otomatis
  USE_VERCEL_PROXY: true,

  // Waktu tunggu maksimal (Timeout) dalam milidetik (15 detik)
  TIMEOUT_MS: 15000
};

// Ekspor agar dapat dibaca di Browser (Window) maupun Node.js (Vercel)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
