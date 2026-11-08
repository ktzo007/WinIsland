@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul || (echo [X] Node.js belum terpasang. Unduh dari https://nodejs.org & exit /b 1)
where cargo >nul 2>nul || (echo [X] Rust belum terpasang. Unduh dari https://rustup.rs & exit /b 1)

echo [1/2] Memasang dependensi npm...
call npm install || exit /b 1

echo [2/2] Build release (pertama kali 5-15 menit, berikutnya jauh lebih cepat)...
call npm run app:exe || exit /b 1

if not exist release mkdir release
copy /Y "src-tauri\target\release\dynamic-island.exe" "release\DynamicIsland.exe" >nul

echo.
echo Selesai. File siap pakai: release\DynamicIsland.exe
endlocal
