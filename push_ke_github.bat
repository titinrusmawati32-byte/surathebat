@echo off
if exist "%SystemRoot%\System32\chcp.com" "%SystemRoot%\System32\chcp.com" 65001 >nul 2>&1
echo ========================================================
echo  OTOMATISASI PUSH GIT KE GITHUB - SDN SUMBEREJO 04
echo ========================================================
echo.

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    git remote add origin https://github.com/titinrusmawati32-byte/surathebat.git
)

echo [1/3] Menambahkan seluruh berkas (git add)...
git add .

echo [2/3] Membuat commit...
set /p msg="Masukkan pesan commit (Tekan Enter untuk default): "
if "%msg%"=="" set msg=feat: update aplikasi surat aktif lomba dan surat tugas sdn sumberejo 04
git commit -m "%msg%"

echo [3/3] Mengunggah ke GitHub (git push)...
git push origin main

echo.
echo ========================================================
echo  Proses Selesai! Cek di: https://github.com/titinrusmawati32-byte/surathebat
echo ========================================================
pause
