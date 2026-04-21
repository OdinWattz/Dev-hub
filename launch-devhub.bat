@echo off
title DevHub Launcher
echo Starting DevHub...
cd /d "C:\Users\odinw\Documents\Dev-Hub"

:: Start the Next.js dev server in the background
start /B npm run dev > "%TEMP%\devhub.log" 2>&1

:: Wait a moment for the server to start
timeout /t 4 /nobreak > nul

:: Open the browser
start "" "http://localhost:3000"

echo DevHub is running at http://localhost:3000
echo Close this window to keep DevHub running in the background.
echo.
echo Press any key to stop DevHub...
pause > nul

:: Kill the node process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| find "3000" ^| find "LISTENING"') do (
  taskkill /PID %%a /F > nul 2>&1
)
echo DevHub stopped.
