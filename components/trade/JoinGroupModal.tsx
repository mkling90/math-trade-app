'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import { joinGroup } from '@/lib/supabaseData';

interface JoinGroupModalProps {
  onClose: () => void;
}

export default function JoinGroupModal({ onClose }: JoinGroupModalProps) {
  const { supabaseUser, groups, setGroups, setCurrentGroup, useMockGames } = useTradeApp();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const publicGroups = groups.filter(g => g.isPublic && !g.memberIds.includes(supabaseUser?.id ? parseInt(supabaseUser.id) : 0));
  
  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) return;
    
    if (useMockGames) {
      // Mock mode - just find and join
      const group = groups.find(g => g.inviteCode === inviteCode.toUpperCase());
      if (group) {
        alert(`Joined ${group.name}!`);
        onClose();
      } else {
        alert('Invalid invite code');
      }
    } else {
      // Real database mode
      setLoading(true);
      try {
        await joinGroup(supabaseUser!.id, inviteCode.toUpperCase());
        alert('Successfully joined group!');
        // TODO: Refresh groups list
        onClose();
      } catch (error: any) {
        alert(error.message || 'Failed to join group');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleJoinPublic = (group: any) => {
    if (useMockGames) {
      alert(`Joined ${group.name}!`);
      onClose();
    } else {
      handleJoinWithCode(); // TODO: implement public group joining
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Join a Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Join with invite code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Invite Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                maxLength={10}
              />
              <button
                onClick={handleJoinWithCode}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
          
          {/* Public groups */}
          {publicGroups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or join a public group
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {publicGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleJoinPublic(group)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{group.name}</p>
                    <p className="text-sm text-gray-500">{group.memberIds.length} members</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
