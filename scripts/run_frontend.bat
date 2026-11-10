@echo off
if not defined VF_PORT set "VF_PORT=8000"
title VisionForge - Frontend Server (Port 5173)

cd /d "%~dp0..\frontend"

echo ==========================================================
echo   VisionForge - Frontend Server
echo   Running on: http://localhost:5173
echo   Backend API proxied to: http://127.0.0.1:%VF_PORT%
echo ==========================================================
echo.

:: The frontend only works when the backend is running. start.bat launches both at the
:: same time, so wait up to ~15 s for it (each refused probe takes ~2 s on Windows); if it never answers, say how to start it
:: instead of leaving the user with a wall of "http proxy error ... ECONNREFUSED".
set /a _vf_tries=0
:wait_backend
curl -sf -o nul -m 2 "http://127.0.0.1:%VF_PORT%/api/system/health" && goto backend_ok
set /a _vf_tries+=1
if %_vf_tries% GEQ 4 goto backend_missing
ping 127.0.0.1 -n 3 >nul
goto wait_backend

:backend_missing
echo [!] Backend is NOT running on http://127.0.0.1:%VF_PORT%
echo     The UI will show "offline" and Vite will print "http proxy error ... ECONNREFUSED".
echo     Start it with start.bat (backend + frontend), or run scripts\run_backend.bat
echo     in another window. The page reconnects automatically once it is up.
echo.
goto start_vite

:backend_ok
echo [OK] Backend is reachable on port %VF_PORT%.
echo.

:start_vite
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server stopped unexpectedly!
    pause
)
