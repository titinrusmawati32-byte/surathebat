/**
 * ============================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS)
 * Aplikasi: Generator Surat Aktif Lomba & Surat Tugas — SD Negeri Sumberejo 04
 * Versi: 3.0.0 (Presisi Cetak PDF A4 & Ekspor Word Rapi)
 * ============================================================================
 */

const APP_TITLE = 'Surat Aktif Lomba & Surat Tugas — SD Negeri Sumberejo 04';

const SHEET_NAMES = {
  USERS: 'Users',
  SISWA: 'Siswa',
  PENGATURAN: 'Pengaturan_Sekolah',
  LOMBA: 'Master_Lomba',
  RIWAYAT: 'Riwayat_Surat',
  DETAIL: 'Detail_Peserta_Surat',
  ASET: 'Aset_Gambar'
};

/**
 * Menyajikan halaman utama Web App
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  return template
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handler POST untuk integrasi REST API jika diakses via fetch eksternal
 */
function doPost(e) {
  let output = { success: false, message: 'Permintaan tidak valid' };
  try {
    const postData = JSON.parse(e.postData.contents || '{}');
    const action = postData.action;
    const payload = postData.payload;

    switch (action) {
      case 'getInitialData':
        output = getInitialData();
        break;
      case 'saveSurat':
        output = saveSurat(payload);
        break;
      case 'deleteSurat':
        output = deleteSurat(payload.idSurat);
        break;
      case 'importSiswaBulk':
        output = importSiswaBulk(payload.siswaList, payload.replaceAll);
        break;
      case 'savePengaturan':
        output = savePengaturan(payload);
        break;
      case 'saveAsetGambar':
        output = saveAsetGambar(payload.kunciAset, payload.dataBase64);
        break;
      case 'loginUser':
        output = loginUser(payload.username, payload.password);
        break;
      default:
        output = { success: false, message: 'Aksi "' + action + '" tidak dikenali' };
    }
  } catch (err) {
    output = { success: false, message: 'Error Server: ' + err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper internal: mengambil Spreadsheet aktif (Container-Bound)
 */
function getSS_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Skrip ini harus terikat pada Google Spreadsheet (Ekstensi > Apps Script).');
  }
  return ss;
}

/**
 * Helper internal: membuat atau mengambil sheet beserta header resminya
 */
function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#1E3A5F')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * ============================================================================
 * 1. SETUP DATABASE OTOMATIS (7 SHEET SIAP PAKAI)
 * ============================================================================
 */
function setupDatabase() {
  const ss = getSS_();

  // 1. Sheet Users
  const shUsers = getOrCreateSheet_(ss, SHEET_NAMES.USERS, [
    'username', 'password', 'nama_lengkap', 'role', 'status'
  ]);
  if (shUsers.getLastRow() <= 1) {
    shUsers.getRange(2, 1, 2, 5).setValues([
      ['admin', 'admin2026', 'Administrator Sekolah', 'Admin', 'Aktif'],
      ['guru', 'guru2026', 'Guru Pembina Lomba', 'Guru', 'Aktif']
    ]);
  }

  // 2. Sheet Siswa
  const shSiswa = getOrCreateSheet_(ss, SHEET_NAMES.SISWA, [
    'id_siswa', 'nisn', 'nama_lengkap', 'jk', 'tempat_lahir',
    'tanggal_lahir', 'rombel', 'kelas_romawi', 'nik', 'alamat', 'status_aktif'
  ]);
  shSiswa.getRange('B:B').setNumberFormat('@');
  shSiswa.getRange('I:I').setNumberFormat('@');

  // 3. Sheet Pengaturan_Sekolah
  const shCfg = getOrCreateSheet_(ss, SHEET_NAMES.PENGATURAN, [
    'kunci', 'nilai', 'keterangan'
  ]);
  shCfg.getRange('B:B').setNumberFormat('@');
  if (shCfg.getLastRow() <= 1) {
    const defaultCfg = [
      ['instansi_induk', 'PEMERINTAH KABUPATEN JEMBER', 'Baris 1 Kop Surat'],
      ['nama_sekolah', 'SD NEGERI SUMBEREJO 04', 'Baris 2 Kop Surat'],
      ['alamat_baris1', 'Jalan Lapangan No. 88 Krajan Kidul Desa Sumberejo Kec. Ambulu', 'Baris 3 Kop Surat'],
      ['alamat_baris2', 'Jember 68172', 'Baris 4 Kop Surat'],
      ['email_sekolah', 'sumbersdn04@gmail.com', 'Baris 5 Kop Surat'],
      ['kecamatan_kabupaten', 'Kec. Ambulu Kab. Jember', 'Teks pembuka surat'],
      ['tempat_ttd', 'Kec. Ambulu', 'Lokasi tanggal tanda tangan'],
      ['kepala_sekolah', 'Samsul Arifin, S.Pd', 'Nama Kepala Sekolah'],
      ['nip_kepsek', '197108252003121001', 'NIP Kepala Sekolah'],
      ['pangkat_gol', 'Penata Tk. I, III/d', 'Pangkat/Golongan Kepala Sekolah'],
      ['jabatan_kepsek', 'Kepala SD Negeri Sumberejo 04', 'Jabatan penandatangan'],
      ['kode_klasifikasi', '421.2', 'Kode klasifikasi surat'],
      ['kode_instansi', '335.09.310.02.20524058', 'Kode instansi nomor surat'],
      ['nomor_urut_terakhir', '101', 'Nomor urut terakhir'],
      ['tahun_surat', '2026', 'Tahun surat']
    ];
    shCfg.getRange(2, 1, defaultCfg.length, 3).setValues(defaultCfg);
  }

  // 4. Sheet Master_Lomba
  const shLomba = getOrCreateSheet_(ss, SHEET_NAMES.LOMBA, [
    'id_lomba', 'nama_cabang', 'kategori', 'status'
  ]);
  if (shLomba.getLastRow() <= 1) {
    const defaultLomba = [
      ['LMB-001', 'IPA', 'OSN', 'Aktif'],
      ['LMB-002', 'Matematika', 'OSN', 'Aktif'],
      ['LMB-003', 'IPS', 'OSN', 'Aktif'],
      ['LMB-004', 'Menyanyi Solo', 'FLS2N', 'Aktif'],
      ['LMB-005', 'Gambar Bercerita', 'FLS2N', 'Aktif'],
      ['LMB-006', 'Kriya', 'FLS2N', 'Aktif'],
      ['LMB-007', 'Pantomim', 'FLS2N', 'Aktif'],
      ['LMB-008', 'Seni Tari', 'FLS2N', 'Aktif'],
      ['LMB-009', 'Atletik', 'O2SN', 'Aktif'],
      ['LMB-010', 'Renang', 'O2SN', 'Aktif'],
      ['LMB-011', 'Bulu Tangkis', 'O2SN', 'Aktif'],
      ['LMB-012', 'Pencak Silat', 'O2SN', 'Aktif'],
      ['LMB-013', 'MTQ / PAI', 'Keagamaan', 'Aktif'],
      ['LMB-014', 'Pramuka', 'Ekstrakurikuler', 'Aktif']
    ];
    shLomba.getRange(2, 1, defaultLomba.length, 4).setValues(defaultLomba);
  }

  // 5. Sheet Riwayat_Surat
  getOrCreateSheet_(ss, SHEET_NAMES.RIWAYAT, [
    'id_surat', 'tipe_surat', 'nomor_urut', 'nomor_surat', 'tanggal_surat',
    'cabang_lomba', 'nama_kegiatan', 'jumlah_siswa', 'status',
    'dibuat_pada', 'catatan'
  ]);

  // 6. Sheet Detail_Peserta_Surat
  const shDetail = getOrCreateSheet_(ss, SHEET_NAMES.DETAIL, [
    'id_detail', 'id_surat', 'no_urut', 'id_siswa', 'nama_siswa',
    'cabang_lomba', 'kelas_saat_surat', 'nisn', 'ttl'
  ]);
  shDetail.getRange('H:H').setNumberFormat('@');

  // 7. Sheet Aset_Gambar (Chunking 40.000 karakter per sel)
  getOrCreateSheet_(ss, SHEET_NAMES.ASET, [
    'kunci_aset', 'chunk_index', 'data_base64', 'diperbarui_pada'
  ]);

  // Bersihkan Sheet1 bawaan jika kosong
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }

  return {
    success: true,
    spreadsheetId: ss.getId(),
    message: 'Database berhasil dibuat/diverifikasi (7 Sheet siap digunakan).'
  };
}

/**
 * ============================================================================
 * 2. AUTENTIKASI LOGIN
 * ============================================================================
 */
function loginUser(username, password) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) {
    return { success: false, message: 'Sheet Users belum ada. Jalankan setupDatabase() terlebih dahulu.' };
  }

  const uInput = String(username || '').trim().toLowerCase();
  const pInput = String(password || '').trim();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const uSheet = String(data[i][0] || '').trim().toLowerCase();
    const pSheet = String(data[i][1] || '').trim();
    const nama = String(data[i][2] || '').trim();
    const role = String(data[i][3] || 'Guru').trim();
    const status = String(data[i][4] || 'Aktif').trim();

    if (uSheet === uInput && pSheet === pInput) {
      if (status.toLowerCase() !== 'aktif') {
        return { success: false, message: 'Akun ini sedang dinonaktifkan.' };
      }
      return {
        success: true,
        user: { username: uSheet, nama_lengkap: nama, role: role }
      };
    }
  }

  return { success: false, message: 'Username atau password salah.' };
}

/**
 * ============================================================================
 * 3. MUAT DATA AWAL APLIKASI (SINGLE ROUND-TRIP CALL)
 * ============================================================================
 */
function getInitialData() {
  return {
    success: true,
    pengaturan: getPengaturan(),
    siswa: getDaftarSiswa(),
    lomba: getMasterLomba(),
    riwayat: getRiwayatSurat(),
    aset: getAsetGambar()
  };
}

function formatKelasRomawi_(rombel) {
  const str = String(rombel || '').trim();
  const digit = str.charAt(0);
  const map = {
    '1': 'I (Satu)',
    '2': 'II (Dua)',
    '3': 'III (Tiga)',
    '4': 'IV (Empat)',
    '5': 'V (Lima)',
    '6': 'VI (Enam)'
  };
  return map[digit] || str;
}

/**
 * ============================================================================
 * 4. PENGELOLAAN DATA SISWA (READ & BULK IMPORT DAPODIK)
 * ============================================================================
 */
function getDaftarSiswa() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_NAMES.SISWA);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getDisplayValues();
  return rows
    .filter(r => r[2] !== '')
    .map(r => ({
      id_siswa: r[0],
      nisn: r[1],
      nama_lengkap: r[2],
      jk: r[3],
      tempat_lahir: r[4],
      tanggal_lahir: r[5],
      rombel: r[6],
      kelas_romawi: r[7] || formatKelasRomawi_(r[6]),
      nik: r[8],
      alamat: r[9],
      status_aktif: r[10] || 'Aktif'
    }));
}

function importSiswaBulk(siswaList, replaceAll) {
  if (!Array.isArray(siswaList) || siswaList.length === 0) {
    return { success: false, message: 'Data siswa kosong.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ss = getSS_();
    const sheet = getOrCreateSheet_(ss, SHEET_NAMES.SISWA, [
      'id_siswa', 'nisn', 'nama_lengkap', 'jk', 'tempat_lahir',
      'tanggal_lahir', 'rombel', 'kelas_romawi', 'nik', 'alamat', 'status_aktif'
    ]);

    let startIndex = 1;
    if (replaceAll && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).clearContent();
    } else {
      startIndex = Math.max(1, sheet.getLastRow());
    }

    const rowsToWrite = siswaList.map((s, idx) => {
      const seq = String(startIndex + idx).padStart(3, '0');
      const nisnClean = String(s.nisn || '').replace(/\.0$/, '').trim();
      const rombel = String(s.rombel || '').trim();
      return [
        s.id_siswa || ('SIS-' + seq),
        nisnClean ? ("'" + nisnClean) : '',
        String(s.nama_lengkap || s.nama || '').trim(),
        String(s.jk || '').trim().toUpperCase(),
        String(s.tempat_lahir || s.tempat || '').trim().toUpperCase(),
        String(s.tanggal_lahir || s.tgl || '').trim().slice(0, 10),
        rombel,
        s.kelas_romawi || formatKelasRomawi_(rombel),
        s.nik ? ("'" + String(s.nik).replace(/\.0$/, '').trim()) : '',
        String(s.alamat || '').trim(),
        s.status_aktif || 'Aktif'
      ];
    });

    const targetRow = replaceAll ? 2 : sheet.getLastRow() + 1;
    sheet.getRange(targetRow, 1, rowsToWrite.length, 11).setValues(rowsToWrite);

    return {
      success: true,
      count: rowsToWrite.length,
      message: rowsToWrite.length + ' data siswa berhasil disimpan ke Google Sheets.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ============================================================================
 * 5. PENGATURAN SEKOLAH & MASTER LOMBA
 * ============================================================================
 */
function getPengaturan() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  const cfg = {};
  if (!sheet || sheet.getLastRow() <= 1) return cfg;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  rows.forEach(r => {
    if (r[0]) cfg[r[0]] = r[1];
  });
  return cfg;
}

function savePengaturan(configObj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    const data = sheet.getDataRange().getValues();
    const keyRowMap = {};

    for (let i = 1; i < data.length; i++) {
      keyRowMap[String(data[i][0])] = i + 1;
    }

    Object.keys(configObj).forEach(key => {
      const val = "'" + String(configObj[key] == null ? '' : configObj[key]);
      if (keyRowMap[key]) {
        sheet.getRange(keyRowMap[key], 2).setValue(val);
      } else {
        sheet.appendRow([key, val, 'Pengaturan custom']);
      }
    });

    return { success: true, message: 'Pengaturan sekolah berhasil disimpan.' };
  } finally {
    lock.releaseLock();
  }
}

function getMasterLomba() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_NAMES.LOMBA);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues();
  return rows
    .filter(r => r[1] !== '' && r[3].toLowerCase() === 'aktif')
    .map(r => ({ id_lomba: r[0], nama_cabang: r[1], kategori: r[2], status: r[3] }));
}

/**
 * ============================================================================
 * 6. RIWAYAT SURAT & DETAIL PESERTA (RELASIONAL)
 * ============================================================================
 */
function getRiwayatSurat() {
  const ss = getSS_();
  const shRiw = ss.getSheetByName(SHEET_NAMES.RIWAYAT);
  const shDet = ss.getSheetByName(SHEET_NAMES.DETAIL);
  if (!shRiw || shRiw.getLastRow() <= 1) return [];

  const riwRows = shRiw.getRange(2, 1, shRiw.getLastRow() - 1, 11).getDisplayValues();
  const detMap = {};

  if (shDet && shDet.getLastRow() > 1) {
    const detRows = shDet.getRange(2, 1, shDet.getLastRow() - 1, 9).getDisplayValues();
    detRows.forEach(d => {
      const idSurat = d[1];
      if (!detMap[idSurat]) detMap[idSurat] = [];
      detMap[idSurat].push({
        id_detail: d[0],
        no_urut: Number(d[2]) || 1,
        id_siswa: d[3],
        nama_siswa: d[4],
        cabang_lomba: d[5],
        kelas_saat_surat: d[6],
        nisn: d[7],
        ttl: d[8]
      });
    });
  }

  return riwRows
    .filter(r => r[0] !== '')
    .map(r => ({
      id_surat: r[0],
      tipe_surat: r[1] || 'Surat Aktif',
      nomor_urut: Number(r[2]) || 0,
      nomor_surat: r[3],
      tanggal_surat: r[4],
      cabang_lomba: r[5],
      nama_kegiatan: r[6],
      jumlah_siswa: Number(r[7]) || 0,
      status: r[8] || 'Terbit',
      dibuat_pada: r[9],
      catatan: r[10],
      peserta: detMap[r[0]] || []
    }))
    .reverse();
}

function saveSurat(payload) {
  if (!payload || !Array.isArray(payload.peserta) || payload.peserta.length === 0) {
    return { success: false, message: 'Minimal pilih 1 peserta sebelum menyimpan surat.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ss = getSS_();
    const shRiw = ss.getSheetByName(SHEET_NAMES.RIWAYAT);
    const shDet = ss.getSheetByName(SHEET_NAMES.DETAIL);

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const tahun = String(payload.tanggal_surat || nowStr).slice(0, 4);
    const idSurat = payload.id_surat || ('SRT-' + tahun + '-' + String(Date.now()).slice(-5));

    deleteSuratRows_(shRiw, shDet, idSurat);

    const noUrut = Number(payload.nomor_urut) || 0;
    shRiw.appendRow([
      idSurat,
      payload.tipe_surat || 'Surat Aktif',
      noUrut,
      String(payload.nomor_surat || '').trim(),
      String(payload.tanggal_surat || '').trim(),
      String(payload.cabang_lomba || '').trim(),
      String(payload.nama_kegiatan || '').trim(),
      payload.peserta.length,
      payload.status || 'Terbit',
      nowStr,
      String(payload.catatan || '').trim()
    ]);

    const detailRows = payload.peserta.map((p, idx) => [
      'DTL-' + idSurat.slice(-5) + '-' + String(idx + 1).padStart(2, '0'),
      idSurat,
      idx + 1,
      String(p.id_siswa || ''),
      String(p.nama_siswa || p.nama || '').trim(),
      String(p.cabang_lomba || payload.cabang_lomba || '').trim(),
      String(p.kelas_saat_surat || p.kelas || '').trim(),
      p.nisn ? ("'" + String(p.nisn).trim()) : '',
      String(p.ttl || '').trim()
    ]);

    if (detailRows.length > 0) {
      shDet.getRange(shDet.getLastRow() + 1, 1, detailRows.length, 9).setValues(detailRows);
    }

    const cfg = getPengaturan();
    const lastNo = Number(cfg.nomor_urut_terakhir) || 0;
    if (noUrut > lastNo) {
      savePengaturan({ nomor_urut_terakhir: String(noUrut) });
    }

    return {
      success: true,
      id_surat: idSurat,
      message: 'Surat berhasil disimpan ke Google Sheets.'
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteSurat(idSurat) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = getSS_();
    const shRiw = ss.getSheetByName(SHEET_NAMES.RIWAYAT);
    const shDet = ss.getSheetByName(SHEET_NAMES.DETAIL);
    deleteSuratRows_(shRiw, shDet, idSurat);
    return { success: true, message: 'Riwayat surat berhasil dihapus.' };
  } finally {
    lock.releaseLock();
  }
}

function deleteSuratRows_(shRiw, shDet, idSurat) {
  if (shRiw && shRiw.getLastRow() > 1) {
    const riwData = shRiw.getDataRange().getValues();
    for (let i = riwData.length - 1; i >= 1; i--) {
      if (String(riwData[i][0]) === String(idSurat)) {
        shRiw.deleteRow(i + 1);
      }
    }
  }
  if (shDet && shDet.getLastRow() > 1) {
    const detData = shDet.getDataRange().getValues();
    for (let i = detData.length - 1; i >= 1; i--) {
      if (String(detData[i][1]) === String(idSurat)) {
        shDet.deleteRow(i + 1);
      }
    }
  }
}

/**
 * ============================================================================
 * 7. PENYIMPANAN ASET GAMBAR RESOLUSI TINGGI (CHUNKING 40.000 KARAKTER)
 * ============================================================================
 */
function saveAsetGambar(kunciAset, dataBase64) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = getSS_();
    const sheet = getOrCreateSheet_(ss, SHEET_NAMES.ASET, [
      'kunci_aset', 'chunk_index', 'data_base64', 'diperbarui_pada'
    ]);

    if (sheet.getLastRow() > 1) {
      const existing = sheet.getDataRange().getValues();
      for (let i = existing.length - 1; i >= 1; i--) {
        if (String(existing[i][0]) === String(kunciAset)) {
          sheet.deleteRow(i + 1);
        }
      }
    }

    if (!dataBase64) {
      return { success: true, message: 'Aset ' + kunciAset + ' dihapus.' };
    }

    const chunkSize = 40000;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const rows = [];
    for (let i = 0; i < dataBase64.length; i += chunkSize) {
      rows.push([kunciAset, Math.floor(i / chunkSize), dataBase64.slice(i, i + chunkSize), nowStr]);
    }

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    return { success: true, message: 'Aset ' + kunciAset + ' berhasil disimpan.' };
  } finally {
    lock.releaseLock();
  }
}

function getAsetGambar() {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_NAMES.ASET);
  const result = {};
  if (!sheet || sheet.getLastRow() <= 1) return result;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const grouped = {};
  rows.forEach(r => {
    const key = String(r[0]);
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ idx: Number(r[1]) || 0, data: String(r[2] || '') });
  });

  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => a.idx - b.idx);
    result[key] = grouped[key].map(item => item.data).join('');
  });
  return result;
}