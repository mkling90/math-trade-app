# Math Trade App - Organized Structure

## 📁 File Structure

```
components/
  └── MathTradeApp.tsx          # Main UI component (React)

lib/
  ├── types.ts                   # TypeScript interfaces and types
  ├── mockData.ts                # Sample data (will be replaced by Supabase)
  ├── algorithm.ts               # Trade calculation logic
  └── utils.ts                   # Helper functions
```

## 📄 File Descriptions

### `lib/types.ts`
Defines all TypeScript interfaces:
- `User` - User data model
- `Group` - Trade group model
- `Game` - Board game listing model
- `Want` - Trade preference model
- `Trade` - Calculated trade result model

### `lib/mockData.ts`
Contains sample data for development:
- `INITIAL_USERS` - Demo users
- `INITIAL_GROUPS` - Demo trade groups
- `INITIAL_GAMES` - Demo game listings
- `INITIAL_WANTS` - Demo trade preferences

**Note**: This file will be replaced by Supabase database calls in production.

### `lib/algorithm.ts`
Trade matching algorithm:
- `calculateOptimalTrades()` - Finds optimal trade cycles using graph theory
- Uses DFS (Depth-First Search) to detect cycles
- Finds both direct swaps (2-way) and circular chains (3+ way trades)

### `lib/utils.ts`
Helper/utility functions:
- `generateInviteCode()` - Creates random group invite codes
- `exportTradesToFile()` - Exports trade results to .txt file

### `components/MathTradeApp.tsx`
Main React component:
- All UI code and user interactions
- State management with React hooks
- Imports types, data, and functions from `lib/`


## 🚀 Next Steps

When moving to production with Supabase:

1. Replace `mockData.ts` imports with Supabase queries
2. Add authentication hooks
3. Move `algorithm.ts` calculations to Supabase Edge Functions (optional for security)
4. Keep `types.ts` and `utils.ts` as-is

## 💡 Benefits

✅ **Maintainability** - Each file has a clear purpose
✅ **Testability** - Algorithm can be tested independently  
✅ **Reusability** - Utils and types can be imported anywhere
✅ **Readability** - Much easier to navigate and understand
✅ **Scalability** - Easy to add new features without bloat
