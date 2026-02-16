'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, User, Plus, X, Check, Users } from 'lucide-react';

// Import organized modules
import { User as UserType, Group, Game, Want, Trade } from '@/lib/types';
import { INITIAL_USERS, INITIAL_GROUPS, INITIAL_GAMES, INITIAL_WANTS } from '@/lib/mockData';
import { calculateOptimalTrades } from '@/lib/algorithm';
import { generateInviteCode, exportTradesToFile } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MathTradeAppProps {
  user?: SupabaseUser; // Optional - only passed when using real auth
}

export default function MathTradeApp({ user }: MathTradeAppProps = {}) {
  const useMockGames = process.env.NEXT_PUBLIC_USE_MOCK_GAMES === 'true';
  
  console.log('MathTradeApp mode:', useMockGames ? 'MOCK GAMES' : 'REAL DATABASE');
  console.log('Authenticated user:', user?.email || 'using mock users');
  
  // State management
  const [currentUser, setCurrentUser] = useState<UserType>(INITIAL_USERS[0]);
  const [users] = useState<UserType[]>(INITIAL_USERS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [currentGroup, setCurrentGroup] = useState<Group>(INITIAL_GROUPS[0]);
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [wants, setWants] = useState<Want[]>(INITIAL_WANTS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState('my-games');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  
  // Form states
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [newGameCondition, setNewGameCondition] = useState('Good');
  const [newGameComment, setNewGameComment] = useState('');
  const [collapsedUsers, setCollapsedUsers] = useState<Set<number>>(new Set());
  
  // Set Wants filtering
  const [wantsFilterUser, setWantsFilterUser] = useState<number | 'all'>('all');
  const [wantsSearchTerm, setWantsSearchTerm] = useState('');

  // Group management functions
  const createGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: Group = {
      id: Math.max(...groups.map(g => g.id), 0) + 1,
      name: newGroupName,
      memberIds: [currentUser.id],
      adminIds: [currentUser.id],
      inviteCode: generateInviteCode(),
      isPublic: newGroupIsPublic
    };
    
    setGroups([...groups, newGroup]);
    setCurrentGroup(newGroup);
    setNewGroupName('');
    setNewGroupIsPublic(true);
    setShowNewGroupForm(false);
  };

  const joinByInviteCode = () => {
    const code = inviteCodeInput.trim().toUpperCase();
    const group = groups.find(g => g.inviteCode === code);
    
    if (!group) {
      alert('Invalid invite code');
      return;
    }
    
    if (group.memberIds.includes(currentUser.id)) {
      alert('You are already a member of this group');
      setInviteCodeInput('');
      return;
    }
    
    setGroups(groups.map(g => 
      g.id === group.id 
        ? { ...g, memberIds: [...g.memberIds, currentUser.id] }
        : g
    ));
    
    setCurrentGroup(group);
    setInviteCodeInput('');
    setShowJoinGroupModal(false);
    alert(`Successfully joined ${group.name}!`);
  };

  const joinGroup = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.memberIds.includes(currentUser.id)) return;
    
    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, memberIds: [...g.memberIds, currentUser.id] }
        : g
    ));
    
    setCurrentGroup(group);
    alert(`Successfully joined ${group.name}!`);
  };

  const leaveGroup = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) return;
    
    setGroups(groups.map(g => 
      g.id === groupId
        ? { 
            ...g, 
            memberIds: g.memberIds.filter(id => id !== currentUser.id),
            adminIds: g.adminIds.filter(id => id !== currentUser.id)
          }
        : g
    ));
    
    if (currentGroup.id === groupId) {
      const otherGroups = groups.filter(g => g.id !== groupId && g.memberIds.includes(currentUser.id));
      if (otherGroups.length > 0) {
        setCurrentGroup(otherGroups[0]);
      }
    }
  };

  // Admin functions
  const toggleAdmin = (groupId: number, userId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.adminIds.includes(currentUser.id)) {
      alert('Only admins can manage admin roles');
      return;
    }

    if (group.adminIds.includes(userId) && group.adminIds.length === 1) {
      alert('Cannot remove the last admin from the group');
      return;
    }

    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            adminIds: g.adminIds.includes(userId)
              ? g.adminIds.filter(id => id !== userId)
              : [...g.adminIds, userId]
          }
        : g
    ));
  };

  const removeMember = (groupId: number, userId: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.adminIds.includes(currentUser.id)) {
      alert('Only admins can remove members');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!confirm(`Remove ${user?.name} from "${group.name}"?`)) return;

    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            memberIds: g.memberIds.filter(id => id !== userId),
            adminIds: g.adminIds.filter(id => id !== userId)
          }
        : g
    ));

    setGames(games.filter(game => !(game.groupId === groupId && game.userId === userId)));
    const userGameIds = games.filter(game => game.groupId === groupId && game.userId === userId).map(g => g.id);
    setWants(wants.filter(w => !userGameIds.includes(w.myGameId) && !userGameIds.includes(w.acceptGameId)));
  };

  // Game management functions
  const addGame = () => {
    if (!newGameName.trim()) return;
    
    const newGame: Game = {
      id: Math.max(...games.map(g => g.id), 0) + 1,
      userId: currentUser.id,
      groupId: currentGroup.id,
      name: newGameName,
      condition: newGameCondition,
      comment: newGameComment
    };
    
    setGames([...games, newGame]);
    setNewGameName('');
    setNewGameCondition('Good');
    setNewGameComment('');
  };

  const deleteGame = (gameId: number) => {
    setGames(games.filter(g => g.id !== gameId));
    setWants(wants.filter(w => w.myGameId !== gameId && w.acceptGameId !== gameId));
  };

  const toggleWant = (myGameId: number, acceptGameId: number) => {
    const existing = wants.find(w => w.myGameId === myGameId && w.acceptGameId === acceptGameId);
    
    if (existing) {
      // Remove this want
      const removedRank = existing.rank;
      setWants(wants
        .filter(w => !(w.myGameId === myGameId && w.acceptGameId === acceptGameId))
        .map(w => {
          // Re-rank: if same game and rank was higher, decrement
          if (w.myGameId === myGameId && w.rank > removedRank) {
            return { ...w, rank: w.rank - 1 };
          }
          return w;
        })
      );
    } else {
      // Add new want with next rank
      const existingWants = wants.filter(w => w.myGameId === myGameId);
      const nextRank = existingWants.length > 0 
        ? Math.max(...existingWants.map(w => w.rank)) + 1 
        : 1;
      
      setWants([...wants, { myGameId, acceptGameId, rank: nextRank }]);
    }
  };

  // Move a want up in priority (decrease rank number)
  const moveWantUp = (myGameId: number, acceptGameId: number) => {
    const want = wants.find(w => w.myGameId === myGameId && w.acceptGameId === acceptGameId);
    if (!want || want.rank === 1) return; // Already at top
    
    setWants(wants.map(w => {
      if (w.myGameId === myGameId) {
        if (w.acceptGameId === acceptGameId) {
          return { ...w, rank: w.rank - 1 }; // Move up
        } else if (w.rank === want.rank - 1) {
          return { ...w, rank: w.rank + 1 }; // Swap with the one above
        }
      }
      return w;
    }));
  };

  // Move a want down in priority (increase rank number)
  const moveWantDown = (myGameId: number, acceptGameId: number) => {
    const want = wants.find(w => w.myGameId === myGameId && w.acceptGameId === acceptGameId);
    const maxRank = Math.max(...wants.filter(w => w.myGameId === myGameId).map(w => w.rank));
    if (!want || want.rank === maxRank) return; // Already at bottom
    
    setWants(wants.map(w => {
      if (w.myGameId === myGameId) {
        if (w.acceptGameId === acceptGameId) {
          return { ...w, rank: w.rank + 1 }; // Move down
        } else if (w.rank === want.rank + 1) {
          return { ...w, rank: w.rank - 1 }; // Swap with the one below
        }
      }
      return w;
    }));
  };

  // Toggle collapse for browse users
  const toggleUserCollapse = (userId: number) => {
    const newCollapsed = new Set(collapsedUsers);
    if (newCollapsed.has(userId)) {
      newCollapsed.delete(userId);
    } else {
      newCollapsed.add(userId);
    }
    setCollapsedUsers(newCollapsed);
  };

  // Filter games for Set Wants section
  const getFilteredGamesForWants = (gameId: number) => {
    let filtered = otherGames;

    // Filter by user
    if (wantsFilterUser !== 'all') {
      filtered = filtered.filter(g => g.userId === wantsFilterUser);
    }

    // Filter by search term
    if (wantsSearchTerm.trim()) {
      const search = wantsSearchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(search) ||
        g.comment.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  // Trade calculation - now uses imported algorithm
  const calculateTrades = () => {
    console.log('Calculating trades...');
    console.log('Group ID:', currentGroup.id);
    console.log('Games in group:', games.filter(g => g.groupId === currentGroup.id));
    console.log('All wants:', wants);
    
    const calculatedTrades = calculateOptimalTrades(games, wants, users, currentGroup.id);
    
    console.log('Calculated trades:', calculatedTrades);
    setTrades(calculatedTrades);
  };

  // Export trades - now uses imported utility
  const exportTrades = () => {
    exportTradesToFile(trades, currentGroup.name);
  };

  // Derived state
  const myGames = games.filter(g => g.userId === currentUser.id && g.groupId === currentGroup.id);
  const otherGames = games.filter(g => g.userId !== currentUser.id && g.groupId === currentGroup.id);
  const myGroups = groups.filter(g => g.memberIds.includes(currentUser.id));
  const isCurrentGroupAdmin = currentGroup.adminIds?.includes(currentUser.id) || currentUser.globalAdmin || false;
  const isGlobalAdmin = currentUser.globalAdmin || false;
  const tradesCalculated = trades.length > 0; // Lock data when trades exist

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Debug banner - only show when using mock data */}
      {useMockGames && (
        <div className="text-center py-1 text-xs font-mono bg-yellow-100 text-yellow-800">
          ⚠️ USING MOCK GAME DATA
        </div>
      )}
      
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Board Game Math Trade</h1>
              <p className="text-gray-600">Specify acceptable trades, algorithm finds optimal matches</p>
            </div>
            <div className="flex items-center gap-3">
              <User className="text-indigo-600" />
              <select 
                value={currentUser.id}
                onChange={(e) => {
                  const newUser = users.find(u => u.id === parseInt(e.target.value));
                  if (newUser) {
                    setCurrentUser(newUser);
                    const userGroups = groups.filter(g => g.memberIds.includes(newUser.id));
                    if (userGroups.length > 0 && !userGroups.find(g => g.id === currentGroup.id)) {
                      setCurrentGroup(userGroups[0]);
                    }
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {isGlobalAdmin && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                  GLOBAL ADMIN
                </span>
              )}
            </div>
          </div>

          {/* Group Selector */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                <span className="font-medium text-gray-700">Trade Group:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowJoinGroupModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Join Group
                </button>
                <button
                  onClick={() => setShowNewGroupForm(!showNewGroupForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  New Group
                </button>
              </div>
            </div>

            {showNewGroupForm && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-3">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Group name (e.g., NYC Board Game Meetup)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && createGroup()}
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGroupIsPublic}
                        onChange={(e) => setNewGroupIsPublic(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        Public (anyone can browse and join)
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={createGroup}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewGroupForm(false);
                        setNewGroupName('');
                        setNewGroupIsPublic(true);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Join Group Modal */}
            {showJoinGroupModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Join a Group</h3>
                    <button
                      onClick={() => {
                        setShowJoinGroupModal(false);
                        setInviteCodeInput('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Join by Invite Code */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Join by Invite Code</h4>
                    <p className="text-sm text-gray-600 mb-3">Have an invite code? Enter it below:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter invite code (e.g., ABC123)"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        onKeyPress={(e) => e.key === 'Enter' && joinByInviteCode()}
                      />
                      <button
                        onClick={joinByInviteCode}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </div>

                  {/* Browse Public Groups */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Browse Public Groups</h4>
                    <div className="space-y-2">
                      {groups.filter(g => g.isPublic && !g.memberIds.includes(currentUser.id)).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No public groups available to join</p>
                      ) : (
                        groups
                          .filter(g => g.isPublic && !g.memberIds.includes(currentUser.id))
                          .map(group => (
                            <div key={group.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                              <div>
                                <h5 className="font-medium text-gray-800">{group.name}</h5>
                                <p className="text-sm text-gray-600">{group.memberIds.length} members</p>
                              </div>
                              <button
                                onClick={() => {
                                  joinGroup(group.id);
                                  setShowJoinGroupModal(false);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Join
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {myGroups.map(group => (
                <div
                  key={group.id}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentGroup.id === group.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentGroup(group)}
                      className="flex-1 text-left"
                    >
                      <div className={`font-medium ${currentGroup.id === group.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {group.memberIds.length} members • Code: {group.inviteCode}
                        {!group.isPublic && ' 🔒'}
                      </div>
                    </button>
                    <button
                      onClick={() => leaveGroup(group.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Leave group"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {myGroups.length === 0 && (
                <p className="text-gray-500 italic">You haven&apos;t joined any groups yet. Create one or join an existing group!</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('my-games')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'my-games' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              My Games ({myGames.length} in this group)
            </button>
            <button
              onClick={() => setActiveTab('browse-users')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'browse-users' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Browse Other Users
            </button>
            {isCurrentGroupAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'admin' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('trades')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'trades' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Calculated Trades ({trades.length})
            </button>
          </div>
        </div>

        {/* My Games Tab */}
        {activeTab === 'my-games' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">My Games & Trade Preferences</h2>
            <p className="text-gray-600 mb-4">In: {currentGroup.name}</p>
            
            {/* Add Game Form */}
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Add a Game</h3>
              {tradesCalculated ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Trades have been calculated. Games are locked. 
                    {isCurrentGroupAdmin && (
                      <span> Click &quot;Clear Trades&quot; to make changes.</span>
                    )}
                    {!isCurrentGroupAdmin && (
                      <span> Ask a group admin to clear trades if you need to make changes.</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Game name (e.g., Carcassonne)"
                      value={newGameName}
                      onChange={(e) => setNewGameName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <select
                      value={newGameCondition}
                      onChange={(e) => setNewGameCondition(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option>Like New</option>
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Fair</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Comment (optional - e.g., 'Includes expansion', 'Minor box wear')"
                      value={newGameComment}
                      onChange={(e) => setNewGameComment(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addGame()}
                    />
                    <button
                      onClick={addGame}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* My Games List */}
            <div className="space-y-4">
              {myGames.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No games posted yet. Add one above!</p>
              ) : (
                myGames.map(game => {
                  const myWants = wants.filter(w => w.myGameId === game.id);
                  const isEditing = editingGameId === game.id;
                  
                  return (
                    <div key={game.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">{game.name}</h3>
                          <p className="text-sm text-gray-600">Condition: {game.condition}</p>
                          {game.comment && (
                            <p className="text-sm text-gray-500 italic mt-1">&quot;{game.comment}&quot;</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (tradesCalculated) {
                                alert('Trades have been calculated. Games are locked.');
                                return;
                              }
                              setEditingGameId(isEditing ? null : game.id);
                              // Reset filters when opening a new game's wants
                              if (!isEditing) {
                                setWantsFilterUser('all');
                                setWantsSearchTerm('');
                              }
                            }}
                            disabled={tradesCalculated}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                              tradesCalculated
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isEditing ? 'Done' : 'Set Wants'}
                          </button>
                          <button
                            onClick={() => {
                              if (tradesCalculated) {
                                alert('Trades have been calculated. Games are locked.');
                                return;
                              }
                              deleteGame(game.id);
                            }}
                            disabled={tradesCalculated}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              tradesCalculated
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                            title="Delete game"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Select games you&apos;d accept in trade for {game.name}:
                          </p>
                          
                          {/* Show currently selected wants with ranking */}
                          {myWants.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs font-semibold text-blue-800 mb-2">Your Ranked Preferences:</p>
                              <div className="space-y-1">
                                {myWants
                                  .sort((a, b) => a.rank - b.rank)
                                  .map(want => {
                                    const acceptGame = games.find(g => g.id === want.acceptGameId);
                                    const isFirst = want.rank === 1;
                                    const isLast = want.rank === myWants.length;
                                    
                                    return (
                                      <div key={want.acceptGameId} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-blue-700 w-6">{want.rank}.</span>
                                        <span className="px-2 py-1 bg-white text-gray-800 rounded text-xs flex-1">
                                          {acceptGame?.name}
                                        </span>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => moveWantUp(game.id, want.acceptGameId)}
                                            disabled={isFirst}
                                            className={`p-1 rounded ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                            title="Move up"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            onClick={() => moveWantDown(game.id, want.acceptGameId)}
                                            disabled={isLast}
                                            className={`p-1 rounded ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                                            title="Move down"
                                          >
                                            ▼
                                          </button>
                                          <button
                                            onClick={() => toggleWant(game.id, want.acceptGameId)}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                            title="Remove"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                          
                          {/* Filter Controls */}
                          <div className="mb-4 space-y-2">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 mb-1 block">Filter by User:</label>
                                <select
                                  value={wantsFilterUser}
                                  onChange={(e) => setWantsFilterUser(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                  <option value="all">All Users</option>
                                  {currentGroup.memberIds
                                    .filter(uid => uid !== currentUser.id)
                                    .map(uid => {
                                      const user = users.find(u => u.id === uid);
                                      return user ? (
                                        <option key={uid} value={uid}>{user.name}</option>
                                      ) : null;
                                    })}
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 mb-1 block">Search Games:</label>
                                <input
                                  type="text"
                                  placeholder="Search by name or comment..."
                                  value={wantsSearchTerm}
                                  onChange={(e) => setWantsSearchTerm(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            {(wantsFilterUser !== 'all' || wantsSearchTerm) && (
                              <button
                                onClick={() => {
                                  setWantsFilterUser('all');
                                  setWantsSearchTerm('');
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {getFilteredGamesForWants(game.id).length === 0 ? (
                              <p className="col-span-2 text-center text-gray-500 py-4">
                                No games found matching your filters
                              </p>
                            ) : (
                              getFilteredGamesForWants(game.id).map(otherGame => {
                                const owner = users.find(u => u.id === otherGame.userId);
                                const selectedWant = myWants.find(w => w.acceptGameId === otherGame.id);
                                const isSelected = !!selectedWant;
                                
                                return (
                                  <button
                                    key={otherGame.id}
                                    onClick={() => toggleWant(game.id, otherGame.id)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800">{otherGame.name}</p>
                                        <p className="text-xs text-gray-500">{owner?.name} • {otherGame.condition}</p>
                                        {otherGame.comment && (
                                          <p className="text-xs text-gray-400 italic mt-0.5">&quot;{otherGame.comment}&quot;</p>
                                        )}
                                      </div>
                                      {isSelected ? (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">
                                            #{selectedWant.rank}
                                          </span>
                                          <Check className="text-green-600 flex-shrink-0" size={20} />
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">
                                          Click to add
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {myWants.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No trade preferences set</p>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Would accept (in order of preference):</p>
                              <div className="space-y-1">
                                {myWants
                                  .sort((a, b) => a.rank - b.rank)
                                  .map((want, index) => {
                                    const acceptGame = games.find(g => g.id === want.acceptGameId);
                                    return (
                                      <div key={want.acceptGameId} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 w-6">{want.rank}.</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex-1">
                                          {acceptGame?.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isCurrentGroupAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Group Administration</h2>
            <p className="text-gray-600 mb-6">Manage members and admins for: {currentGroup.name}</p>
            
            <div className="space-y-4">
              {currentGroup.memberIds.map(userId => {
                const user = users.find(u => u.id === userId);
                const isAdmin = currentGroup.adminIds?.includes(userId) || false;
                const isMe = userId === currentUser.id;
                const userGames = games.filter(g => g.userId === userId && g.groupId === currentGroup.id);
                
                if (!user) return null;
                
                return (
                  <div key={userId} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <User className={isAdmin ? 'text-yellow-600' : 'text-gray-400'} size={24} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">{user.name}</h3>
                            {isMe && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You</span>}
                            {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Admin</span>}
                          </div>
                          <p className="text-sm text-gray-600">{userGames.length} games posted</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAdmin(currentGroup.id, userId)}
                          disabled={isMe && currentGroup.adminIds.length === 1}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            isAdmin
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${isMe && currentGroup.adminIds.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        
                        {!isMe && (
                          <button
                            onClick={() => removeMember(currentGroup.id, userId)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Admin Privileges</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Calculate trade results for the group</li>
                <li>• Manage group members (add/remove)</li>
                <li>• Assign or remove admin roles</li>
                <li>• Group creator is automatically an admin</li>
              </ul>
            </div>
          </div>
        )}

        {/* Browse Other Users Tab */}
        {activeTab === 'browse-users' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Browse Other Users&apos; Games</h2>
            <p className="text-gray-600 mb-6">In: {currentGroup.name} (Read-only view)</p>
            
            {currentGroup.memberIds.filter(uid => uid !== currentUser.id).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No other users in this group yet.</p>
            ) : (
              <div className="space-y-6">
                {currentGroup.memberIds.filter(uid => uid !== currentUser.id).map(userId => {
                  const user = users.find(u => u.id === userId);
                  const userGames = games.filter(g => g.userId === userId && g.groupId === currentGroup.id);
                  
                  if (!user) return null;
                  
                  return (
                    <div key={userId} className="border-2 border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleUserCollapse(userId)}
                        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <User className="text-indigo-600" size={24} />
                          <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                          <span className="text-sm text-gray-500">({userGames.length} games)</span>
                        </div>
                        <div className="text-gray-400">
                          {collapsedUsers.has(userId) ? '▼' : '▲'}
                        </div>
                      </button>
                      
                      {!collapsedUsers.has(userId) && (
                        <div className="px-5 pb-5">
                          {userGames.length === 0 ? (
                            <p className="text-gray-500 italic">No games posted yet</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {userGames.map(game => {
                                const gameWants = wants.filter(w => w.myGameId === game.id);
                                
                                return (
                                  <div key={game.id} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800">{game.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">Condition: {game.condition}</p>
                                    {game.comment && (
                                      <p className="text-sm text-gray-500 italic mt-1">&quot;{game.comment}&quot;</p>
                                    )}
                                    
                                    {gameWants.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-600 mb-1">Would accept:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {gameWants.map(want => {
                                            const acceptGame = games.find(g => g.id === want.acceptGameId);
                                            return (
                                              <span key={want.acceptGameId} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                                {acceptGame?.name}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Calculated Trade Chains</h2>
                <p className="text-gray-600 mt-1">For: {currentGroup.name} ({currentGroup.memberIds.length} members)</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportTrades}
                  disabled={trades.length === 0}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                    trades.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Report
                </button>
                {isCurrentGroupAdmin && (
                  <>
                    {trades.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Clear all calculated trades and start over?')) {
                            setTrades([]);
                          }
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                      >
                        <X size={20} />
                        Clear Trades
                      </button>
                    )}
                    <button
                      onClick={calculateTrades}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <RefreshCw size={20} />
                      {trades.length > 0 ? 'Recalculate' : 'Calculate Optimal Trades'}
                    </button>
                  </>
                )}
                {!isCurrentGroupAdmin && (
                  <div className="px-6 py-3 bg-gray-200 text-gray-600 rounded-lg flex items-center gap-2 font-medium cursor-not-allowed" title="Only group admins can calculate trades">
                    <RefreshCw size={20} />
                    Calculate Optimal Trades (Admin Only)
                  </div>
                )}
              </div>
            </div>

            {trades.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <RefreshCw size={48} className="mx-auto text-gray-400 mb-3" />
                {isCurrentGroupAdmin ? (
                  <>
                    <p className="text-gray-600 text-lg">Click &quot;Calculate Optimal Trades&quot; to find matches</p>
                    <p className="text-gray-500 text-sm mt-2">The algorithm finds direct swaps and circular trade chains</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-lg">No trades calculated yet</p>
                    <p className="text-gray-500 text-sm mt-2">Group admins can calculate trades once everyone has set their preferences</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* User's Trade Summary */}
                {(() => {
                  const myTrades = trades.filter(t => t.involvedUserIds.includes(currentUser.id));
                  if (myTrades.length > 0) {
                    // Calculate what user is giving and getting with trading partners
                    const giving: Array<{game: string, to: string}> = [];
                    const getting: Array<{game: string, from: string}> = [];
                    
                    myTrades.forEach(trade => {
                      trade.chain.forEach(step => {
                        // Step format: "from gives fromGame → to receives it"
                        // So: step.from gives step.fromGame TO step.to
                        // Therefore: step.to RECEIVES step.fromGame
                        
                        const fromUser = users.find(u => u.name === step.from);
                        const toUser = users.find(u => u.name === step.to);
                        
                        // If I'm the giver in this step, I'm giving away fromGame to toUser
                        if (fromUser?.id === currentUser.id) {
                          giving.push({
                            game: step.fromGame,
                            to: step.to
                          });
                        }
                        
                        // If I'm the receiver in this step, I'm getting fromGame from fromUser
                        if (toUser?.id === currentUser.id) {
                          getting.push({
                            game: step.fromGame,
                            from: step.from
                          });
                        }
                      });
                    });

                    return (
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-6 shadow-xl">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                          <span className="text-3xl">🎯</span>
                          Your Trade Summary
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                              <span className="text-xl">📤</span>
                              You&apos;re Giving Away:
                            </h4>
                            <ul className="space-y-2">
                              {giving.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-200 mt-1">•</span>
                                  <div>
                                    <span className="text-lg font-semibold">{item.game}</span>
                                    <span className="text-blue-100 text-sm ml-2">→ to {item.to}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                              <span className="text-xl">📥</span>
                              You&apos;re Getting:
                            </h4>
                            <ul className="space-y-2">
                              {getting.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-200 mt-1">•</span>
                                  <div>
                                    <span className="text-lg font-semibold">{item.game}</span>
                                    <span className="text-green-100 text-sm ml-2">← from {item.from}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* All Trades List */}
                {trades
                  .sort((a, b) => {
                    const aHasUser = a.involvedUserIds.includes(currentUser.id);
                    const bHasUser = b.involvedUserIds.includes(currentUser.id);
                    if (aHasUser && !bHasUser) return -1;
                    if (!aHasUser && bHasUser) return 1;
                    return 0;
                  })
                  .map(trade => {
                    const isMyTrade = trade.involvedUserIds.includes(currentUser.id);
                    
                    return (
                      <div 
                        key={trade.id} 
                        className={`border-2 rounded-lg p-5 ${
                          isMyTrade 
                            ? 'border-blue-400 bg-blue-50 shadow-lg' 
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className={isMyTrade ? 'text-blue-600' : 'text-green-600'} size={28} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-gray-800">
                                {trade.type === 'direct' ? 'Direct Swap' : `${trade.chain.length}-Way Trade Chain`}
                              </span>
                              {isMyTrade && (
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold animate-pulse">
                                  YOUR TRADE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {trade.chain.length} {trade.chain.length === 1 ? 'person' : 'people'} involved
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 ml-11">
                          {trade.chain.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-gray-700">
                              <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                isMyTrade ? 'bg-blue-600' : 'bg-indigo-600'
                              }`}>
                                {idx + 1}
                              </div>
                              <p>
                                <span className="font-medium">{step.from}</span> gives{' '}
                                <span className={`font-semibold ${isMyTrade ? 'text-blue-600' : 'text-indigo-600'}`}>
                                  {step.fromGame}
                                </span>
                                {' '}→{' '}
                                <span className="font-medium">{step.to}</span> receives it
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
