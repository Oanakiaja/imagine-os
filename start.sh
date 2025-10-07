#!/bin/bash

# Imagine OS - Quick Start Script

set -e

echo "🚀 Starting Imagine OS..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed"
    echo "📦 Install it with: npm install -g pnpm"
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed"
    echo "📦 Install it with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Check if shared package is built
if [ ! -d "packages/shared/dist" ]; then
    echo "🔨 Building shared package..."
    pnpm --filter @imagine/shared build
fi

# Check if UI package is built
if [ ! -d "packages/ui/dist" ]; then
    echo "🔨 Building UI package..."
    pnpm --filter @imagine/ui build
fi

# Check if .env file exists
if [ ! -f "packages/backend/.env" ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env from example..."
    cp packages/backend/.env.example packages/backend/.env
    read -p "Press Enter to continue after adding your API key..."
fi



echo ""
echo "✅ All checks passed!"
echo ""
echo "🌐 Starting development servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start development servers
pnpm dev
