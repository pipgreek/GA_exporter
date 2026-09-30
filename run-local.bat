@echo off
setlocal
set "ROOT=%~dp0"

echo ============================================================
echo  GA Exporter - local dev startup
echo ============================================================
echo.

if not exist "%ROOT%backend\.env" (
  echo [WARN] backend\.env is missing.
  echo        Copy backend\.env.example to backend\.env and fill in:
  echo          ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  echo          SUPABASE_BUCKET, REDIS_URL
  echo.
  pause
  exit /b 1
)

if not exist "%ROOT%frontend\.env.local" (
  echo Creating frontend\.env.local ^(points at http://localhost:3001^)...
  > "%ROOT%frontend\.env.local" echo NEXT_PUBLIC_API_URL=http://localhost:3001
)

echo --- Backend: installing dependencies if needed ---
cd /d "%ROOT%backend"
if not exist node_modules (
  call npx --yes pnpm@11.25.0 install
  if errorlevel 1 goto :error
)

echo --- Backend: building ---
rem A stale tsconfig.build.tsbuildinfo (outside dist\, so a plain "rm dist"
rem does not remove it) makes tsc's incremental compiler think the build is
rem already up to date and silently emit nothing - always clear both first.
if exist dist rmdir /s /q dist
if exist tsconfig.build.tsbuildinfo del /q tsconfig.build.tsbuildinfo
call npx --yes pnpm@11.25.0 run build
if errorlevel 1 goto :error
if not exist dist\main.js (
  echo [ERROR] Build finished but backend\dist\main.js is missing.
  goto :error
)

echo --- Frontend: installing dependencies if needed ---
cd /d "%ROOT%frontend"
if not exist node_modules (
  call npm install
  if errorlevel 1 goto :error
)

echo.
echo Starting backend (port 3001) and frontend (port 3000) in separate windows.
echo Close those windows (or Ctrl+C in each) to stop them.
echo.

start "GA Exporter - Backend"  /d "%ROOT%backend"  cmd /k "node dist\main.js"
start "GA Exporter - Frontend" /d "%ROOT%frontend" cmd /k "npm run dev"

echo Backend health:  http://localhost:3001/health
echo Frontend:        http://localhost:3000
echo.
pause
exit /b 0

:error
echo.
echo [ERROR] Setup failed - see the output above.
pause
exit /b 1
