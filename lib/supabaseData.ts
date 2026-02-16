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
          id: data.id, // Keep UUID as string
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
        // Strategy: Fetch group_members first, then get group details
        // This avoids RLS recursion issues
        
        // Step 1: Get groups where user is a member
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('group_id, is_admin')
          .eq('user_id', userId);

        if (memberError) {
          console.error('Error fetching group memberships:', memberError);
          setLoading(false);
          return;
        }

        const memberGroupIds = memberData?.map(m => m.group_id) || [];
        const memberAdminMap = new Map(memberData?.map(m => [m.group_id, m.is_admin]) || []);

        // Step 2: Get all groups (RLS will filter to: created, public, or global admin)
        const { data: allGroups, error: groupsError } = await supabase
          .from('groups')
          .select('*');

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
          setLoading(false);
          return;
        }

        // Step 3: For each group, get all members
        const groupsWithMembers = await Promise.all(
          (allGroups || []).map(async (group) => {
            const { data: members } = await supabase
              .from('group_members')
              .select('user_id, is_admin')
              .eq('group_id', group.id);

            return {
              id: group.id, // Keep UUID as string
              name: group.name,
              memberIds: members?.map(m => m.user_id) || [], // Keep UUIDs as strings
              adminIds: members?.filter(m => m.is_admin).map(m => m.user_id) || [], // Keep UUIDs as strings
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
            id: game.id, // Keep as string
            userId: game.user_id, // Keep as string
            groupId: game.group_id, // Keep as string
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

  const refetch = () => {
    if (groupId) {
      setLoading(true);
      const { data, error } = supabase
        .from('games')
        .select('*')
        .eq('group_id', groupId)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching games:', error);
          } else if (data) {
            setGames(
              data.map(game => ({
                id: game.id,
                userId: game.user_id,
                groupId: game.group_id,
                name: game.name,
                condition: game.condition,
                comment: game.comment || '',
              }))
            );
          }
          setLoading(false);
        });
    }
  };

  return { games, loading, refetch };
}

/**
 * Hook to fetch all wants for games in a group
 */
export function useWants(groupId: string | null) {
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
        .eq('group_id', groupId); // Use UUID string

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
            myGameId: want.my_game_id, // Keep as string
            acceptGameId: want.accept_game_id, // Keep as string
            rank: want.rank,
          }))
        );
      }
      setLoading(false);
    }

    fetchWants();
  }, [groupId]);

  const refetch = () => {
    if (groupId) {
      setLoading(true);
      supabase
        .from('games')
        .select('id')
        .eq('group_id', groupId)
        .then(({ data: gamesData }) => {
          if (!gamesData || gamesData.length === 0) {
            setWants([]);
            setLoading(false);
            return;
          }

          const gameIds = gamesData.map(g => g.id);

          supabase
            .from('wants')
            .select('*')
            .in('my_game_id', gameIds)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching wants:', error);
              } else if (data) {
                setWants(
                  data.map(want => ({
                    myGameId: want.my_game_id,
                    acceptGameId: want.accept_game_id,
                    rank: want.rank,
                  }))
                );
              }
              setLoading(false);
            });
        });
    }
  };

  return { wants, loading, refetch };
}

/**
 * Database operations
 */

export async function createGame(
  userId: string,
  groupId: string, // UUID string, not number
  name: string,
  condition: string,
  comment: string
) {
  const { data, error } = await supabase
    .from('games')
    .insert([
      {
        user_id: userId,
        group_id: groupId, // Pass UUID directly
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
  // Use SECURITY DEFINER function to bypass RLS issues
  const { data, error } = await supabase
    .rpc('create_group_with_admin', {
      p_user_id: userId,
      p_name: name,
      p_invite_code: inviteCode,
      p_is_public: isPublic
    });

  if (error) throw error;
  
  return { id: data };
}

/**
 * Update user's display name
 */
export async function updateProfileName(userId: string, newName: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: newName })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Hook to fetch user profiles for group members
 */
export function useGroupMembers(memberIds: (string | number)[] | undefined) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberIds || memberIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    async function fetchMembers() {
      // Convert memberIds to strings (UUIDs)
      const stringIds = memberIds.map(id => String(id));

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, global_admin')
        .in('id', stringIds);

      if (error) {
        console.error('Error fetching group members:', error);
      } else if (data) {
        setMembers(
          data.map(profile => ({
            id: profile.id,
            name: profile.name,
            globalAdmin: profile.global_admin || false,
          }))
        );
      }
      setLoading(false);
    }

    fetchMembers();
  }, [JSON.stringify(memberIds)]); // Use JSON.stringify for array comparison

  return { members, loading };
}

export async function joinGroup(userId: string, inviteCode: string) {
  // Find group by invite code (case-insensitive)
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .ilike('invite_code', inviteCode) // Case-insensitive search
    .single();

  if (groupError || !group) {
    console.error('Group lookup error:', groupError);
    throw new Error('Invalid invite code');
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    throw new Error('You are already a member of this group');
  }

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

  if (memberError) {
    console.error('Member insert error:', memberError);
    throw memberError;
  }

  return group;
}
