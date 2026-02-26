'use client';

import { useState } from 'react';
import { Users, Plus, Copy, Check } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import JoinGroupModal from './JoinGroupModal';
import CreateGroupModal from './CreateGroupModal';

export default function GroupSelector() {
  const { groups, currentGroup, setCurrentGroup } = useTradeApp();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const copyInviteCode = () => {
    if (currentGroup?.inviteCode) {
      navigator.clipboard.writeText(currentGroup.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // If no groups, show message
  if (groups.length === 0) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">No groups yet!</p>
          <p className="text-sm text-yellow-700 mb-3">Create a new group or join an existing one to get started.</p>
          <div className="flex gap-2">
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
              Create Group
            </button>
          </div>
        </div>
        
        {showJoinModal && <JoinGroupModal onClose={() => setShowJoinModal(false)} />}
        {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
      </>
    );
  }
  
  return (
    <>
      {/* Compact group selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Select Group:</label>
        <select
          value={currentGroup?.id?.toString() || ''}
          onChange={(e) => {
            const group = groups.find(g => g.id.toString() === e.target.value);
            if (group) setCurrentGroup(group);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
        >
          {groups.map(group => (
            <option key={group.id.toString()} value={group.id.toString()} className="text-gray-900">
              {group.name}
            </option>
          ))}
        </select>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={copyInviteCode}
            disabled={!currentGroup?.inviteCode}
            className="px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs flex items-center gap-1 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Copy invite code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
            title="Join another group"
          >
            Join
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 text-xs"
            title="Create new group"
          >
            <Plus size={12} />
            New
          </button>
        </div>
      </div>
      
      {showJoinModal && <JoinGroupModal onClose={() => setShowJoinModal(false)} />}
      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}
