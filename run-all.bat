@echo off
title ClassConnect System Launcher
cd /d "%~dp0"
echo ===================================================================
echo               CLASSCONNECT DUAL SYSTEM LAUNCHER
echo ===================================================================
echo 1. Starting Python Flask Backend (MongoDB on port 5000)...
start "ClassConnect Flask Backend" cmd /k "cd /d "%~dp0" && python server/app.py"
timeout /t 2 /nobreak >nul
echo 2. Starting React Vite Frontend (port 5173)...
start "ClassConnect React Frontend" cmd /k "cd /d "%~dp0" && npm run dev -- --host"
echo ===================================================================
echo [SUCCESS] Both servers are running!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo MongoDB Compass URI: mongodb://localhost:27017/classconnect
echo ===================================================================
pause
