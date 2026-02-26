'use client';

import { User as SupabaseUser } from '@supabase/supabase-js';
import { TradeAppProvider, useTradeApp } from './trade/TradeAppContext';
import GroupSelector from './trade/GroupSelector';
import ReadyStatusToggle from './trade/ReadyStatusToggle';
import MyGamesTab from './trade/MyGamesTab';
import BrowseGamesTab from './trade/BrowseGamesTab';
import AdminTab from './trade/AdminTab';
import TradesTab from './trade/TradesTab';

interface MathTradeAppProps {
  user?: SupabaseUser;
}

function MathTradeAppContent() {
  const { activeTab, setActiveTab, currentUser, currentGroup, supabaseUser, games, wants, useMockGames, loading } = useTradeApp();
  
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
          {/* Header with Group Selector */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              {/* Left: Group Name / App Title */}
              <div>
                {currentGroup ? (
                  <>
                    <p className="text-sm text-gray-500 mb-1">Welcome to</p>
                    <h1 className="text-3xl font-bold text-gray-800">{currentGroup.name}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentGroup.memberIds.length} {currentGroup.memberIds.length === 1 ? 'member' : 'members'}
                      {currentGroup.inviteCode && ` • Code: ${currentGroup.inviteCode}`}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Board Game Math Trade</h1>
                    <p className="text-gray-600">Specify acceptable trades, algorithm finds optimal matches</p>
                  </>
                )}
              </div>
              
              {/* Right: Group Selector */}
              <div className="flex flex-col items-end gap-2">
                <GroupSelector />
              </div>
            </div>
          </div>
          
          {/* Only show tabs if user is in a group */}
          {currentGroup && (
            <div className="bg-white rounded-lg shadow-lg mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex items-center justify-between">
                  <div className="flex">
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
                  </div>
                  
                  {/* Ready Status Toggle on the right */}
                  <div className="px-4">
                    <ReadyStatusToggle
                      userId={supabaseUser?.id || String(currentUser.id)}
                      groupId={currentGroup.id}
                      myGames={games.filter(g => 
                        String(g.userId) === String(currentUser.id) && 
                        String(g.groupId) === String(currentGroup.id)
                      )}
                      wants={wants}
                      useMockGames={useMockGames}
                    />
                  </div>
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
