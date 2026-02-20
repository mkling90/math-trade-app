'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import { createGroup } from '@/lib/supabaseData';
import { generateInviteCode } from '@/lib/utils';

interface CreateGroupModalProps {
  onClose: () => void;
}

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { supabaseUser, groups, setGroups, setCurrentGroup, useMockGames } = useTradeApp();
  const [groupName, setGroupName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async () => {
    if (!groupName.trim()) return;
    
    if (useMockGames) {
      // Mock mode
      const newGroup = {
        id: Math.max(...groups.map(g => typeof g.id === 'number' ? g.id : 0), 0) + 1,
        name: groupName,
        memberIds: [1], // Current user mock ID
        adminIds: [1],
        inviteCode: generateInviteCode(),
        isPublic,
      };
      setGroups([...groups, newGroup]);
      setCurrentGroup(newGroup);
      alert(`Created ${groupName}!`);
      onClose();
    } else {
      // Real database mode
      setLoading(true);
      try {
        const inviteCode = generateInviteCode();
        await createGroup(supabaseUser!.id, groupName, inviteCode, isPublic);
        alert('Group created successfully!');
        // TODO: Refresh groups list
        onClose();
      } catch (error: any) {
        alert('Error creating group: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Philly Board Game Meetup"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make group public (anyone can see and join)
            </label>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !groupName.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
