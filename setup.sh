#!/bin/bash

echo "🚀 Setting up Imagine Clone..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "⚠️  Bun is not installed. Please install it from https://bun.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building shared packages..."
pnpm --filter @imagine/shared build
pnpm --filter @imagine/ui build

echo "⚙️  Setting up backend environment..."
if [ ! -f packages/backend/.env ]; then
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created packages/backend/.env"
    echo "⚠️  Please add your ANTHROPIC_API_KEY to packages/backend/.env"
else
    echo "✅ packages/backend/.env already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start development:"
echo "  pnpm dev              # Start all services"
echo "  pnpm dev:frontend     # Frontend only (http://localhost:5173)"
echo "  pnpm dev:backend      # Backend only (http://localhost:3001)"
echo ""
echo "Don't forget to add your ANTHROPIC_API_KEY to packages/backend/.env!"
