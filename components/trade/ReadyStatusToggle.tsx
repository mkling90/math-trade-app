'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { supabase } from '@/lib/supabase';

interface ReadyStatusToggleProps {
  userId: string;
  groupId: string | number;
  myGames: any[];
  wants: any[];
  useMockGames: boolean;
}

export default function ReadyStatusToggle({ 
  userId, 
  groupId,
  myGames,
  wants,
  useMockGames 
}: ReadyStatusToggleProps) {
  const { showToast } = useToast();
  const [isReady, setIsReady] = useState(false);
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
          .select('is_ready')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          setIsReady(data.is_ready || false);
        }
      } catch (error: any) {
        console.error('Error loading ready status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReadyStatus();
  }, [groupId, userId, useMockGames]);
  
  // Can mark ready if user has at least one game
  const canMarkReady = myGames.length > 0;
  
  const toggleReady = async () => {
    if (!canMarkReady && !isReady) {
      showToast('Please add at least one game first', 'warning');
      return;
    }
    
    setIsToggling(true);
    const newStatus = !isReady;
    
    try {
      if (!useMockGames) {
        const now = new Date().toISOString();
        
        const { error } = await supabase
          .from('group_members')
          .update({ 
            is_ready: newStatus,
            ready_at: newStatus ? now : null
          })
          .eq('group_id', groupId)
          .eq('user_id', userId);
        
        if (error) throw error;
      }
      
      setIsReady(newStatus);
      showToast(
        newStatus 
          ? '✓ Marked as ready for trading!' 
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
      <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
    );
  }
  
  return (
    <button
      onClick={toggleReady}
      disabled={isToggling || (!canMarkReady && !isReady)}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
        isReady
          ? 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
          : canMarkReady
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      title={
        isReady 
          ? 'Click to mark as not ready' 
          : canMarkReady 
          ? 'Mark yourself as ready for trading'
          : 'Add at least one game first'
      }
    >
      {isToggling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="hidden sm:inline">Updating...</span>
        </>
      ) : isReady ? (
        <>
          <CheckCircle size={16} className="flex-shrink-0" />
          <span className="hidden sm:inline">Ready!</span>
        </>
      ) : (
        <>
          <Circle size={16} className="flex-shrink-0" />
          <span className="hidden sm:inline">Mark Ready</span>
        </>
      )}
    </button>
  );
}
