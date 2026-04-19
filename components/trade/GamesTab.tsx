'use client';

import { useState } from 'react';
import { useTradeApp } from './TradeAppContext';

const CONDITION_STYLES: Record<string, { badge: string; label: string }> = {
  'New In Shrink': { badge: 'bg-green-100 text-green-800 border-green-200', label: 'New In Shrink' },
  'Excellent':     { badge: 'bg-blue-100 text-blue-800 border-blue-200',    label: 'Excellent' },
  'Good':          { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Good' },
  'Fair':          { badge: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Fair' },
};

const CONDITION_ORDER = ['New In Shrink', 'Excellent', 'Good', 'Fair'];

export default function GamesTab() {
  const { currentGroup, games, users } = useTradeApp();
  const [sortBy, setSortBy] = useState<'name' | 'condition' | 'owner'>('name');
  const [filterCondition, setFilterCondition] = useState<string>('all');

  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No group selected.</p>
      </div>
    );
  }

  const groupGames = games.filter(g => String(g.groupId) === String(currentGroup.id));

  const filtered = filterCondition === 'all'
    ? groupGames
    : groupGames.filter(g => g.condition === filterCondition);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'condition') return CONDITION_ORDER.indexOf(a.condition) - CONDITION_ORDER.indexOf(b.condition);
    if (sortBy === 'owner') {
      const ownerA = users.find(u => String(u.id) === String(a.userId))?.name ?? '';
      const ownerB = users.find(u => String(u.id) === String(b.userId))?.name ?? '';
      return ownerA.localeCompare(ownerB);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {filtered.length} {filtered.length === 1 ? 'game' : 'games'}
          {filterCondition !== 'all' && ` · ${filterCondition}`}
        </p>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">Condition</label>
            <select
              value={filterCondition}
              onChange={e => setFilterCondition(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All</option>
              {CONDITION_ORDER.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Sort</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="condition">Condition</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No games found.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {sorted.map(game => {
            const owner = users.find(u => String(u.id) === String(game.userId));
            const style = CONDITION_STYLES[game.condition] ?? { badge: 'bg-gray-100 text-gray-700 border-gray-200', label: game.condition };

            return (
              <div key={game.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{game.name}</p>
                  <p className="text-sm text-gray-500">{owner?.name ?? 'Unknown'}</p>
                  {game.comment && (
                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">&quot;{game.comment}&quot;</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${style.badge}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
