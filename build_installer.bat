@echo off
chcp 65001 >nul
cd /d "%~dp0"
setlocal EnableDelayedExpansion

echo ==========================================
echo      Gym Ease - Installer Builder
echo ==========================================
echo.

:: ==========================================
:: PROGRESS BAR SUBROUTINE
:: Usage: call :progress <step> <total> <label>
:: ==========================================
goto :main

:progress
set /a "pct=(%~1 * 100) / %~2"
set /a "filled=(%~1 * 20) / %~2"
set /a "empty=20 - filled"
set bar=
for /l %%i in (1,1,%filled%) do set bar=!bar!█
for /l %%i in (1,1,%empty%) do set bar=!bar!░
echo  [!bar!] %pct%%% - %~3
goto :eof

:: ==========================================
:: ETA TRACKING
:: ==========================================
:get_seconds
for /f "tokens=1-3 delims=:." %%a in ("%TIME: =0%") do (
    set /a "SECONDS_NOW=(1%%a-100)*3600+(1%%b-100)*60+(1%%c-100)"
)
goto :eof

:show_eta
set /a "elapsed=SECONDS_NOW - START_TIME"
if %elapsed% LEQ 0 set elapsed=1
set /a "steps_done=%~1"
set /a "steps_total=%~2"
if %steps_done% EQU 0 set steps_done=1
set /a "rate=elapsed / steps_done"
set /a "remaining_steps=steps_total - steps_done"
set /a "eta_seconds=rate * remaining_steps"
set /a "eta_min=eta_seconds / 60"
set /a "eta_sec=eta_seconds %% 60"
if %eta_min% GTR 0 (
    echo  Elapsed: %elapsed%s ^| ETA: ~%eta_min%m %eta_sec%s remaining
) else (
    echo  Elapsed: %elapsed%s ^| ETA: ~%eta_sec%s remaining
)
goto :eof

:main

:: Record start time
call :get_seconds
set START_TIME=%SECONDS_NOW%
set TOTAL_STEPS=4
set STEP=0

:: ==========================================
:: CHECK NODE VERSION
:: ==========================================
echo [CHECK] Verifying Node.js version...
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=1 delims=." %%i in ('node -v 2^>nul') do set NODE_MAJOR=%%i
set NODE_MAJOR=%NODE_MAJOR:v=%

if %NODE_MAJOR% GTR 22 (
    echo.
    echo ==========================================
    echo  WARNING: Node.js v%NODE_MAJOR% detected!
    echo  better-sqlite3 requires Node.js v20 or v22 LTS.
    echo  Please switch using: nvm use 20
    echo ==========================================
    echo.
    pause
    exit /b 1
)
echo  Node.js version OK: 
node -v
echo.

:: ==========================================
:: CHECK WINDOWS SDK
:: ==========================================
echo [CHECK] Checking for Windows SDK...
reg query "HKLM\SOFTWARE\Microsoft\Windows Kits\Installed Roots" /v KitsRoot10 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ==========================================
    echo  WARNING: Windows 10/11 SDK not found!
    echo  This is required to build native modules.
    echo.
    echo  Fix: Open Visual Studio Installer
    echo       Modify Build Tools 2022
    echo       Install "Windows 10 SDK" component
    echo ==========================================
    echo.
    pause
    exit /b 1
)
echo  Windows SDK found OK.
echo.

:: ==========================================
:: REMOVE sqlite3 IF PRESENT (conflicts with better-sqlite3)
:: ==========================================
echo [CHECK] Checking for conflicting sqlite3 package...
if exist "node_modules\sqlite3" (
    echo  Found sqlite3 - removing to prevent build conflicts...
    call npm uninstall sqlite3 --save
    echo  sqlite3 removed.
) else (
    echo  No conflicts found.
)
echo.

:: ==========================================
:: CLEAN OLD BUILD
:: ==========================================
echo [1/4] Cleaning old build artifacts...
call :progress 0 %TOTAL_STEPS% "Starting..."
call :get_seconds
call :show_eta 0 %TOTAL_STEPS%
echo.

if exist ".next" (
    rmdir /s /q ".next"
    echo  Cleaned .next folder.
)
if exist "dist" (
    rmdir /s /q "dist"
    echo  Cleaned dist folder.
)

set STEP=1
call :get_seconds
call :progress %STEP% %TOTAL_STEPS% "Clean complete"
call :show_eta %STEP% %TOTAL_STEPS%
echo.

:: ==========================================
:: INSTALL DEPENDENCIES
:: ==========================================
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  Error installing dependencies!
    pause
    exit /b %errorlevel%
)

set STEP=2
call :get_seconds
call :progress %STEP% %TOTAL_STEPS% "Dependencies installed"
call :show_eta %STEP% %TOTAL_STEPS%
echo.

:: ==========================================
:: BUILD NEXT.JS
:: ==========================================
echo [3/4] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  Error building Next.js app!
    pause
    exit /b %errorlevel%
)

set STEP=3
call :get_seconds
call :progress %STEP% %TOTAL_STEPS% "Next.js build complete"
call :show_eta %STEP% %TOTAL_STEPS%
echo.

:: ==========================================
:: BUILD ELECTRON INSTALLER
:: ==========================================
echo [4/4] Building Electron installer...
echo  This may take a few minutes. Please wait...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo.
    echo  Error building installer!
    echo  Run with: set DEBUG=electron-builder
    echo  Then:     npm run electron-build
    echo  for more details.
    pause
    exit /b %errorlevel%
)

set STEP=4
call :get_seconds
call :progress %STEP% %TOTAL_STEPS% "Electron installer built"
set /a "total_elapsed=SECONDS_NOW - START_TIME"
set /a "total_min=total_elapsed / 60"
set /a "total_sec=total_elapsed %% 60"
echo  Total build time: %total_min%m %total_sec%s
echo.

echo ==========================================
echo        SUCCESS! Installer created.
echo ==========================================
echo.
echo  Installer is in the 'dist' folder.
echo  File: dist\Gym Ease Setup 2.0.0.exe
echo.
pause