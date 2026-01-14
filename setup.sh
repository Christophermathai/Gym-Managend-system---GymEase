#!/bin/bash

# Gym Ease - Next.js Setup Script

echo "🏋️ Gym Ease - Next.js Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create database directory
echo ""
echo "📁 Setting up database..."
# Database will be created automatically on first run

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating..."
    cp .env.local .env.local 2>/dev/null || true
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development server, run:"
echo "   npm run dev"
echo ""
echo "📖 For more information, see MIGRATION_GUIDE.md"
