'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import { supabase } from '@/lib/supabase';

interface MemberStatus {
  isReady: boolean;
  readyAt: string | null;
}

export default function MembersTab() {
  const { currentUser, currentGroup, users, games, wants, useMockGames } = useTradeApp();
  const [memberStatuses, setMemberStatuses] = useState<Map<string, MemberStatus>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGroup || useMockGames) {
      setLoading(false);
      return;
    }

    async function fetchStatuses() {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, is_ready, ready_at')
        .eq('group_id', currentGroup!.id);

      if (error) {
        console.error('Error fetching member statuses:', error);
      } else if (data) {
        setMemberStatuses(new Map(data.map(m => [m.user_id, { isReady: m.is_ready || false, readyAt: m.ready_at }])));
      }
      setLoading(false);
    }

    fetchStatuses();
  }, [currentGroup?.id, useMockGames]);

  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No group selected.</p>
      </div>
    );
  }

  const members = users.filter(u => currentGroup.memberIds.some(id => String(id) === String(u.id)));
  const readyCount = useMockGames
    ? 0
    : members.filter(m => memberStatuses.get(String(m.id))?.isReady).length;
  const allReady = readyCount === members.length && members.length > 0;

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-4 border-2 transition-all ${allReady ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Group Readiness</h3>
          <span className={`text-sm font-medium ${allReady ? 'text-green-700' : 'text-blue-700'}`}>
            {readyCount} / {members.length} ready
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${allReady ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: members.length > 0 ? `${(readyCount / members.length) * 100}%` : '0%' }}
          />
        </div>
        {allReady && (
          <p className="text-sm text-green-700 mt-2 font-medium">All members are ready! Trades can be calculated.</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => {
            const status = memberStatuses.get(String(member.id));
            const memberGames = games.filter(
              g => String(g.userId) === String(member.id) && String(g.groupId) === String(currentGroup.id)
            );
            const gamesWithWants = memberGames.filter(g => wants.some(w => String(w.myGameId) === String(g.id)));
            const isCurrentUser = String(member.id) === String(currentUser.id);

            return (
              <div
                key={member.id}
                className={`rounded-lg border-2 p-4 flex items-center justify-between transition-all ${
                  status?.isReady ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {status?.isReady ? (
                    <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                  ) : (
                    <Circle className="text-gray-300 flex-shrink-0" size={24} />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      {isCurrentUser && <span className="text-xs text-gray-500">(You)</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-sm text-gray-600">
                        {memberGames.length} {memberGames.length === 1 ? 'game' : 'games'}
                      </span>
                      {memberGames.length > 0 && (
                        <span className={`text-sm ${gamesWithWants.length === memberGames.length ? 'text-green-600' : 'text-gray-500'}`}>
                          {gamesWithWants.length}/{memberGames.length} wants set
                        </span>
                      )}
                      {status?.isReady && status.readyAt && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(status.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {status?.isReady ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex-shrink-0">
                    Ready
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm flex-shrink-0">
                    Not ready
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
