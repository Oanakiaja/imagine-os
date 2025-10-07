# Imagine OS

Imagine with Claude's Open Source Clone.

![Image](./assets/image.png)

## Tech Stack

- **Monorepo**: pnpm workspace + Turborepo
- **Frontend**: Vite + React + Tailwind CSS
- **Backend**: Hono.js
- **AI**: Claude Code CLI
- **UI Components**: shadcn/ui (@imagine/ui)
- **Build Tool**: rslib (for shared packages)
- **Testing**: Vitest
- **State Management**: Zustand

## Project Structure

```
imagine-os/
├── packages/
│   ├── shared/           # Shared types and utilities (rslib)
│   ├── ui/               # UI component library (rslib + shadcn/ui)
│   ├── frontend/         # React frontend (Vite)
│   └── backend/          # API server (Hono.js)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9

### Installation

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm --filter @imagine/shared build
pnpm --filter @imagine/ui build
```

### Configuration

1. Copy backend environment file:

```bash
cd packages/backend
cp .env.example .env
```

2. Add your Anthropic API key to `packages/backend/.env`:

```
ANTHROPIC_API_KEY=your-api-key-here
```

### Development

Start all packages in development mode:

```bash
pnpm dev
```

Or start individually:

```bash
# Frontend only (http://localhost:5173)
pnpm dev:frontend

# Backend only (http://localhost:3001)
pnpm dev:backend
```

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Adding UI Components

To add new shadcn/ui components:

```bash
pnpm ui:add
```

## Package Details

### @imagine/shared

- Shared TypeScript types
- Utility functions
- Agent action parsers
- Built with rslib

### @imagine/ui

- Reusable React components
- Based on shadcn/ui
- Tailwind CSS styling
- Built with rslib

### @imagine/frontend

- Main React application
- Vite for fast development
- Zustand for state management
- SSE client for streaming responses

### @imagine/backend

- Hono.js REST API
- Claude Code CLI integration
- Server-Sent Events (SSE) support

## Features

- Real-time UI generation via Claude Code CLI
- Drag-and-drop window management
- Minimize/maximize/close windows
- Beautiful gradient desktop background
- Smooth animations and transitions
- Type-safe across all packages

## Architecture

```
User Input → Frontend (React)
    ↓
API Call (SSE) → Backend (Hono.js)
    ↓
Claude Code CLI → Claude Sonnet 4.5
    ↓
Streaming Response ← Backend
    ↓
Window Creation & Update ← Frontend
```

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Type Safety**: All packages share types via `@imagine/shared`
3. **UI Components**: Add new components to `@imagine/ui` and use across projects
4. **Debugging**: Check browser console and terminal for logs

## License

MIT
