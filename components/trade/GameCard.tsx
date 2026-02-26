'use client';

import { X } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';

interface GameCardProps {
  game: any;
  isOwner: boolean;
  isEditing?: boolean;
  onSetWants?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  isDeleting?: boolean;
}

export default function GameCard({
  game,
  isOwner,
  isEditing = false,
  onSetWants,
  onDelete,
  disabled = false,
  isDeleting = false
}: GameCardProps) {
  const { users, wants, games } = useTradeApp(); // Get games here
  
  const owner = users.find(u => u.id === game.userId);
  const gameWants = wants.filter(w => w.myGameId === game.id).sort((a, b) => a.rank - b.rank);
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{game.name}</h4>
          {!isOwner && (
            <p className="text-sm text-gray-500">Owner: {owner?.name}</p>
          )}
          <p className="text-sm text-gray-600">Condition: {game.condition}</p>
          {game.comment && (
            <p className="text-sm text-gray-500 italic mt-1">&quot;{game.comment}&quot;</p>
          )}
        </div>
        
        {isOwner && (
          <div className="flex gap-2">
            {onSetWants && (
              <button
                onClick={() => {
                  if (disabled) {
                    alert('Trades have been calculated. Games are locked.');
                    return;
                  }
                  onSetWants();
                }}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  disabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isEditing ? 'Done' : 'Set Wants'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (disabled && !isDeleting) {
                    alert('Trades have been calculated. Games are locked.');
                    return;
                  }
                  if (!isDeleting) onDelete();
                }}
                disabled={disabled}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  disabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
                title="Delete game"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <X size={20} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Show wants if not editing */}
      {!isEditing && gameWants.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Would accept (in order of preference):
          </p>
          <div className="space-y-1">
            {gameWants.map(want => {
              const acceptGame = games.find(g => g.id === want.acceptGameId); // Use games from hook above
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
  );
}
