@echo off
title ACTS - Launching All Services...
color 0A

set ROOT=D:\LetsCode\ACTS_project-main

echo.
echo  ==========================================
echo   ACTS - Autonomous Civic Triage System
echo   Starting all services...
echo  ==========================================
echo.

REM ── 1. Kill any stale processes on our ports ──────────────────────────────────
echo [1/5] Cleaning stale port bindings...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5174 "') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

REM ── 2. Django Backend (port 8000) ────────────────────────────────────────────
echo [2/5] Starting Django backend on port 8000...
start "ACTS-Backend" /min cmd /c "cd /d %ROOT%\backend && python manage.py runserver 0.0.0.0:8000"

REM ── 3. 3D Digital Twin Vite (port 5173) ─────────────────────────────────────
echo [3/5] Starting 3D Campus Digital Twin on port 5173...
start "ACTS-3DTwin" /min cmd /c "cd /d %ROOT%\3d && npm run dev"

REM ── 4. Web Admin Portal Vite (port 5174) ─────────────────────────────────────
echo [4/5] Starting Web Admin Portal on port 5174...
start "ACTS-WebAdmin" /min cmd /c "cd /d %ROOT%\web && npx vite --port 5174"

REM ── 5. Wait for backend to be ready, then launch Flutter app ─────────────────
echo [5/5] Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo  ==========================================
echo   Services running:
echo    Backend  : http://localhost:8000
echo    3D Twin  : http://localhost:5173
echo    Admin Web: http://localhost:5174
echo   Launching Flutter Desktop App...
echo  ==========================================
echo.

start "" "%ROOT%\mobile\build\windows\x64\runner\Release\acts_mobile.exe"

REM ── Keep console open briefly so user sees status ─────────────────────────────
timeout /t 3 /nobreak >nul
exit
