@echo off
title CareerSync Development Launcher
echo ==============================================================
echo        Starting CareerSync Anti-Ghosting Platform
echo ==============================================================
echo.
echo [1/2] Launching Backend Service (Spring Boot 3.4 on Port 8080)...
start "CareerSync Backend (Port 8080)" cmd /k "cd /d "%~dp0backend" && run_backend.bat"

echo.
echo [2/2] Launching Frontend UI (Vite + React on Port 5173)...
start "CareerSync Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ==============================================================
echo  Both services launched in separate windows!
echo  Backend:  http://localhost:8080
echo  Frontend: http://localhost:5173
echo ==============================================================
