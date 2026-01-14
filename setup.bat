@echo off
REM Gym Ease - Next.js Setup Script

echo.
echo 🏋️ Gym Ease - Next.js Setup
echo ==============================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install it from https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 📁 Setting up database...
REM Database will be created automatically on first run

if not exist .env.local (
    echo ⚠️  .env.local not found. Creating...
    copy nul .env.local >nul 2>&1
    echo JWT_SECRET=gym-ease-secret-key-change-in-production >> .env.local
    echo NODE_ENV=development >> .env.local
)

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start development server, run:
echo    npm run dev
echo.
echo 📖 For more information, see MIGRATION_GUIDE.md
