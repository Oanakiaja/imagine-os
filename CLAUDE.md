# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Imagine clone - a system where Claude generates dynamic UIs in draggable windows based on natural language prompts. The agent (codename: Heli) creates, updates, and manages windows with HTML content streamed via SSE.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build shared packages (required before first dev run)
pnpm --filter @imagine/shared build
pnpm --filter @imagine/ui build

# Start all services (frontend + backend)
pnpm dev

# Start individually
pnpm dev:frontend  # Frontend at http://localhost:5173
pnpm dev:backend   # Backend at http://localhost:3001

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean

# Add new shadcn/ui components to @imagine/ui
pnpm ui:add
```

## Testing Individual Packages

```bash
# Frontend tests
pnpm --filter @imagine/frontend test

# Backend tests
pnpm --filter @imagine/backend test

# Run tests for specific package
pnpm --filter @imagine/<package-name> test
```

## Architecture

### Core Flow
1. User enters prompt in CommandInput
2. Frontend sends SSE request to `/api/imagine`
3. Backend streams Agent SDK responses
4. Frontend parses agent actions and manipulates window state
5. Windows render with draggable/resizable functionality

### Agent Action Protocol (packages/backend/src/lib/agent.ts:4-48)

The agent follows a specific sequence defined in IMAGINE_SYSTEM_PROMPT:

```
1. WINDOW NEW → id: <unique-id>, title: "<title>", size: <sm|md|lg|xl>
2. INIT <TOOL_NAME> (optional for tools like STORAGE)
3. Prepare data silently
4. DOM REPLACE HTML → selector: #<window-id> .window-content
5. HTML CONTENT: <complete HTML>
```

Critical rules:
- Windows are created immediately empty (status: 'creating')
- Content updates only happen with complete HTML
- No streaming partial HTML
- All interactive elements use `data-action` attributes
- Tailwind CSS for styling

### State Management (packages/frontend/src/store/window.ts)

Zustand store manages all window state:
- `windows`: Map<string, ImagineWindow> - all active windows
- `maxZIndex`: tracks focus ordering
- Actions: createWindow, updateWindow, closeWindow, focusWindow, moveWindow, resizeWindow, toggleMinimize, toggleMaximize

Window lifecycle: `creating` → `loading` → `ready` | `error`

### Shared Types (packages/shared/src/types.ts)

All types are defined in `@imagine/shared` and used across packages:
- `ImagineWindow`: window state structure
- `AgentAction`: union of all possible agent actions
- `AgentMessage`: SSE message format
- `WindowSize`: 'sm' | 'md' | 'lg' | 'xl'
- `WINDOW_SIZES`: maps sizes to pixel dimensions

## Package Dependencies

Build order (enforced by turbo.json):
1. `@imagine/shared` (rslib) - no dependencies
2. `@imagine/ui` (rslib) - depends on @imagine/shared
3. `@imagine/frontend` (Vite) - depends on both above
4. `@imagine/backend` (Bun) - depends on @imagine/shared

When adding new types: add to `@imagine/shared/src/types.ts` and export from `index.ts`

## Backend Configuration

Requires `ANTHROPIC_API_KEY` in `packages/backend/.env`:

```bash
cd packages/backend
cp .env.example .env
# Add: ANTHROPIC_API_KEY=your-api-key-here
```

The backend runs on Bun and uses:
- Hono.js for routing
- Claude Agent SDK with model `claude-sonnet-4-20250514`
- Server-Sent Events (SSE) for streaming
- Allowed tools: Write, Read, Edit, Bash

## Frontend Details

- Vite dev server with hot reload
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- SSE client in `packages/frontend/src/lib/api.ts`
- Window components support drag/drop, minimize/maximize/close
- Desktop has gradient background

## Adding New Features

1. **New Agent Actions**: Update `AgentAction` type in `packages/shared/src/types.ts`
2. **Window Behavior**: Modify Zustand store in `packages/frontend/src/store/window.ts`
3. **Agent System Prompt**: Edit `IMAGINE_SYSTEM_PROMPT` in `packages/backend/src/lib/agent.ts`
4. **UI Components**: Add to `packages/ui/src/components/` and export from `index.ts`

## Monorepo Structure

- Uses pnpm workspaces with Turborepo
- Pipeline in `turbo.json` handles build dependencies
- Shared packages built with rslib
- Use `workspace:*` for internal package dependencies
