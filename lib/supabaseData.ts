import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User, Group, Game, Want, Trade } from './types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Hook to fetch user profile from Supabase
 */
export function useProfile(supabaseUser: SupabaseUser | null) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      if (!supabaseUser) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile({
          id: parseInt(data.id), // Convert UUID to number for compatibility
          name: data.name,
          globalAdmin: data.global_admin || false,
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, [supabaseUser]);

  return { profile, loading };
}

/**
 * Hook to fetch all groups user is a member of
 */
export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    async function fetchGroups() {
      try {
        // Fetch groups where user is a member
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);

        if (memberError) {
          console.error('Error fetching group memberships:', memberError);
          setLoading(false);
          return;
        }

        const groupIds = memberData.map(m => m.group_id);

        if (groupIds.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        // Fetch group details
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
          setLoading(false);
          return;
        }

        // Fetch members and admins for each group
        const groupsWithMembers = await Promise.all(
          groupsData.map(async (group) => {
            const { data: members } = await supabase
              .from('group_members')
              .select('user_id, is_admin')
              .eq('group_id', group.id);

            return {
              id: parseInt(group.id),
              name: group.name,
              memberIds: members?.map(m => parseInt(m.user_id)) || [],
              adminIds: members?.filter(m => m.is_admin).map(m => parseInt(m.user_id)) || [],
              inviteCode: group.invite_code,
              isPublic: group.is_public,
            };
          })
        );

        setGroups(groupsWithMembers);
      } catch (error) {
        console.error('Unexpected error in fetchGroups:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [userId]);

  return { groups, loading, refetch: () => {} }; // TODO: implement refetch
}

/**
 * Hook to fetch all games in a group
 */
export function useGames(groupId: number | null) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setGames([]);
      setLoading(false);
      return;
    }

    async function fetchGames() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching games:', error);
      } else if (data) {
        setGames(
          data.map(game => ({
            id: parseInt(game.id),
            userId: parseInt(game.user_id),
            groupId: parseInt(game.group_id),
            name: game.name,
            condition: game.condition,
            comment: game.comment || '',
          }))
        );
      }
      setLoading(false);
    }

    fetchGames();
  }, [groupId]);

  return { games, loading };
}

/**
 * Hook to fetch all wants for games in a group
 */
export function useWants(groupId: number | null) {
  const [wants, setWants] = useState<Want[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setWants([]);
      setLoading(false);
      return;
    }

    async function fetchWants() {
      // First get all game IDs in this group
      const { data: gamesData } = await supabase
        .from('games')
        .select('id')
        .eq('group_id', groupId);

      if (!gamesData || gamesData.length === 0) {
        setWants([]);
        setLoading(false);
        return;
      }

      const gameIds = gamesData.map(g => g.id);

      // Fetch wants for those games
      const { data, error } = await supabase
        .from('wants')
        .select('*')
        .in('my_game_id', gameIds);

      if (error) {
        console.error('Error fetching wants:', error);
      } else if (data) {
        setWants(
          data.map(want => ({
            myGameId: parseInt(want.my_game_id),
            acceptGameId: parseInt(want.accept_game_id),
            rank: want.rank,
          }))
        );
      }
      setLoading(false);
    }

    fetchWants();
  }, [groupId]);

  return { wants, loading };
}

/**
 * Database operations
 */

export async function createGame(
  userId: string,
  groupId: number,
  name: string,
  condition: string,
  comment: string
) {
  const { data, error } = await supabase
    .from('games')
    .insert([
      {
        user_id: userId,
        group_id: groupId,
        name,
        condition,
        comment,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGame(gameId: number) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId);

  if (error) throw error;
}

export async function createWant(myGameId: number, acceptGameId: number, rank: number) {
  const { error } = await supabase
    .from('wants')
    .insert([{ my_game_id: myGameId, accept_game_id: acceptGameId, rank }]);

  if (error) throw error;
}

export async function deleteWant(myGameId: number, acceptGameId: number) {
  const { error } = await supabase
    .from('wants')
    .delete()
    .eq('my_game_id', myGameId)
    .eq('accept_game_id', acceptGameId);

  if (error) throw error;
}

export async function updateWantRank(myGameId: number, acceptGameId: number, rank: number) {
  const { error } = await supabase
    .from('wants')
    .update({ rank })
    .eq('my_game_id', myGameId)
    .eq('accept_game_id', acceptGameId);

  if (error) throw error;
}

export async function createGroup(
  userId: string,
  name: string,
  inviteCode: string,
  isPublic: boolean
) {
  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([
      {
        name,
        invite_code: inviteCode,
        is_public: isPublic,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (groupError) throw groupError;

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      {
        group_id: group.id,
        user_id: userId,
        is_admin: true,
      },
    ]);

  if (memberError) throw memberError;

  return group;
}

export async function joinGroup(userId: string, inviteCode: string) {
  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode)
    .single();

  if (groupError) throw new Error('Invalid invite code');

  // Add user to group
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([
      {
        group_id: group.id,
        user_id: userId,
        is_admin: false,
      },
    ]);

  if (memberError) throw memberError;

  return group;
}
