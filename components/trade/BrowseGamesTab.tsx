'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import GameCard from './GameCard';

export default function BrowseGamesTab() {
  const { currentUser, currentGroup, games, users } = useTradeApp();
  const [collapsedUsers, setCollapsedUsers] = useState<Set<string | number>>(new Set());
  
  // If no group selected
  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No group selected. Create or join a group to browse games.</p>
      </div>
    );
  }
  
  const otherGames = games.filter(g => String(g.userId) !== String(currentUser.id) && String(g.groupId) === String(currentGroup.id));
  const otherUsersWithGames = users.filter(u => 
    String(u.id) !== String(currentUser.id) && 
    otherGames.some(g => String(g.userId) === String(u.id))
  );
  
  const toggleUserCollapse = (userId: string | number) => {
    const newCollapsed = new Set(collapsedUsers);
    if (newCollapsed.has(userId)) {
      newCollapsed.delete(userId);
    } else {
      newCollapsed.add(userId);
    }
    setCollapsedUsers(newCollapsed);
  };
  
  if (otherUsersWithGames.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No other users have added games yet.</p>
        <p className="text-sm text-gray-400 mt-2">Invite others to join your group!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700">Other Users' Games</h3>
      
      {otherUsersWithGames.map(user => {
        const userGames = otherGames.filter(g => String(g.userId) === String(user.id));
        const isCollapsed = collapsedUsers.has(user.id);
        
        return (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleUserCollapse(user.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                <span className="font-semibold text-gray-800">{user.name}</span>
                <span className="text-sm text-gray-500">({userGames.length} games)</span>
              </div>
            </button>
            
            {!isCollapsed && (
              <div className="px-4 pb-4 space-y-3">
                {userGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isOwner={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
