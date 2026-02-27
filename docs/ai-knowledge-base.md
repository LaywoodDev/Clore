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
- Main sections: `Home`, `AI`, `Profile`, `Settings`.
- Desktop navigation: left sidebar.
- Mobile navigation: bottom tabs with the same sections.

### UI Map

- `Home`:
  - Main messenger workspace.
  - Desktop: split layout with chat list on the left and active conversation on the right.
  - Mobile: switches between chat list and active conversation views.
  - Global search placeholder: `Search across messenger`.
  - Search can show chats, users, and public groups.
  - Entry point for `New group`.
  - Search supports filters:
    - `from:@username`
    - `has:attachment|image|video|audio|file`
    - `on:YYYY-MM-DD`
    - `before:YYYY-MM-DD`
    - `after:YYYY-MM-DD`
  - Chat context menu supports:
    - `Pin chat` / `Unpin chat`
    - `Mute chat` / `Unmute chat`
    - `Delete chat` / `Delete group` / `Delete channel`
    - `Leave group` / `Unsubscribe` when the user is not the owner
- `Profile`:
  - Shows banner, avatar, name, username, bio, birthday.
  - Current user actions include `Edit profile`, `Favorites`, `Share contact`.
  - Edit flow supports avatar, banner, name, username, bio, birthday.
- `Settings`:
  - Top sections: `Privacy`, `Security`, `Appearance`.
- `AI`:
  - Dedicated ChatGPT-like conversation screen with toggles and prompt box.
- Group and channel creation:
  - `New group` starts group/channel creation.
  - Group flow: member selection, then details.
  - Channel flow: details + public `Username`.

### UI Playbooks (Step-by-step)

- Delete chat:
  - Desktop: open chat -> top-right Menu (three dots) -> `Delete chat` (or `Delete group`) -> confirm dialog.
  - Desktop (chat list): right-click chat -> `Delete for both` / `Delete group` -> confirm dialog.
  - Mobile: open chat -> Menu (three dots) -> `Delete chat` -> confirm dialog.
  - After delete, user gets an `Undo` toast for a short window.
- Use the active chat header:
  - Open any chat.
  - Use top controls for `Search in chat`, `Call` / `End call`, `Chat profile` (desktop), and `Menu`.
  - `Menu` includes `Personalization`, `Clear history for me`, and delete actions.
- Search inside a chat:
  - Open any chat.
  - Click `Search in chat`.
  - Enter text in the top search field.
  - Optionally click `Date` to open the `Jump to date` calendar.
  - Pick a day to jump to messages from that date.
  - Close search to reset the active in-chat filter.
- Change global wallpaper:
  - Path: `Settings` -> `Appearance` -> `Chat wallpaper`.
  - Options: `None`, `Color Bends`, `Pixel Blast`, `Plasma`, `Dither`, `Gradient Blinds`.
- Change wallpaper for one chat:
  - Path: open target chat -> Menu (three dots) -> `Personalization` -> `Chat wallpaper`.
  - Options include `Inherit global`, `None`, `Color Bends`, `Pixel Blast`, `Plasma`, `Dither`, `Gradient Blinds`.
- Open chat personalization:
  - Open target chat.
  - Open `Menu` (three dots).
  - Choose `Personalization`.
  - Available controls:
    - `Mute this chat`
    - `Chat wallpaper`
    - `Chat font size`
    - `Auto-load media`
- Create a group:
  - Open `Home`.
  - Start `New group`.
  - Select members.
  - Go to the details step.
  - Enter `Group name`.
  - Finish with `Create`.
- Create a channel:
  - Open `Home`.
  - Start `New group` and choose channel creation.
  - Enter `Channel name`.
  - Enter `Username` for the public link.
  - Finish with `Create channel`.
- Use the AI screen:
  - Open the `AI` tab.
  - Optional toggles:
    - `Search` for web-enabled answers
    - `Agent` for messenger actions
  - `Agent` first shows a confirmation warning dialog.
  - Use `Clear chat` to wipe the AI conversation history.
  - Input behavior: `Enter` sends, `Shift+Enter` adds a new line.
- Manage groups and channels:
  - Open a group or channel profile.
  - Use `Open settings`.
  - Main management screens:
    - `Group settings` / `Channel settings`
    - `Type`
    - `Permissions`
    - `Invitations` (groups)
  - `Type` can switch between private/public access, manage public `@username` or invite link, and toggle `Restrict copying`.
  - `Permissions` can show `Make admin`, `Remove admin`, `Transfer ownership`, `Remove member`.
  - Private-group invitations support usage limits such as `Unlimited`, `One-time`, `5 uses`, or a custom number.
- Use calls and voice messages:
  - Open a direct chat.
  - Use `Call` in the chat header for audio calls.
  - During a call, UI may show `Accept`, `Decline`, `End call`, `Mute mic`, `Mute sound`, `Share screen`, `Stop sharing`, `Open fullscreen`, `Exit fullscreen`.
  - In the composer, voice tools include `Start recording`, `Stop recording`, `Cancel recording`.
- Use favorites and forwarding:
  - Message actions can `Save to favorites`.
  - Forwarding opens `Forward message`.
  - User selects chats in `Select chats to forward`.
  - Saved items can later be opened via `Open original chat` or removed from favorites.

### Settings Breakdown

- `Privacy`:
  - Controls visibility for last seen, avatar, bio, birthday.
  - Controls who can add the user to groups, call the user, and forward messages.
  - Visibility modes: `Everyone`, `Selected people`, `Nobody`.
- `Security`:
  - `Push notifications`
  - Account info block
  - App version
  - `Log out`
- `Appearance`:
  - `Language`
  - `Theme`
  - `UI density`
  - `Corner radius`
  - `Font size`
  - `Font family`
  - `Chat wallpaper`
  - `Message sound`
  - `Send sound`
  - Desktop-only `Sidebar` visibility toggle

### Onboarding

- First-run dialog title: `Personalize your messenger`.
- It lets users choose:
  - `Language`
  - `Theme`
  - `UI density`
  - `Message sound`
- Apply action: `Apply`.

### Retrieval Notes

- Runtime KB source of truth remains `lib/server/ai-knowledge-base.ts`.
- Interface questions now prioritize UI-focused KB entries before backend or API entries.
- Runtime KB includes Russian UI keywords for better matching on Russian prompts.

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
