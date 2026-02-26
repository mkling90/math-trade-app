'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { supabase } from '@/lib/supabase';

interface ReadyStatusBannerProps {
  userId: string;
  groupId: string | number;
  currentGroup: any;
  myGames: any[];
  wants: any[];
  useMockGames: boolean;
}

export default function ReadyStatusBanner({ 
  userId, 
  groupId, 
  currentGroup,
  myGames,
  wants,
  useMockGames 
}: ReadyStatusBannerProps) {
  const { showToast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [readyAt, setReadyAt] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load current ready status from database
  useEffect(() => {
    if (useMockGames) {
      setIsLoading(false);
      return;
    }

    async function loadReadyStatus() {
      try {
        const { data, error } = await supabase
          .from('group_members')
          .select('is_ready, ready_at')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          setIsReady(data.is_ready || false);
          setReadyAt(data.ready_at);
        }
      } catch (error: any) {
        console.error('Error loading ready status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReadyStatus();
  }, [groupId, userId, useMockGames]);
  
  // Calculate if user has set wants for all their games
  const gamesWithWants = myGames.filter(game => 
    wants.some(w => String(w.myGameId) === String(game.id))
  );
  const allGamesHaveWants = myGames.length > 0 && gamesWithWants.length === myGames.length;
  const canMarkReady = myGames.length > 0 && allGamesHaveWants;
  
  const toggleReady = async () => {
    if (!canMarkReady && !isReady) {
      showToast('Please set trade preferences for all your games first', 'warning');
      return;
    }
    
    setIsToggling(true);
    const newStatus = !isReady;
    
    try {
      if (!useMockGames) {
        const now = new Date().toISOString();
        
        // Update in database
        const { error } = await supabase
          .from('group_members')
          .update({ 
            is_ready: newStatus,
            ready_at: newStatus ? now : null
          })
          .eq('group_id', groupId)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        setReadyAt(newStatus ? now : null);
      }
      
      setIsReady(newStatus);
      showToast(
        newStatus 
          ? '✓ Marked as ready! Waiting for others...' 
          : 'Marked as not ready',
        newStatus ? 'success' : 'info'
      );
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg p-4 border-2 border-gray-300 bg-gray-50 animate-pulse">
        <div className="h-16"></div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg p-4 border-2 transition-all ${
      isReady 
        ? 'bg-green-50 border-green-500' 
        : canMarkReady
        ? 'bg-blue-50 border-blue-300'
        : 'bg-gray-50 border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isReady ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <Circle className="text-gray-400" size={20} />
            )}
            <h4 className={`font-semibold ${
              isReady ? 'text-green-800' : 'text-gray-700'
            }`}>
              {isReady ? 'Ready for Trading!' : 'Trading Status'}
            </h4>
            {isReady && readyAt && (
              <span className="text-xs text-green-600">
                {new Date(readyAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {isReady ? (
              'You\'re ready! Waiting for other members to mark themselves ready.'
            ) : myGames.length === 0 ? (
              'Add at least one game to participate in trades'
            ) : !allGamesHaveWants ? (
              `Set trade preferences for ${myGames.length - gamesWithWants.length} more ${myGames.length - gamesWithWants.length === 1 ? 'game' : 'games'}`
            ) : (
              'All set! Mark yourself as ready when you\'re done.'
            )}
          </p>
        </div>
        
        <button
          onClick={toggleReady}
          disabled={isToggling || (!canMarkReady && !isReady)}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isReady
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : canMarkReady
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isToggling ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Updating...
            </>
          ) : isReady ? (
            <>
              <Circle size={16} />
              Mark Not Ready
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Mark Ready
            </>
          )}
        </button>
      </div>
      
      {/* Progress indicator */}
      {!isReady && myGames.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <span>Progress:</span>
            <span className="font-medium">{gamesWithWants.length} / {myGames.length} games ready</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                allGamesHaveWants ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(gamesWithWants.length / myGames.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
