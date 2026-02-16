'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import JoinGroupModal from './JoinGroupModal';
import CreateGroupModal from './CreateGroupModal';

export default function GroupSelector() {
  const { groups, currentGroup, setCurrentGroup } = useTradeApp();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-indigo-600" />
        <select
          value={currentGroup.id}
          onChange={(e) => {
            const group = groups.find(g => g.id === parseInt(e.target.value));
            if (group) setCurrentGroup(group);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.memberIds.length} members) {group.inviteCode ? `- ${group.inviteCode}` : ''}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowJoinModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          Join Group
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          New Group
        </button>
      </div>
      
      {showJoinModal && <JoinGroupModal onClose={() => setShowJoinModal(false)} />}
      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}
