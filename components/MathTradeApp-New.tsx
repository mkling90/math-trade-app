'use client';

import { User as SupabaseUser } from '@supabase/supabase-js';
import { TradeAppProvider, useTradeApp } from './trade/TradeAppContext';
import GroupSelector from './trade/GroupSelector';
import MyGamesTab from './trade/MyGamesTab';
import BrowseGamesTab from './trade/BrowseGamesTab';
import AdminTab from './trade/AdminTab';
import TradesTab from './trade/TradesTab';

interface MathTradeAppProps {
  user?: SupabaseUser;
}

function MathTradeAppContent() {
  const { activeTab, setActiveTab, currentUser, currentGroup, useMockGames, loading } = useTradeApp();
  
  const tabs = [
    { id: 'my-games', label: 'My Games', component: MyGamesTab },
    { id: 'browse', label: 'Browse Other Users', component: BrowseGamesTab },
    { id: 'admin', label: 'Admin', component: AdminTab },
    { id: 'trades', label: 'Calculated Trades', component: TradesTab },
  ];
  
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || MyGamesTab;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Debug banner - only show when using mock data */}
      {useMockGames && (
        <div className="text-center py-1 text-xs font-mono bg-yellow-100 text-yellow-800">
          ⚠️ USING MOCK GAME DATA
        </div>
      )}
      
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Board Game Math Trade</h1>
                <p className="text-gray-600">Specify acceptable trades, algorithm finds optimal matches</p>
              </div>
              
              {/* User switcher - only in mock mode */}
              {useMockGames && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <select 
                    value={currentUser.id}
                    onChange={(e) => {
                      // This would be handled by context
                      console.log('User switching not yet implemented in new structure');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={currentUser.id}>{currentUser.name}</option>
                  </select>
                  {currentUser.globalAdmin && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                      GLOBAL ADMIN
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Group Selector */}
            <GroupSelector />
          </div>
          
          {/* Only show tabs if user is in a group */}
          {currentGroup && (
            <div className="bg-white rounded-lg shadow-lg mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                <ActiveComponent />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MathTradeApp({ user }: MathTradeAppProps) {
  return (
    <TradeAppProvider supabaseUser={user}>
      <MathTradeAppContent />
    </TradeAppProvider>
  );
}
