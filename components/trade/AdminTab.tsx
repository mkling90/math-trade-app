'use client';

import { Users } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';

export default function AdminTab() {
  const { currentUser, currentGroup, games, users } = useTradeApp();
  
  const isAdmin = currentGroup.adminIds?.includes(currentUser.id) || currentUser.globalAdmin;
  
  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only group admins can access this tab.</p>
      </div>
    );
  }
  
  const members = users.filter(u => currentGroup.memberIds.includes(u.id));
  
  const makeAdmin = (userId: number) => {
    // TODO: Implement with Supabase
    alert(`Make ${users.find(u => u.id === userId)?.name} admin`);
  };
  
  const removeAdmin = (userId: number) => {
    // TODO: Implement with Supabase
    const adminCount = currentGroup.adminIds?.length || 0;
    if (adminCount <= 1) {
      alert('Cannot remove the last admin');
      return;
    }
    alert(`Remove ${users.find(u => u.id === userId)?.name} as admin`);
  };
  
  const removeMember = (userId: number) => {
    // TODO: Implement with Supabase
    alert(`Remove ${users.find(u => u.id === userId)?.name} from group`);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Group Administration</h3>
        <p className="text-sm text-gray-600">Manage members and permissions for {currentGroup.name}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={18} />
            Group Members ({members.length})
          </h4>
        </div>
        
        <div className="divide-y">
          {members.map(member => {
            const memberGames = games.filter(g => g.userId === member.id && g.groupId === currentGroup.id);
            const isMemberAdmin = currentGroup.adminIds?.includes(member.id);
            const isCurrentUser = member.id === currentUser.id;
            
            return (
              <div key={member.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{member.name}</p>
                    {member.globalAdmin && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold">
                        GLOBAL ADMIN
                      </span>
                    )}
                    {isMemberAdmin && !member.globalAdmin && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        ADMIN
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{memberGames.length} games</p>
                </div>
                
                <div className="flex gap-2">
                  {!isMemberAdmin && !member.globalAdmin && (
                    <button
                      onClick={() => makeAdmin(member.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Make Admin
                    </button>
                  )}
                  
                  {isMemberAdmin && !member.globalAdmin && !isCurrentUser && (
                    <button
                      onClick={() => removeAdmin(member.id)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Remove Admin
                    </button>
                  )}
                  
                  {!isCurrentUser && !member.globalAdmin && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Remove from Group
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Admin functions for database mode are coming soon. Currently, admin actions work in mock mode only.
        </p>
      </div>
    </div>
  );
}
