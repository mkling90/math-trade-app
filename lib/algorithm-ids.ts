import { Game, Want, User, Trade, TradeStep } from './types';

/**
 * Deterministic Top Trading Cycles (TTC) Algorithm
 * 
 * Key concept: ITEMS are nodes, not users
 * - Each item is an independent trading agent
 * - Each item has a preference list of acceptable items
 * - Users with multiple items have multiple independent agents
 */

interface Item {
  item_id: string;
  owner_user_id: number;
  preference_list: string[];
}

interface RoundDebug {
  round: number;
  edges: Record<string, string>;
  cycles: string[][];
}

/**
 * Main TTC Algorithm
 */
export const calculateOptimalTrades = (
  games: Game[],
  wants: Want[],
  users: User[],
  groupId: number
): Trade[] => {
  console.log('=== TOP TRADING CYCLES (Item-Based) ===');
  
  const groupGames = games.filter(g => g.groupId === groupId);
  
  // Convert to item format
  const items: Item[] = groupGames.map(game => {
    // Build preference list for this item
    const preference_list: string[] = [];
    const itemWants = wants
      .filter(w => w.myGameId === game.id)
      .sort((a, b) => a.rank - b.rank); // CRITICAL: Sort by rank (1 = most preferred)
    
    itemWants.forEach(want => {
      const targetGame = groupGames.find(g => g.id === want.acceptGameId);
      // Can accept items from other owners (not your own items)
      if (targetGame && targetGame.userId !== game.userId) {
        preference_list.push(`item_${want.acceptGameId}`);
      }
    });
    
    return {
      item_id: `item_${game.id}`,
      owner_user_id: game.userId,
      preference_list
    };
  });
  
  console.log('Items:', items.map(i => `${i.item_id} (owner:${i.owner_user_id}, wants:[${i.preference_list.join(',')}])`));
  
  // Validate preference lists
  console.log('\n=== VALIDATING PREFERENCE LISTS ===');
  items.forEach(item => {
    const gameId = parseInt(item.item_id.replace('item_', ''));
    const game = groupGames.find(g => g.id === gameId);
    const owner = users.find(u => u.id === item.owner_user_id);
    console.log(`${item.item_id} (${game?.name}) owned by ${owner?.name}:`);
    console.log(`  Wants: ${item.preference_list.join(' > ') || 'NOTHING'}`);
    
    // Show the actual game names
    if (item.preference_list.length > 0) {
      item.preference_list.forEach((prefId, idx) => {
        const prefGameId = parseInt(prefId.replace('item_', ''));
        const prefGame = groupGames.find(g => g.id === prefGameId);
        console.log(`    ${idx + 1}. ${prefGame?.name} (id:${prefGameId})`);
      });
    }
  });
  
  // Run TTC
  const result = runTTC(items, groupGames, users);
  
  // Convert to Trade format
  return convertToTrades(result, groupGames, users);
};

/**
 * Core TTC Algorithm
 */
function runTTC(items: Item[], games: Game[], users: User[]): { allocation: Record<string, string>, debug: RoundDebug[] } {
  const allocation: Record<string, string> = {};
  const debug: RoundDebug[] = [];
  
  // Active items
  let activeItems = new Set(items.map(i => i.item_id));
  const itemMap = new Map(items.map(i => [i.item_id, i]));
  
  let round = 1;
  
  while (activeItems.size > 0) {
    console.log(`\n=== ROUND ${round} ===`);
    console.log(`Active items: ${Array.from(activeItems).sort().join(', ')}`);
    
    // STEP 1: Build directed graph
    const edges: Record<string, string> = {};
    
    // Sort items lexicographically
    const sortedActiveItems = Array.from(activeItems).sort();
    
    for (const itemId of sortedActiveItems) {
      const item = itemMap.get(itemId)!;
      
      // Find first acceptable item that is still active
      let pointsTo: string | null = null;
      
      for (const preferredItemId of item.preference_list) {
        if (activeItems.has(preferredItemId)) {
          pointsTo = preferredItemId;
          break;
        }
      }
      
      // If no acceptable item found, point to self
      if (pointsTo === null) {
        pointsTo = itemId;
      }
      
      edges[itemId] = pointsTo;
      console.log(`  ${itemId} -> ${pointsTo}`);
    }
    
    // STEP 2: Detect all cycles
    const cycles: string[][] = [];
    const globalVisited = new Set<string>();
    
    for (const startItem of sortedActiveItems) {
      if (globalVisited.has(startItem)) {
        continue;
      }
      
      // Pointer chasing
      const path: string[] = [];
      const pathSet = new Set<string>();
      let current = startItem;
      
      while (true) {
        // Found a cycle
        if (pathSet.has(current)) {
          const cycleStartIdx = path.indexOf(current);
          const cycle = path.slice(cycleStartIdx);
          cycles.push(cycle);
          
          // Mark all in path as globally visited
          path.forEach(node => globalVisited.add(node));
          break;
        }
        
        // Hit a globally visited node
        if (globalVisited.has(current)) {
          path.forEach(node => globalVisited.add(node));
          break;
        }
        
        path.push(current);
        pathSet.add(current);
        current = edges[current];
      }
    }
    
    console.log(`  Found ${cycles.length} cycle(s):`);
    cycles.forEach((cycle, i) => {
      console.log(`    Cycle ${i + 1}: ${cycle.join(' -> ')} -> ${cycle[0]}`);
      
      // VALIDATE: Check if each item in the cycle actually wants what they're getting
      console.log(`    Validating cycle ${i + 1}:`);
      let isValid = true;
      for (let j = 0; j < cycle.length; j++) {
        const givingItemId = cycle[j];
        const receivingItemId = edges[givingItemId]; // What this item points to
        
        const givingGameId = parseInt(givingItemId.replace('item_', ''));
        const receivingGameId = parseInt(receivingItemId.replace('item_', ''));
        
        const givingGame = games.find(g => g.id === givingGameId);
        const receivingGame = games.find(g => g.id === receivingGameId);
        
        const item = itemMap.get(givingItemId);
        if (!item) {
          console.log(`      ERROR: Item ${givingItemId} not found in itemMap`);
          continue;
        }
        const wantsReceivingItem = item.preference_list.includes(receivingItemId);
        
        console.log(`      ${givingGame?.name} -> ${receivingGame?.name}: ${wantsReceivingItem ? '✓' : '✗ DOES NOT WANT'}`);
        
        if (!wantsReceivingItem && givingItemId !== receivingItemId) {
          isValid = false;
        }
      }
      
      if (!isValid) {
        console.log(`    ⚠️  WARNING: Cycle ${i + 1} contains items that don't want what they're getting!`);
      }
    });
    
    // STEP 3: Execute all cycles simultaneously
    for (const cycle of cycles) {
      for (let i = 0; i < cycle.length; i++) {
        const item = cycle[i];
        const pointsTo = edges[item];
        
        allocation[item] = pointsTo;
        console.log(`    ${item} receives ${pointsTo}`);
      }
    }
    
    // Remove all items in all cycles
    for (const cycle of cycles) {
      cycle.forEach(item => activeItems.delete(item));
    }
    
    debug.push({ round, edges, cycles });
    round++;
  }
  
  console.log('\n=== ALLOCATION COMPLETE ===');
  console.log('Final allocation:', allocation);
  
  return { allocation, debug };
}

/**
 * Convert allocation to Trade format
 * 
 * allocation[itemX] = itemY means:
 * - The owner of itemX receives itemY
 * - Therefore, the owner of itemY gives itemY to the owner of itemX
 */
function convertToTrades(
  result: { allocation: Record<string, string>, debug: RoundDebug[] },
  games: Game[],
  users: User[]
): Trade[] {
  const trades: Trade[] = [];
  
  // Group by cycles
  result.debug.forEach(roundInfo => {
    roundInfo.cycles.forEach(cycle => {
      if (cycle.length === 1 && cycle[0] === result.allocation[cycle[0]]) {
        // Self-loop, no trade
        console.log(`Skipping self-loop: ${cycle[0]}`);
        return;
      }
      
      // Build trade chain from allocation
      // For each item in the cycle, find what it receives
      const chain: TradeStep[] = [];
      const involvedUserIds: number[] = [];
      
      // Create a map of who gives what to whom
      const giversMap = new Map<string, string>(); // itemReceived -> itemGiving
      
      cycle.forEach(item => {
        const receives = result.allocation[item];
        giversMap.set(receives, item);
      });
      
      // Build chain: for each item, show who gives it
      cycle.forEach(itemId => {
        const gameId = parseInt(itemId.replace('item_', ''));
        const game = games.find(g => g.id === gameId)!;
        const owner = users.find(u => u.id === game.userId)!;
        
        const receivesItemId = result.allocation[itemId];
        const receivesGameId = parseInt(receivesItemId.replace('item_', ''));
        const receivesGame = games.find(g => g.id === receivesGameId)!;
        const giver = users.find(u => u.id === receivesGame.userId)!;
        
        // giver gives receivesGame to owner
        chain.push({
          from: giver.name,
          fromGame: receivesGame.name,
          to: owner.name,
          toGame: game.name
        });
        
        if (!involvedUserIds.includes(owner.id)) {
          involvedUserIds.push(owner.id);
        }
        if (!involvedUserIds.includes(giver.id)) {
          involvedUserIds.push(giver.id);
        }
      });
      
      trades.push({
        id: trades.length + 1,
        chain,
        type: cycle.length === 2 ? 'direct' : 'circular',
        involvedUserIds
      });
    });
  });
  
  console.log(`\n=== ${trades.length} TRADES CREATED ===`);
  return trades;
}