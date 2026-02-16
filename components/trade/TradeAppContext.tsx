'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Group, Game, Want, Trade } from '@/lib/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { INITIAL_USERS, INITIAL_GROUPS, INITIAL_GAMES, INITIAL_WANTS } from '@/lib/mockData';
import { useProfile, useGroups, useGames, useWants } from '@/lib/supabaseData';

interface TradeAppContextType {
  // User & Auth
  supabaseUser: SupabaseUser | null;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  
  // Groups
  groups: Group[];
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  setGroups: (groups: Group[]) => void;
  
  // Games
  games: Game[];
  setGames: (games: Game[]) => void;
  
  // Wants
  wants: Want[];
  setWants: (wants: Want[]) => void;
  
  // Trades
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  
  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Mode
  useMockGames: boolean;
  
  // Loading states
  loading: boolean;
}

const TradeAppContext = createContext<TradeAppContextType | undefined>(undefined);

export function useTradeApp() {
  const context = useContext(TradeAppContext);
  if (!context) {
    throw new Error('useTradeApp must be used within TradeAppProvider');
  }
  return context;
}

interface TradeAppProviderProps {
  children: ReactNode;
  supabaseUser?: SupabaseUser;
}

export function TradeAppProvider({ children, supabaseUser }: TradeAppProviderProps) {
  const useMockGames = process.env.NEXT_PUBLIC_USE_MOCK_GAMES === 'true';
  
  // Supabase hooks (only active when not using mock data)
  const { profile: supabaseProfile, loading: profileLoading } = useProfile(
    useMockGames ? null : (supabaseUser || null)
  );
  const { groups: supabaseGroups, loading: groupsLoading } = useGroups(
    useMockGames ? undefined : supabaseUser?.id
  );
  
  // State - initialize based on mode
  const [currentUser, setCurrentUser] = useState<User>(
    useMockGames ? INITIAL_USERS[0] : { id: 0, name: '', globalAdmin: false }
  );
  const [users] = useState<User[]>(useMockGames ? INITIAL_USERS : []);
  const [groups, setGroups] = useState<Group[]>(useMockGames ? INITIAL_GROUPS : []);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(
    useMockGames ? INITIAL_GROUPS[0] : null
  );
  const [games, setGames] = useState<Game[]>(useMockGames ? INITIAL_GAMES : []);
  const [wants, setWants] = useState<Want[]>(useMockGames ? INITIAL_WANTS : []);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState('my-games');
  
  // Supabase data for current group
  const { games: supabaseGames, loading: gamesLoading } = useGames(
    useMockGames ? null : currentGroup?.id
  );
  const { wants: supabaseWants, loading: wantsLoading } = useWants(
    useMockGames ? null : currentGroup?.id
  );
  
  // Sync Supabase data when loaded
  useEffect(() => {
    if (!useMockGames && supabaseGroups.length > 0) {
      setGroups(supabaseGroups);
      if (!currentGroup || !supabaseGroups.find(g => g.id === currentGroup.id)) {
        setCurrentGroup(supabaseGroups[0]);
      }
    }
  }, [useMockGames, supabaseGroups]);
  
  useEffect(() => {
    if (!useMockGames && supabaseGames) {
      setGames(supabaseGames);
    }
  }, [useMockGames, supabaseGames]);
  
  useEffect(() => {
    if (!useMockGames && supabaseWants) {
      setWants(supabaseWants);
    }
  }, [useMockGames, supabaseWants]);
  
  // Update current user from Supabase profile
  useEffect(() => {
    if (!useMockGames && supabaseProfile) {
      setCurrentUser(supabaseProfile);
    }
  }, [useMockGames, supabaseProfile]);
  
  const loading = !useMockGames && (profileLoading || groupsLoading || gamesLoading || wantsLoading);
  
  const value: TradeAppContextType = {
    supabaseUser: supabaseUser || null,
    currentUser,
    users,
    setCurrentUser,
    groups,
    currentGroup,
    setCurrentGroup,
    setGroups,
    games,
    setGames,
    wants,
    setWants,
    trades,
    setTrades,
    activeTab,
    setActiveTab,
    useMockGames,
    loading,
  };
  
  return (
    <TradeAppContext.Provider value={value}>
      {children}
    </TradeAppContext.Provider>
  );
}
