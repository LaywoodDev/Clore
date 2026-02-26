# Clore AI Knowledge Base

This document is the human-readable snapshot of app knowledge used by the AI assistant.
Runtime retrieval logic lives in `lib/server/ai-knowledge-base.ts`.

## Scope

- Product behavior in messenger flows
- API route map for auth, messaging, AI, and moderation
- Data model and persistence details
- Permission and moderation rules

## Core Facts

### App and UI

- Stack: Next.js App Router + React + TypeScript.
- Entry page: `app/page.tsx`.
- Auth gate: `components/auth-gate.tsx`.
- Main messenger UI: `components/web-messenger.tsx`.

### UI Playbooks (Step-by-step)

- Delete chat:
  - Desktop: open chat -> top-right Menu (three dots) -> `Delete chat` (or `Delete group`) -> confirm dialog.
  - Desktop (chat list): right-click chat -> `Delete for both` / `Delete group` -> confirm dialog.
  - Mobile: open chat -> Menu (three dots) -> `Delete chat` -> confirm dialog.
  - After delete, user gets an `Undo` toast for a short window.
- Change global wallpaper:
  - Path: `Settings` -> `Appearance` -> `Chat wallpaper`.
  - Options: `None`, `Color Bends`, `Pixel Blast`, `Plasma`, `Dither`.
- Change wallpaper for one chat:
  - Path: open target chat -> Menu (three dots) -> `Personalization` -> `Chat wallpaper`.
  - Options include `Inherit global` and specific wallpaper choices.

### Store and persistence

- Primary store module: `lib/server/store.ts`.
- Store entities:
  - users
  - threads (direct/group)
  - messages
  - callSignals
  - moderationReports
  - moderationAuditLogs
  - userSanctions
- Persistence modes:
  - Postgres when `DATABASE_URL` is provided
  - file store fallback in `data/clore-store.json` (with backup and safe writes)

### Realtime

- SSE endpoint: `/api/messenger/events`.
- Realtime helper: `lib/server/realtime.ts`.
- Client sync hook: `components/messenger/use-realtime-sync.ts`.

### Auth and profile APIs

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/user`
- `/api/auth/profile`
- `/api/auth/privacy`
- `/api/auth/block`
- `/api/auth/import`

### Messaging APIs (key examples)

- `/api/messenger/data`
- `/api/messenger/send`
- `/api/messenger/edit-message`
- `/api/messenger/delete-message`
- `/api/messenger/read`
- `/api/messenger/typing`
- `/api/messenger/create-group`
- `/api/messenger/add-member`
- `/api/messenger/remove-member`
- `/api/messenger/set-member-role`
- `/api/messenger/leave-group`
- `/api/messenger/rename-group`
- `/api/messenger/group-profile`
- `/api/messenger/transfer-owner`
- `/api/messenger/pin`
- `/api/messenger/mute`
- `/api/messenger/favorite`
- `/api/messenger/favorites-chat`
- `/api/messenger/report`
- `/api/messenger/call-signal`

### AI behavior

- AI assistant endpoint: `/api/ai/chat`.
- Supports:
  - regular assistant replies
  - command-style parsing for send/delete actions in chat context
  - optional search-enabled model fallback path
- Agent mode:
  - Client sends `agentEnabled` flag in AI request.
  - If agent mode is off, server does not execute messenger automation commands (`send`, `delete`) and returns only conversational guidance.
- Provider config: `lib/server/ai-provider.ts`.

### Built-in bot

- Bot user:
  - id: `bot-chatgpt`
  - username: `chatgpt`
- Direct-chat auto-reply logic is handled in `/api/messenger/send`.

## Update Rules

- Keep `lib/server/ai-knowledge-base.ts` as runtime source of truth.
- Keep this file in sync when adding major routes, entities, or permission logic.
- Avoid secrets and environment values; document only behavior and public route contracts.
