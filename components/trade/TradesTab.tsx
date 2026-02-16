'use client';

import { RefreshCw, X } from 'lucide-react';
import { useTradeApp } from './TradeAppContext';
import { calculateOptimalTrades } from '@/lib/algorithm';
import { exportTradesToFile } from '@/lib/utils';

export default function TradesTab() {
  const { 
    currentUser, 
    currentGroup, 
    games, 
    wants, 
    users,
    trades,
    setTrades
  } = useTradeApp();
  
  const isAdmin = currentGroup.adminIds?.includes(currentUser.id) || currentUser.globalAdmin;
  
  const calculateTrades = () => {
    console.log('Calculating trades for group:', currentGroup.name);
    const result = calculateOptimalTrades(games, wants, users, currentGroup.id);
    setTrades(result);
  };
  
  const clearTrades = () => {
    if (confirm('Clear all calculated trades and start over?')) {
      setTrades([]);
    }
  };
  
  const exportTrades = () => {
    if (trades.length === 0) return;
    exportTradesToFile(trades, currentGroup.name);
  };
  
  // Sort trades: user's trades first
  const sortedTrades = [...trades].sort((a, b) => {
    const aHasUser = a.involvedUserIds.includes(currentUser.id);
    const bHasUser = b.involvedUserIds.includes(currentUser.id);
    if (aHasUser && !bHasUser) return -1;
    if (!aHasUser && bHasUser) return 1;
    return 0;
  });
  
  // Calculate user's trade summary
  const myTrades = trades.filter(t => t.involvedUserIds.includes(currentUser.id));
  const giving: Array<{game: string, to: string}> = [];
  const getting: Array<{game: string, from: string}> = [];
  
  myTrades.forEach(trade => {
    trade.chain.forEach(step => {
      const fromUser = users.find(u => u.name === step.from);
      const toUser = users.find(u => u.name === step.to);
      
      if (fromUser?.id === currentUser.id) {
        giving.push({ game: step.fromGame, to: step.to });
      }
      
      if (toUser?.id === currentUser.id) {
        getting.push({ game: step.fromGame, from: step.from });
      }
    });
  });
  
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Calculated Trade Chains</h2>
          <p className="text-gray-600 mt-1">For: {currentGroup.name} ({currentGroup.memberIds.length} members)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportTrades}
            disabled={trades.length === 0}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium ${
              trades.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
          {isAdmin && (
            <>
              {trades.length > 0 && (
                <button
                  onClick={clearTrades}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <X size={20} />
                  Clear Trades
                </button>
              )}
              <button
                onClick={calculateTrades}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <RefreshCw size={20} />
                {trades.length > 0 ? 'Recalculate' : 'Calculate Optimal Trades'}
              </button>
            </>
          )}
          {!isAdmin && (
            <div className="px-6 py-3 bg-gray-200 text-gray-600 rounded-lg flex items-center gap-2 font-medium cursor-not-allowed" title="Only group admins can calculate trades">
              <RefreshCw size={20} />
              Calculate Optimal Trades (Admin Only)
            </div>
          )}
        </div>
      </div>
      
      {/* Results */}
      {trades.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">No trades calculated yet.</p>
          {isAdmin ? (
            <p className="text-gray-500 mt-2">Click &quot;Calculate Optimal Trades&quot; to find the best matches.</p>
          ) : (
            <p className="text-gray-500 mt-2">Ask a group admin to calculate trades.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* User's summary */}
          {myTrades.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-6 shadow-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">🎯</span>
                Your Trade Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-xl">📤</span>
                    You&apos;re Giving Away:
                  </h4>
                  <ul className="space-y-2">
                    {giving.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-200 mt-1">•</span>
                        <div>
                          <span className="text-lg font-semibold">{item.game}</span>
                          <span className="text-blue-100 text-sm ml-2">→ to {item.to}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-xl">📥</span>
                    You&apos;re Getting:
                  </h4>
                  <ul className="space-y-2">
                    {getting.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-200 mt-1">•</span>
                        <div>
                          <span className="text-lg font-semibold">{item.game}</span>
                          <span className="text-green-100 text-sm ml-2">← from {item.from}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* All trades */}
          <div className="space-y-4">
            {sortedTrades.map(trade => {
              const isUserTrade = trade.involvedUserIds.includes(currentUser.id);
              
              return (
                <div
                  key={trade.id}
                  className={`rounded-lg p-6 shadow-md ${
                    isUserTrade 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  {isUserTrade && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white animate-pulse">
                        YOUR TRADE
                      </span>
                    </div>
                  )}
                  
                  <h4 className="font-bold text-lg mb-3">
                    {trade.type === 'direct' ? '🔄 Direct Swap' : '🔁 Circular Trade'} (Trade #{trade.id})
                  </h4>
                  
                  <div className="space-y-2">
                    {trade.chain.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-700">
                        <span className="font-medium">{step.from}</span>
                        <span>gives</span>
                        <span className="font-semibold text-gray-900">{step.fromGame}</span>
                        <span>→</span>
                        <span className="font-medium">{step.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
