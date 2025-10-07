# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Imagine clone - a system where Claude generates dynamic UIs in draggable windows based on natural language prompts. The agent (codename: Oana) creates, updates, and manages windows with HTML content streamed via SSE.

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
pnpm test           # Run all tests
pnpm test:ui        # Run tests with UI
pnpm test:run       # Run tests once (CI mode)

# Linting and formatting
pnpm lint           # Check for lint errors
pnpm lint:fix       # Auto-fix lint errors
pnpm format         # Format all files
pnpm format:check   # Check formatting

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
3. Backend streams Claude Code CLI responses
4. Frontend parses agent actions and manipulates window state
5. Windows render with draggable/resizable functionality

### Agent Action Protocol

The agent (packages/backend/src/lib/agent/prompt.ts) follows a specific sequence defined in IMAGINE_SYSTEM_PROMPT:

```
1. WINDOW NEW → id: <unique-id>, title: "<title>", size: <sm|md|lg|xl>
2. DOM REPLACE HTML → selector: #<window-id>
   HTML CONTENT: <complete HTML>
3. WINDOW SCRIPT → id: <window-id> (optional)
   SCRIPT CONTENT: <JavaScript code>
```

**Action parsing** (packages/shared/src/utils.ts:parseAgentOutput):

- Text output from agent is parsed into structured AgentAction objects
- Supports WINDOW_NEW, WINDOW_UPDATE, WINDOW_SCRIPT, WINDOW_CLOSE actions
- Uses regex patterns to extract window IDs, titles, sizes, HTML content, and scripts

Critical rules:

- Windows are created immediately empty (status: 'creating')
- Content updates only happen with complete HTML
- No streaming partial HTML
- Tailwind CSS for styling
- JavaScript executes in a sandboxed environment with access to `root` element
- Window content container has `w-full h-full` classes - agent-generated HTML should set its own layout (flex/grid)

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
- Claude Claude Code CLI (packages/backend/src/lib/agent/claude-code-agent.ts)
- Model: `claude-sonnet-4-20250514`
- Server-Sent Events (SSE) for streaming
- Allowed tools: Write, Read, Edit, Bash

**SSE Message Flow:**

1. Frontend calls `/api/imagine` with POST request containing prompt
2. Backend invokes Claude Claude Code CLI with system prompt
3. Agent responses are streamed as SSE messages (type: text, complete, error)
4. Frontend (packages/frontend/src/lib/api.ts) parses SSE and yields AgentMessage objects
5. Messages are parsed for agent actions and window state is updated

## Frontend Details

- Vite dev server with hot reload
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- SSE client in `packages/frontend/src/lib/api.ts`
- Window components (packages/frontend/src/components/Window.tsx) support:
  - Drag from title bar
  - Resize from edges and corners (8px detection zone)
  - Double-click title bar to maximize/restore
  - Minimize/maximize/close buttons
  - DOMPurify for HTML sanitization
  - Script execution in sandboxed environment
- Desktop has gradient background
- Window content container is `w-full h-full` by default - agent HTML should define its own layout

## Adding New Features

1. **New Agent Actions**:
   - Update `AgentAction` type in `packages/shared/src/types.ts`
   - Update `parseAgentOutput` regex patterns in `packages/shared/src/utils.ts`
   - Update agent prompt examples in `packages/backend/src/lib/agent/prompt.ts`

2. **Window Behavior**:
   - Modify Zustand store in `packages/frontend/src/store/window.ts`
   - Update window component in `packages/frontend/src/components/Window.tsx`

3. **Agent System Prompt**:
   - Edit `IMAGINE_SYSTEM_PROMPT` in `packages/backend/src/lib/agent/prompt.ts`
   - Update examples to demonstrate correct usage patterns

4. **UI Components**:
   - Add to `packages/ui/src/components/` and export from `index.ts`
   - Run `pnpm ui:add` to add new shadcn/ui components

## Common Patterns

### Agent HTML Generation

- Always wrap content in a root div with layout classes (`flex flex-col h-full`, `grid`, etc.)
- Use Tailwind utilities directly on elements
- For grid layouts with gap, ensure parent has `display: grid` or `display: flex`
- Example: `<div class="flex flex-col h-full gap-4 p-4">...</div>`

### Window Content Layout

- Container is `w-full h-full` by default (block display)
- Agent should define its own layout at the root level
- Common patterns: `flex flex-col h-full`, `grid grid-cols-4 gap-2`, etc.

## Monorepo Structure

- Uses pnpm workspaces with Turborepo
- Pipeline in `turbo.json` handles build dependencies
- Shared packages built with rslib
- Use `workspace:*` for internal package dependencies
- Pre-commit hooks run lint-staged for code quality
