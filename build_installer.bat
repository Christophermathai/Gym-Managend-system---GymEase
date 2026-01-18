@echo off
cd /d "%~dp0"
echo ==========================================
echo      Gym Ease - Installer Builder
echo ==========================================
echo.
echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Building application and installer...
echo This may take a few minutes. Please wait...
call npm run electron-build
if %errorlevel% neq 0 (
    echo Error building application!
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      SUCCESS! Installer created.
echo ==========================================
echo.
echo You can find the installer in the 'dist' folder.
echo.
pause
