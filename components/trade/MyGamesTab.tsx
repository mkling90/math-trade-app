'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import GameCard from './GameCard';
import SetWantsModal from './SetWantsModal';
import { createGame as createGameDB, deleteGame as deleteGameDB } from '@/lib/supabaseData';

export default function MyGamesTab() {
  const { 
    supabaseUser, 
    currentUser, 
    currentGroup, 
    games, 
    setGames, 
    wants, 
    setWants,
    trades,
    useMockGames 
  } = useTradeApp();
  
  const [newGameName, setNewGameName] = useState('');
  const [newGameCondition, setNewGameCondition] = useState('Good');
  const [newGameComment, setNewGameComment] = useState('');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  
  // If no group selected, show message
  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No group selected. Create or join a group to get started!</p>
      </div>
    );
  }
  
  const myGames = games.filter(g => g.userId === currentUser.id && g.groupId === currentGroup.id);
  const tradesCalculated = trades.length > 0;
  
  const addGame = async () => {
    if (!newGameName.trim()) return;
    
    if (useMockGames) {
      // Mock mode
      const newGame = {
        id: Math.max(...games.map(g => g.id), 0) + 1,
        userId: currentUser.id,
        groupId: currentGroup.id,
        name: newGameName,
        condition: newGameCondition,
        comment: newGameComment,
      };
      setGames([...games, newGame]);
    } else {
      // Real database mode
      try {
        await createGameDB(
          supabaseUser!.id,
          currentGroup.id,
          newGameName,
          newGameCondition,
          newGameComment
        );
        // Data will refresh via hook
      } catch (error: any) {
        alert('Error adding game: ' + error.message);
      }
    }
    
    setNewGameName('');
    setNewGameComment('');
  };
  
  const deleteGame = async (gameId: number) => {
    if (useMockGames) {
      // Mock mode
      setGames(games.filter(g => g.id !== gameId));
      setWants(wants.filter(w => w.myGameId !== gameId && w.acceptGameId !== gameId));
    } else {
      // Real database mode
      try {
        await deleteGameDB(gameId);
        // Data will refresh via hook
      } catch (error: any) {
        alert('Error deleting game: ' + error.message);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Add Game Form */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Add a Game</h3>
        {tradesCalculated ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Trades have been calculated. Games are locked.
              {currentGroup.adminIds?.includes(currentUser.id) && (
                <span> Click &quot;Clear Trades&quot; to make changes.</span>
              )}
              {!currentGroup.adminIds?.includes(currentUser.id) && (
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
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">
          My Games ({myGames.length})
        </h3>
        {myGames.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No games added yet. Add your first game above!
          </p>
        ) : (
          <div className="space-y-4">
            {myGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                isOwner={true}
                isEditing={editingGameId === game.id}
                onSetWants={() => setEditingGameId(editingGameId === game.id ? null : game.id)}
                onDelete={() => deleteGame(game.id)}
                disabled={tradesCalculated}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Set Wants Modal */}
      {editingGameId && (
        <SetWantsModal
          gameId={editingGameId}
          onClose={() => setEditingGameId(null)}
        />
      )}
    </div>
  );
}
