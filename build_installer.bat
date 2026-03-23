@echo off
cd /d "%~dp0"

echo ==========================================
echo      Gym Ease - Installer Builder
echo ==========================================
echo.

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
if exist ".next" (
    rmdir /s /q ".next"
    echo  Cleaned .next folder.
)
if exist "dist" (
    rmdir /s /q "dist"
    echo  Cleaned dist folder.
)
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

echo.
echo ==========================================
echo        SUCCESS! Installer created.
echo ==========================================
echo.
echo  Installer is in the 'dist' folder.
echo  File: dist\Gym Ease Setup 2.0.0.exe
echo.
pause