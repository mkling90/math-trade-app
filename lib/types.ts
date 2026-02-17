// Data models for the math trade application

export interface User {
  id: string | number; // UUID string (Supabase) or number (mock)
  name: string;
  globalAdmin?: boolean; // Super admin who can manage all groups
}

export interface Group {
  id: string | number; // UUID string (Supabase) or number (mock)
  name: string;
  memberIds: (string | number)[]; // UUID strings or numbers
  adminIds: (string | number)[]; // UUID strings or numbers
  inviteCode: string;
  isPublic: boolean;
}

export interface Game {
  id: string | number; // UUID string (Supabase) or number (mock)
  userId: string | number; // UUID string or number
  groupId: string | number; // UUID string or number
  name: string;
  condition: string;
  comment: string;
}

export interface Want {
  myGameId: string | number; // UUID string or number
  acceptGameId: string | number; // UUID string or number
  rank: number; // 1 = most preferred, 2 = second most preferred, etc.
}

export interface TradeStep {
  from: string;
  fromGame: string;
  to: string;
  toGame: string;
}

export interface Trade {
  id: number;
  chain: TradeStep[];
  type: 'direct' | 'circular';
  involvedUserIds: (string | number)[]; // Track which users are involved in this trade
}
