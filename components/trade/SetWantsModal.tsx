'use client';

import { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import { createWant, deleteWant, updateWantRank } from '@/lib/supabaseData';

interface SetWantsModalProps {
  gameId: string | number;
  onClose: () => void;
}

export default function SetWantsModal({ gameId, onClose }: SetWantsModalProps) {
  const { 
    currentUser, 
    currentGroup, 
    games, 
    wants, 
    setWants,
    users,
    useMockGames,
    refetchWants
  } = useTradeApp();
  
  const [filterUser, setFilterUser] = useState<string | number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Safety check - should never happen but handle it
  if (!currentGroup) {
    return null;
  }
  
  const game = games.find(g => String(g.id) === String(gameId));
  const myWants = wants.filter(w => String(w.myGameId) === String(gameId)).sort((a, b) => a.rank - b.rank);
  
  const availableGames = games.filter(g => 
    g.groupId === currentGroup.id && 
    g.id !== gameId && 
    g.userId !== currentUser.id
  );
  
  const filteredGames = useMemo(() => {
    return availableGames.filter(g => {
      const matchesUser = filterUser === 'all' || String(g.userId) === String(filterUser);
      const matchesSearch = !searchTerm || 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.comment && g.comment.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesUser && matchesSearch;
    });
  }, [availableGames, filterUser, searchTerm]);
  
  const toggleWant = async (acceptGameId: string | number) => {
    const existing = wants.find(w => String(w.myGameId) === String(gameId) && String(w.acceptGameId) === String(acceptGameId));
    
    if (useMockGames) {
      // Mock mode
      if (existing) {
        const removedRank = existing.rank;
        setWants(wants
          .filter(w => !(String(w.myGameId) === String(gameId) && String(w.acceptGameId) === String(acceptGameId)))
          .map(w => {
            if (String(w.myGameId) === String(gameId) && w.rank > removedRank) {
              return { ...w, rank: w.rank - 1 };
            }
            return w;
          })
        );
      } else {
        const existingWants = wants.filter(w => String(w.myGameId) === String(gameId));
        const nextRank = existingWants.length > 0 
          ? Math.max(...existingWants.map(w => w.rank)) + 1 
          : 1;
        setWants([...wants, { myGameId: gameId, acceptGameId, rank: nextRank }]);
      }
    } else {
      // Real database mode - update database but don't refetch yet
      try {
        if (existing) {
          await deleteWant(gameId, acceptGameId);
          // Re-rank remaining wants
          const toUpdate = myWants.filter(w => w.rank > existing.rank);
          for (const w of toUpdate) {
            await updateWantRank(w.myGameId, w.acceptGameId, w.rank - 1);
          }
        } else {
          const nextRank = myWants.length + 1;
          await createWant(gameId, acceptGameId, nextRank);
        }
        // Optimistically update local state for immediate UI feedback
        if (existing) {
          const removedRank = existing.rank;
          setWants(wants
            .filter(w => !(String(w.myGameId) === String(gameId) && String(w.acceptGameId) === String(acceptGameId)))
            .map(w => {
              if (String(w.myGameId) === String(gameId) && w.rank > removedRank) {
                return { ...w, rank: w.rank - 1 };
              }
              return w;
            })
          );
        } else {
          const nextRank = myWants.length + 1;
          setWants([...wants, { myGameId: gameId, acceptGameId, rank: nextRank }]);
        }
      } catch (error: any) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          // Duplicate detected - refetch to sync
          if (refetchWants) refetchWants();
        } else {
          alert('Error updating wants: ' + error.message);
        }
      }
    }
  };
  
  const moveWantUp = async (acceptGameId: string | number) => {
    const want = myWants.find(w => String(w.acceptGameId) === String(acceptGameId));
    if (!want || want.rank === 1) return;
    
    if (useMockGames) {
      // Mock mode
      setWants(wants.map(w => {
        if (String(w.myGameId) === String(gameId)) {
          if (String(w.acceptGameId) === String(acceptGameId)) {
            return { ...w, rank: w.rank - 1 };
          } else if (w.rank === want.rank - 1) {
            return { ...w, rank: w.rank + 1 };
          }
        }
        return w;
      }));
    } else {
      // Real database mode - optimistic update
      const swapWith = myWants.find(w => w.rank === want.rank - 1);
      if (swapWith) {
        // Update UI immediately
        setWants(wants.map(w => {
          if (String(w.myGameId) === String(gameId)) {
            if (String(w.acceptGameId) === String(acceptGameId)) {
              return { ...w, rank: w.rank - 1 };
            } else if (w.rank === want.rank - 1) {
              return { ...w, rank: w.rank + 1 };
            }
          }
          return w;
        }));
        
        // Update database in background
        try {
          await updateWantRank(want.myGameId, want.acceptGameId, want.rank - 1);
          await updateWantRank(swapWith.myGameId, swapWith.acceptGameId, swapWith.rank + 1);
        } catch (error: any) {
          alert('Error reordering: ' + error.message);
          if (refetchWants) refetchWants(); // Sync on error
        }
      }
    }
  };
  
  const moveWantDown = async (acceptGameId: string | number) => {
    const want = myWants.find(w => String(w.acceptGameId) === String(acceptGameId));
    const maxRank = Math.max(...myWants.map(w => w.rank));
    if (!want || want.rank === maxRank) return;
    
    if (useMockGames) {
      // Mock mode
      setWants(wants.map(w => {
        if (String(w.myGameId) === String(gameId)) {
          if (String(w.acceptGameId) === String(acceptGameId)) {
            return { ...w, rank: w.rank + 1 };
          } else if (w.rank === want.rank + 1) {
            return { ...w, rank: w.rank - 1 };
          }
        }
        return w;
      }));
    } else {
      // Real database mode - optimistic update
      const swapWith = myWants.find(w => w.rank === want.rank + 1);
      if (swapWith) {
        // Update UI immediately
        setWants(wants.map(w => {
          if (String(w.myGameId) === String(gameId)) {
            if (String(w.acceptGameId) === String(acceptGameId)) {
              return { ...w, rank: w.rank + 1 };
            } else if (w.rank === want.rank + 1) {
              return { ...w, rank: w.rank - 1 };
            }
          }
          return w;
        }));
        
        // Update database in background
        try {
          await updateWantRank(want.myGameId, want.acceptGameId, want.rank + 1);
          await updateWantRank(swapWith.myGameId, swapWith.acceptGameId, swapWith.rank - 1);
        } catch (error: any) {
          alert('Error reordering: ' + error.message);
          if (refetchWants) refetchWants(); // Sync on error
        }
      }
    }
  };
  
  if (!game) return null;
  
  const otherUsers = users.filter(u => 
    u.id !== currentUser.id && 
    availableGames.some(g => g.userId === u.id)
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Set Trade Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">For: {game.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current rankings */}
          {myWants.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-800 mb-2">Your Ranked Preferences:</p>
              <div className="space-y-1">
                {myWants.map(want => {
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
                          onClick={() => moveWantUp(want.acceptGameId)}
                          disabled={isFirst}
                          className={`p-1 rounded ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveWantDown(want.acceptGameId)}
                          disabled={isLast}
                          className={`p-1 rounded ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => toggleWant(want.acceptGameId)}
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
          
          {/* Filters */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by User</label>
              <select
                value={filterUser === 'all' ? 'all' : String(filterUser)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    setFilterUser('all');
                  } else {
                    // Keep as string (UUID) or convert to number (mock data)
                    // Find the matching user to get the correct ID type
                    const matchingUser = otherUsers.find(u => String(u.id) === value);
                    setFilterUser(matchingUser?.id || value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Users</option>
                {otherUsers.map(u => (
                  <option key={String(u.id)} value={String(u.id)}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                type="text"
                placeholder="Game name or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {(filterUser !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterUser('all');
                  setSearchTerm('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Available games */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Select games you'd accept (click to add/remove):
            </p>
            {filteredGames.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No games found matching your filters
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredGames.map(otherGame => {
                  const owner = users.find(u => u.id === otherGame.userId);
                  const selectedWant = myWants.find(w => w.acceptGameId === otherGame.id);
                  const isSelected = !!selectedWant;
                  
                  return (
                    <button
                      key={otherGame.id}
                      onClick={() => toggleWant(otherGame.id)}
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
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t p-4">
          <button
            onClick={() => {
              // Refetch to ensure final sync with database
              if (!useMockGames && refetchWants) {
                refetchWants();
              }
              onClose();
            }}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
