@echo off
chcp 65001 >nul
echo ========================================================
echo  OTOMATISASI PUSH GIT KE GITHUB - SDN SUMBEREJO 04
echo ========================================================
echo.

git status >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Inisialisasi Git repository...
    git init
    git branch -M main
)

echo [1/3] Menambahkan seluruh berkas (git add)...
git add .

echo [2/3] Membuat commit...
set /p msg="Masukkan pesan commit (Tekan Enter untuk default): "
if "%msg%"=="" set msg=feat: update aplikasi surat aktif lomba dan surat tugas sdn sumberejo 04
git commit -m "%msg%"

echo [3/3] Mengunggah ke GitHub (git push)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [PETUNJUK] Jika remote origin belum diatur, jalankan perintah:
    echo git remote add origin https://github.com/titinrusmawati32-byte/NAMA_REPO_ANDA.git
    echo git push -u origin main
)

echo.
echo ========================================================
echo  Proses Selesai!
echo ========================================================
pause
