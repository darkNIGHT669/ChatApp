# Tars Chat — Real-time Messaging App

A production-quality real-time chat application built with Next.js, TypeScript, Convex, and Clerk.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / DB | Convex (serverless, real-time) |
| Auth | Clerk |
| Deployment | Vercel |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tars-chat
cd tars-chat
npm install
```

### 2. Set up Clerk

1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application
3. In **JWT Templates**, create a new template named `convex`
4. Copy your API keys to `.env.local`

### 3. Set up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project (or link an existing one)
- Generate the `convex/_generated/` folder
- Start watching for schema/function changes

In the Convex dashboard, go to **Settings → Environment Variables** and add:
```
CLERK_JWT_ISSUER_DOMAIN = https://your-app.clerk.accounts.dev
```

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your Convex URL, Clerk keys, and Clerk JWT issuer domain
```

### 5. Run the app

```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Next.js dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Architecture Overview

### Schema Design

```
users           ← Synced from Clerk on login
conversations   ← A chat channel (DM or group)
members         ← Join table: user ↔ conversation + lastReadTime
messages        ← Content, soft-deletable
presence        ← Online/offline per user
typing          ← Ephemeral typing indicators
```

**Key design decisions:**

- **Join table for conversations**: Allows group chat extension without schema changes
- **Denormalized lastMessage on conversation**: Avoids N+1 queries for sidebar preview
- **Soft delete for messages**: Preserves conversation history context
- **Both isOnline + lastSeen for presence**: Handles browser crashes gracefully
- **Typed indexes on every foreign key**: All queries use indexes, no full table scans

### Real-time Architecture

Convex's `useQuery` hook creates a reactive subscription. When data changes:
1. Convex server detects the change
2. Pushes the diff to all subscribed clients over WebSocket
3. React re-renders automatically

No manual WebSocket setup, no polling.

### Component Tree

```
app/layout.tsx          (ClerkProvider + ConvexProvider)
  app/chat/layout.tsx   (user sync + presence setup)
    Sidebar
      UserSearch        ← search + start DM
      ConversationList  ← all conversations with unread badges
    app/chat/page.tsx   ← "select a conversation" empty state
    app/chat/[id]/page.tsx
      ChatHeader        ← name + online status + back button
      MessageList       ← smart scroll + date dividers
        MessageItem     ← bubble + delete + timestamp
        TypingIndicator ← "Alex is typing..."
      MessageInput      ← send + typing notifications
```

---

## Features Implemented

- [x] Authentication (Clerk: email + social login)
- [x] User sync to Convex on login
- [x] User list + real-time search
- [x] One-on-one DMs (get-or-create pattern)
- [x] Real-time messages via Convex subscriptions
- [x] Sidebar with conversation previews
- [x] Smart timestamp formatting (time / date+time / date+year)
- [x] Date dividers in message history
- [x] Empty states everywhere
- [x] Responsive layout (mobile sidebar / desktop split)
- [x] Online/offline presence with heartbeat
- [x] Typing indicators with debounce + auto-clear
- [x] Unread message count badges
- [x] Marks-as-read on conversation open
- [x] Smart auto-scroll with "↓ New messages" button
- [x] Soft-delete messages ("This message was deleted")
- [x] Skeleton loaders

---

## Deployment Checklist (Vercel)

### Before deploying:

- [ ] `npx convex deploy` — deploys your Convex functions to production
- [ ] In Convex dashboard, add `CLERK_JWT_ISSUER_DOMAIN` env var for production
- [ ] In Clerk dashboard, add your Vercel domain to **Allowed Origins**

### In Vercel:

1. Import GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.local`:
   - `NEXT_PUBLIC_CONVEX_URL` (use production URL from `npx convex deploy` output)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/chat`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/chat`
3. Deploy

### After deploying:

- [ ] Test sign up with a new account
- [ ] Test DM flow end-to-end
- [ ] Test real-time with two browser tabs
- [ ] Test on mobile viewport
- [ ] Verify online/offline status updates

---

## Loom Video Script (5 minutes)

**0:00–0:30** — Introduction
> "Hi, I'm [Name]. I'm a [year] student at [university] studying [field].
> I built this real-time chat app as part of the Tars internship challenge using
> Next.js, Convex, Clerk, and Tailwind CSS. Let me walk you through it."

**0:30–1:30** — Schema walkthrough
> Open `convex/schema.ts`. Explain:
> - Why a join table for members
> - Why lastMessageId is denormalized on conversations
> - How lastReadTime enables unread counts
> - The two-field presence strategy (isOnline + lastSeen)

**1:30–2:30** — Real-time demo
> Open two browser windows side by side (different accounts).
> Send a message in one — watch it appear instantly in the other.
> Show typing indicator.
> Explain: "Convex's useQuery creates a WebSocket subscription.
> No polling, no manual WebSocket code."

**2:30–3:30** — Feature walkthrough
> Show: search for user → click → conversation opens
> Show: sidebar unread badge → open conversation → badge clears
> Show: online indicator (green dot) — open/close tab

**3:30–4:30** — Code deep-dive on smart auto-scroll
> Open `MessageList.tsx`. Walk through:
> - scrollAreaRef, bottomRef, isAtBottomRef
> - handleScroll: how we calculate distanceFromBottom
> - useEffect: why we check isAtBottomRef.current before scrolling
> - The "New messages" button

**4:30–5:00** — Live change
> In `MessageInput.tsx`, change the button color from `bg-blue-500` to `bg-purple-500`
> Save → show hot reload → button is now purple in the demo
> "This is the developer experience Convex + Next.js gives you."
