# Board Game Math Trade

A web application for organizing and optimizing board game trades using the **Top Trading Cycles (TTC) algorithm**. Users can create groups, list games they want to trade, set preferences, and let the algorithm calculate optimal trade chains that maximize satisfaction for all participants.

![Math Trade](https://img.shields.io/badge/Algorithm-TTC-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green)

## Overview

This application solves the multi-lateral trading problem common in board game communities. Instead of finding individual one-to-one trades, users can participate in complex trade chains where:

- **Alice** gives a game to **Bob**
- **Bob** gives a game to **Carol**  
- **Carol** gives a game to **Alice**

Everyone gets something they want without needing direct reciprocity!

### Key Features

- 🔐 **Authentication**: Google OAuth and email/password via Supabase
- 👥 **Groups**: Create public/private trading groups with invite codes
- 🎲 **Game Management**: Add games with conditions and notes
- ⭐ **Preference System**: Rank games you'd accept in trade (1 = most preferred)
- 🔄 **TTC Algorithm**: Automatically calculates optimal trades
- 📊 **Trade Visualization**: See trade chains with all participants
- 💾 **Dual Mode**: Works with mock data (demo) or real database
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase**
  - PostgreSQL database
  - Row Level Security (RLS) policies
  - Authentication (Google OAuth + Email)
  - Real-time subscriptions ready

### Algorithm
- **Top Trading Cycles (TTC)** - Item-based implementation
- Deterministic, strategy-proof mechanism design
- Handles complex multi-way trades

---

## Developer Setup

### Prerequisites

- **Node.js 18+** and npm
- **Supabase account** (free tier works)
- **Google Cloud Console** account (for OAuth)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/board-game-math-trade.git
cd board-game-math-trade
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

#### Run Database Schema

Execute these SQL scripts in **Supabase SQL Editor** (in order):

1. **schema.sql** - Creates tables (profiles, groups, group_members, games, wants, trades)
2. **rls-policies.sql** - Sets up Row Level Security
3. **create-reset-functions.sql** - Adds utility functions
4. **fix-groups-invite-code.sql** - Configures group access
5. **fix-games-rls.sql** - Finalizes game permissions

#### Configure Authentication

In Supabase:
1. **Authentication** → **Providers** → Enable **Google** and **Email**
2. **Authentication** → **URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**` and `http://localhost:3000/**`

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google+ API**
4. **Credentials** → **Create OAuth 2.0 Client ID**
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-supabase-project.supabase.co`
6. Add **Authorized redirect URIs**:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
7. Copy Client ID and Secret to Supabase → Authentication → Google provider

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_GAMES=false
```

**Important:** 
- Set to `false` for database mode
- Set to `true` for demo mode with mock data
- No trailing periods or spaces!

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

**In Vercel Dashboard:**
1. Add all environment variables from `.env.local`
2. Set for **Production**, **Preview**, and **Development**
3. Redeploy (uncheck "Use existing Build Cache")

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Entry point (renders Auth)
│   └── auth/callback/route.ts  # OAuth callback handler
│
├── components/
│   ├── Auth.tsx                # Sign in/up with email + Google
│   ├── UserSettingsModal.tsx  # Edit display name
│   ├── MathTradeApp-New.tsx   # Main app orchestrator
│   └── trade/
│       ├── TradeAppContext.tsx    # Global state management
│       ├── GroupSelector.tsx      # Group dropdown + create/join
│       ├── CreateGroupModal.tsx   # Create group UI
│       ├── JoinGroupModal.tsx     # Join by invite code
│       ├── MyGamesTab.tsx         # Add/manage your games
│       ├── BrowseGamesTab.tsx     # View others' games
│       ├── AdminTab.tsx           # Group admin controls
│       ├── TradesTab.tsx          # Calculate/view results
│       ├── GameCard.tsx           # Reusable game display
│       ├── SetWantsModal.tsx      # Rank trade preferences
│       └── index.ts               # Component exports
│
├── lib/
│   ├── algorithm.ts            # TTC implementation
│   ├── supabase.ts             # Supabase client
│   ├── supabaseData.ts         # Database hooks & functions
│   ├── types.ts                # TypeScript interfaces
│   ├── mockData.ts             # Demo data
│   └── exportTrades.ts         # Export results to CSV
│
└── public/                     # Static assets
```

### Key Files

| File | Purpose |
|------|---------|
| `algorithm.ts` | TTC algorithm - finds optimal trade cycles |
| `supabaseData.ts` | React hooks for database operations (useGames, useWants, etc.) |
| `TradeAppContext.tsx` | Central state management, switches between mock/DB mode |
| `types.ts` | TypeScript interfaces (User, Group, Game, Want, Trade) |

---

## Component Architecture

### Data Flow

```
Auth.tsx
  ↓ (user authenticated)
MathTradeApp-New.tsx
  ↓ (provides TradeAppContext)
TradeAppContext.tsx
  ├→ useProfile()      → Fetch current user
  ├→ useGroups()       → Fetch user's groups
  ├→ useGames()        → Fetch games in current group
  ├→ useWants()        → Fetch trade preferences
  └→ useGroupMembers() → Fetch member profiles
  ↓
Tab Components (MyGamesTab, BrowseGamesTab, AdminTab, TradesTab)
  ↓
Modals (SetWantsModal, CreateGroupModal, JoinGroupModal)
```

### State Management

**TradeAppContext** provides:
- `currentUser` - Logged-in user's profile
- `users` - All members in current group
- `groups` - Groups user belongs to
- `currentGroup` - Selected group
- `games` - All games in current group
- `wants` - All trade preferences
- `trades` - Calculated trade results
- `refetchGames()` - Reload games from DB
- `refetchWants()` - Reload wants from DB

### Mock vs Database Mode

The app supports two modes controlled by environment variables:

**Mock Mode** (`NEXT_PUBLIC_USE_MOCK_GAMES=true`):
- Uses hardcoded data from `mockData.ts`
- Instant, no database required
- Perfect for demos and testing

**Database Mode** (`NEXT_PUBLIC_USE_MOCK_GAMES=false`):
- Uses Supabase PostgreSQL
- Real-time data with RLS security
- Production-ready

The context automatically switches based on the environment variable.

---

## Top Trading Cycles (TTC) Algorithm

### Overview

The TTC algorithm is a **mechanism design** solution that finds Pareto-efficient allocations in trading economies. It's used in:
- Kidney exchange programs
- School choice systems
- Board game trading communities

### How It Works

#### Step 1: Model Items as Nodes

Each **game** is a node (not users!). Users with multiple games have multiple independent agents.

```
Items:
- item_1 (owned by Alice)
- item_2 (owned by Alice)
- item_3 (owned by Bob)
- item_4 (owned by Carol)
```

#### Step 2: Build Preference Lists

Each item "points" to its most preferred acceptable item:

```
item_1 prefers: item_3 > item_4
item_2 prefers: item_4
item_3 prefers: item_1 > item_2
item_4 prefers: item_2 > item_3
```

#### Step 3: Point to Top Choice

Each item points to its #1 choice:

```
item_1 → item_3
item_2 → item_4
item_3 → item_1
item_4 → item_2
```

#### Step 4: Find Cycles

Look for closed loops:

```
Cycle 1: item_1 → item_3 → item_1
Cycle 2: item_2 → item_4 → item_2
```

#### Step 5: Execute Trades

**Cycle 1:**
- Alice gives item_1, receives item_3 from Bob ✅
- Bob gives item_3, receives item_1 from Alice ✅

**Cycle 2:**
- Alice gives item_2, receives item_4 from Carol ✅
- Carol gives item_4, receives item_2 from Alice ✅

#### Step 6: Remove Matched Items and Repeat

Continue with remaining items until no more cycles exist.

### Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ START: All games in group                           │
│ Input: games[], wants[]                             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Convert to Items                                     │
│ • Each game = one item node                         │
│ • Build preference list from wants (sorted by rank) │
│ • Filter out self-trades (can't trade with yourself)│
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ ROUND N                                              │
│ For each unmatched item:                            │
│   Point to top remaining choice                     │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Find Cycles                                          │
│ • Traverse pointing graph                           │
│ • Detect loops (item_a → ... → item_a)             │
│ • Cycles can be length 2+ (e.g., A→B→C→A)          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
                ┌───┴───┐
                │Cycles?│
                └───┬───┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼ YES                   ▼ NO
┌───────────────────┐   ┌──────────────┐
│ Execute Trades    │   │ STOP         │
│ • Match items     │   │ • No more    │
│ • Remove from     │   │   cycles     │
│   available pool  │   │ • Unmatched  │
│ • Record trade    │   │   items stay │
│   chain           │   │   with owner │
└───────┬───────────┘   └──────────────┘
        │
        └───────┐
                │
                ▼
        ┌───────────────┐
        │ Unmatched     │
        │ items left?   │
        └───┬───────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼ YES            ▼ NO
Go to ROUND N+1  ┌──────────────┐
                 │ COMPLETE     │
                 │ Return all   │
                 │ trade chains │
                 └──────────────┘
```

### Example Execution

**Input:**
```javascript
Games:
- game_1: Catan (Alice)
- game_2: Ticket to Ride (Bob)
- game_3: Pandemic (Carol)

Wants:
- Alice: game_2 (rank 1), game_3 (rank 2)
- Bob: game_3 (rank 1), game_1 (rank 2)
- Carol: game_1 (rank 1)
```

**Round 1:**
```
Pointing:
game_1 → game_2  (Alice wants Bob's game)
game_2 → game_3  (Bob wants Carol's game)
game_3 → game_1  (Carol wants Alice's game)

Cycle Found: game_1 → game_2 → game_3 → game_1

Trade Chain:
1. Alice gives Catan → Carol
2. Bob gives Ticket to Ride → Alice
3. Carol gives Pandemic → Bob
```

**Output:**
```javascript
[
  {
    id: 1,
    type: 'circular',
    chain: [
      { from: 'Bob', fromGame: 'Ticket to Ride', to: 'Alice' },
      { from: 'Carol', fromGame: 'Pandemic', to: 'Bob' },
      { from: 'Alice', fromGame: 'Catan', to: 'Carol' }
    ],
    involvedUserIds: ['Alice', 'Bob', 'Carol']
  }
]
```

### Properties

✅ **Strategy-proof**: Truthful reporting is optimal  
✅ **Pareto-efficient**: No one can be better off without making someone worse  
✅ **Individually rational**: Voluntary participation  
✅ **Deterministic**: Same input always produces same output  

---

## Database Schema

### Tables

**profiles**
- `id` (UUID, PK) - Links to auth.users
- `name` (TEXT)
- `global_admin` (BOOLEAN)

**groups**
- `id` (UUID, PK)
- `name` (TEXT)
- `invite_code` (TEXT, UNIQUE)
- `is_public` (BOOLEAN)
- `created_by` (UUID, FK → profiles)

**group_members**
- `group_id` (UUID, FK → groups)
- `user_id` (UUID, FK → profiles)
- `is_admin` (BOOLEAN)
- Primary key: (group_id, user_id)

**games**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `group_id` (UUID, FK → groups)
- `name` (TEXT)
- `condition` (TEXT)
- `comment` (TEXT)

**wants**
- `my_game_id` (UUID, FK → games)
- `accept_game_id` (UUID, FK → games)
- `rank` (INTEGER) - 1 = most preferred
- Primary key: (my_game_id, accept_game_id)

**trades**
- `id` (UUID, PK)
- `group_id` (UUID, FK → groups)
- `result_data` (JSONB)
- `created_at` (TIMESTAMP)

### Row Level Security (RLS)

All tables use RLS policies to ensure users can only access data they're authorized to see:

- **Profiles**: Public read, own profile update
- **Groups**: See groups you're in, public groups, or if global admin
- **Group Members**: See members of your groups
- **Games**: See games in your groups
- **Wants**: See wants for games in your groups

---

## API Reference

### Supabase Functions

All database operations are in `lib/supabaseData.ts`:

#### User Profile
```typescript
useProfile(userId: string) → { profile, loading }
updateProfileName(userId: string, newName: string) → void
```

#### Groups
```typescript
useGroups(userId: string) → { groups, loading, refetch }
createGroup(userId, name, inviteCode, isPublic) → Group
joinGroup(userId: string, inviteCode: string) → Group
```

#### Games
```typescript
useGames(groupId: string) → { games, loading, refetch }
createGame(userId, groupId, name, condition, comment) → Game
deleteGame(gameId: string) → void
```

#### Wants
```typescript
useWants(groupId: string) → { wants, loading, refetch }
createWant(myGameId, acceptGameId, rank) → Want
updateWantRank(myGameId, acceptGameId, newRank) → void
deleteWant(myGameId, acceptGameId) → void
```

#### Members
```typescript
useGroupMembers(memberIds: string[]) → { members, loading }
```

---

## Troubleshooting

### "Invalid invite code"
- Check RLS policies allow viewing groups by invite code
- Run `fix-groups-invite-code.sql`

### "Row level security policy violated"
- Verify RLS policies are set up correctly
- Check user is authenticated
- Run all SQL scripts in order

### Mock data shows instead of database
- Check `.env.local` has `NEXT_PUBLIC_USE_MOCK_GAMES=false`
- No trailing periods or spaces!
- Restart dev server after changing env vars
- In Vercel: redeploy with fresh build cache

### OAuth redirects to localhost
- Update Supabase Site URL to production domain
- Add production domain to redirect URLs
- Update Google OAuth authorized URIs

### Games not appearing after adding
- Check `refetchGames()` is called after create/delete
- Verify group_id matches (UUID string comparison)
- Check RLS policies on games table

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---


## Acknowledgments

- **Top Trading Cycles Algorithm**: Shapley & Scarf (1974)
- **Supabase**: For amazing backend infrastructure
- **Vercel**: For seamless deployment
- **Board Game Geek**: For inspiring this project

---

## Contact

Questions? Issues? Feature requests?

Open an issue on GitHub

---

**Happy Trading! 🎲🔄**
