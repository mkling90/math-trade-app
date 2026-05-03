# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (next/core-web-vitals + typescript)
```

No test suite exists.

## Stack

- **Next.js 16 (App Router)** + React 19 + TypeScript 5
- **Supabase** — auth (Google OAuth + email/password) and PostgreSQL database
- **Tailwind CSS 4**
- **Lucide React** for icons

## Architecture

### Data Flow

```
app/page.tsx
  → Auth.tsx (Supabase session gate)
    → MathTradeApp-New.tsx
      → TradeAppContext (global state, mock/DB switch)
        → Tab components
```

`TradeAppContext` (`components/trade/TradeAppContext.tsx`) is the central hub. It provides hooks (`useProfile`, `useGroups`, `useGames`, `useWants`, `useGroupMembers`, `useGroupTrades`) backed by Supabase queries in `lib/supabaseData.ts`.

### Mock vs. Real Data Mode

Controlled by the `NEXT_PUBLIC_USE_MOCK_GAMES` env var. When true, the context uses hardcoded data from `lib/mockData.ts` instead of Supabase. A yellow banner renders at the top of the app in mock mode. The toggle is in `TradeAppContext` and affects every data hook.

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_USE_MOCK_GAMES=false
```

### Core Domain

This app implements a **Top Trading Cycles (TTC)** algorithm for board game swaps within groups:

- Users join **groups** (public or invite-code-based)
- Each user lists **games** they own and want to trade away
- Users set **wants** — ranked preferences for which games they'd accept
- The **TTC algorithm** (`lib/algorithm.ts`) finds optimal multi-way trade cycles
- Results are stored as JSONB in the `trades` table

### Key Files

| File | Purpose |
|------|---------|
| `lib/algorithm.ts` | TTC trade cycle computation |
| `lib/supabaseData.ts` | All React hooks for DB reads/writes |
| `lib/types.ts` | Shared TypeScript interfaces |
| `components/MathTradeApp-New.tsx` | Main app shell, tab navigation |
| `components/trade/TradeAppContext.tsx` | Global state provider |
| `app/auth/callback/route.ts` | OAuth redirect handler |

### Database Schema (6 tables)

`profiles` → `group_members` → `groups`  
`games` (per group, per user) → `wants` (game-to-game ranked preferences) → `trades` (JSONB results)

### Tab Visibility

Tabs (My Games, Browse, All Games, Members, Admin, Trades) are hidden until the user belongs to at least one group. The `GroupSelector` component handles group creation/joining and shows an empty-state alert when the user has no groups.
