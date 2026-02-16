// Data models for the math trade application

export interface User {
  id: number;
  name: string;
  globalAdmin?: boolean; // Super admin who can manage all groups
}

export interface Group {
  id: number; // For display/UI compatibility
  uuid?: string; // Actual database UUID
  name: string;
  memberIds: number[];
  adminIds: number[];
  inviteCode: string;
  isPublic: boolean;
}

export interface Game {
  id: number;
  userId: number;
  groupId: number;
  name: string;
  condition: string;
  comment: string;
}

export interface Want {
  myGameId: number;
  acceptGameId: number;
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
  involvedUserIds: number[]; // Track which users are involved in this trade
}
