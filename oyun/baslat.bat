@echo off
REM Mezuniyet.exe - yerel sunucuyu baslatir ve oyunu acar
cd /d "%~dp0"
start "Mezuniyet sunucu (kapatma)" python -m http.server 8765 --bind 127.0.0.1
timeout /t 2 >nul
start "" "http://localhost:8765/index.html"
