import { User, Group, Game, Want } from './types';

/**
 * Mock user data for development and testing
 * In production, this will come from Supabase authentication
 */
export const INITIAL_USERS: User[] = [
  { id: 1, name: 'Alex', globalAdmin: true }, // Global admin can manage all groups
  { id: 2, name: 'Jordan' },
  { id: 3, name: 'Sam' },
  { id: 4, name: 'Taylor' },
  { id: 5, name: 'Morgan' },
  { id: 6, name: 'Casey' },
  { id: 7, name: 'Riley' },
  { id: 8, name: 'Jamie' },
];

/**
 * Mock group data for development and testing
 * In production, this will come from Supabase database
 */
export const INITIAL_GROUPS: Group[] = [
  {
    id: 1,
    name: 'Philly Board Game Meetup - March 2025',
    memberIds: [1, 2, 3, 5, 6, 7],
    adminIds: [1],
    inviteCode: 'PHILLY2025',
    isPublic: true
  },
  {
    id: 2,
    name: 'College Gaming Club Trade',
    memberIds: [1, 4, 8],
    adminIds: [1, 4],
    inviteCode: 'COLLEGE99',
    isPublic: false
  },
];

/**
 * Mock game data for development and testing
 * In production, this will come from Supabase database
 * 
 * Group 1: Philly Meetup - 6 users with multiple games each
 * Group 2: College Club - 3 users with varied preferences
 */
export const INITIAL_GAMES: Game[] = [
  // Group 1: Alex's games
  { id: 1, userId: 1, groupId: 1, name: 'Catan', condition: 'Like New', comment: 'All pieces included, played twice' },
  { id: 2, userId: 1, groupId: 1, name: 'Ticket to Ride', condition: 'Good', comment: 'Base game only' },
  { id: 3, userId: 1, groupId: 1, name: 'Codenames', condition: 'Excellent', comment: 'Party favorite' },
  
  // Group 1: Jordan's games
  { id: 4, userId: 2, groupId: 1, name: 'Pandemic', condition: 'Like New', comment: 'Complete with all expansions' },
  { id: 5, userId: 2, groupId: 1, name: 'Azul', condition: 'Excellent', comment: 'Beautiful tiles' },
  { id: 6, userId: 2, groupId: 1, name: '7 Wonders', condition: 'Good', comment: 'Leaders expansion included' },
  
  // Group 1: Sam's games
  { id: 7, userId: 3, groupId: 1, name: 'Wingspan', condition: 'Good', comment: 'European expansion included' },
  { id: 8, userId: 3, groupId: 1, name: 'Splendor', condition: 'Like New', comment: 'Chips in mint condition' },
  
  // Group 1: Morgan's games
  { id: 9, userId: 5, groupId: 1, name: 'Dominion', condition: 'Excellent', comment: 'Base set + Intrigue' },
  { id: 10, userId: 5, groupId: 1, name: 'Carcassonne', condition: 'Good', comment: 'Classic edition' },
  { id: 11, userId: 5, groupId: 1, name: 'Kingdomino', condition: 'Like New', comment: 'Great 2-player' },
  
  // Group 1: Casey's games
  { id: 12, userId: 6, groupId: 1, name: 'Terraforming Mars', condition: 'Good', comment: 'Well-loved, complete' },
  { id: 13, userId: 6, groupId: 1, name: 'Agricola', condition: 'Excellent', comment: 'Heavy strategy' },
  
  // Group 1: Riley's games
  { id: 14, userId: 7, groupId: 1, name: 'Scythe', condition: 'Like New', comment: 'Played once, amazing' },
  { id: 15, userId: 7, groupId: 1, name: 'Everdell', condition: 'Good', comment: 'Beautiful artwork' },
  { id: 16, userId: 7, groupId: 1, name: 'Splendor', condition: 'Excellent', comment: 'Duplicate - happy to trade' },
  
  // Group 2: Alex's games
  { id: 17, userId: 1, groupId: 2, name: 'Risk', condition: 'Good', comment: 'Some wear on box' },
  
  // Group 2: Taylor's games
  { id: 18, userId: 4, groupId: 2, name: 'Monopoly', condition: 'Excellent', comment: 'Classic edition' },
  { id: 19, userId: 4, groupId: 2, name: 'Clue', condition: 'Good', comment: 'All cards present' },
  
  // Group 2: Jamie's games
  { id: 20, userId: 8, groupId: 2, name: 'Scrabble', condition: 'Like New', comment: 'Deluxe edition' },
  { id: 21, userId: 8, groupId: 2, name: 'Uno', condition: 'Good', comment: 'Classic fun' },
];

/**
 * Mock want/preference data for development and testing
 * In production, this will come from Supabase database
 * 
 * IMPORTANT: rank determines preference order (1 = most preferred)
 * 
 * Test scenarios included:
 * - Multiple people wanting the same game (Splendor, Wingspan)
 * - Users with multiple games having different preferences for each
 * - Some games with no wants (will keep their own)
 * - Circular trade opportunities
 * - Direct swap opportunities
 */
export const INITIAL_WANTS: Want[] = [
  // === GROUP 1: Philly Meetup ===
  
  // Alex's preferences (owns: Catan, Ticket to Ride, Codenames)
  { myGameId: 1, acceptGameId: 4, rank: 1 },  // For Catan: wants Pandemic (1st)
  { myGameId: 1, acceptGameId: 7, rank: 2 },  // For Catan: wants Wingspan (2nd)
  { myGameId: 1, acceptGameId: 12, rank: 3 }, // For Catan: wants Terraforming Mars (3rd)
  
  { myGameId: 2, acceptGameId: 8, rank: 1 },  // For Ticket to Ride: wants Splendor (1st)
  { myGameId: 2, acceptGameId: 10, rank: 2 }, // For Ticket to Ride: wants Carcassonne (2nd)
  
  { myGameId: 3, acceptGameId: 11, rank: 1 }, // For Codenames: wants Kingdomino (1st)
  
  // Jordan's preferences (owns: Pandemic, Azul, 7 Wonders)
  { myGameId: 4, acceptGameId: 2, rank: 1 },  // For Pandemic: wants Ticket to Ride (1st) - creates potential swap with Alex
  { myGameId: 4, acceptGameId: 14, rank: 2 }, // For Pandemic: wants Scythe (2nd)
  
  { myGameId: 5, acceptGameId: 1, rank: 1 },  // For Azul: wants Catan (1st)
  { myGameId: 5, acceptGameId: 9, rank: 2 },  // For Azul: wants Dominion (2nd)
  
  { myGameId: 6, acceptGameId: 13, rank: 1 }, // For 7 Wonders: wants Agricola (1st)
  { myGameId: 6, acceptGameId: 15, rank: 2 }, // For 7 Wonders: wants Everdell (2nd)
  
  // Sam's preferences (owns: Wingspan, Splendor)
  { myGameId: 7, acceptGameId: 5, rank: 1 },  // For Wingspan: wants Azul (1st)
  { myGameId: 7, acceptGameId: 9, rank: 2 },  // For Wingspan: wants Dominion (2nd)
  
  { myGameId: 8, acceptGameId: 1, rank: 1 },  // For Splendor: wants Catan (1st) - multiple people want Splendor!
  { myGameId: 8, acceptGameId: 10, rank: 2 }, // For Splendor: wants Carcassonne (2nd)
  
  // Morgan's preferences (owns: Dominion, Carcassonne, Kingdomino)
  { myGameId: 9, acceptGameId: 12, rank: 1 }, // For Dominion: wants Terraforming Mars (1st)
  { myGameId: 9, acceptGameId: 7, rank: 2 },  // For Dominion: wants Wingspan (2nd) - another person wants Wingspan
  
  { myGameId: 10, acceptGameId: 8, rank: 1 }, // For Carcassonne: wants Splendor (1st) - everyone wants Splendor!
  { myGameId: 10, acceptGameId: 16, rank: 2 },// For Carcassonne: wants Splendor (Riley's) (2nd)
  
  { myGameId: 11, acceptGameId: 3, rank: 1 }, // For Kingdomino: wants Codenames (1st) - creates swap with Alex
  
  // Casey's preferences (owns: Terraforming Mars, Agricola)
  { myGameId: 12, acceptGameId: 14, rank: 1 },// For Terraforming Mars: wants Scythe (1st)
  { myGameId: 12, acceptGameId: 4, rank: 2 }, // For Terraforming Mars: wants Pandemic (2nd)
  
  { myGameId: 13, acceptGameId: 6, rank: 1 }, // For Agricola: wants 7 Wonders (1st) - creates swap with Jordan
  
  // Riley's preferences (owns: Scythe, Everdell, Splendor duplicate)
  { myGameId: 14, acceptGameId: 12, rank: 1 },// For Scythe: wants Terraforming Mars (1st) - creates swap with Casey
  { myGameId: 14, acceptGameId: 4, rank: 2 }, // For Scythe: wants Pandemic (2nd)
  
  { myGameId: 15, acceptGameId: 6, rank: 1 }, // For Everdell: wants 7 Wonders (1st)
  { myGameId: 15, acceptGameId: 5, rank: 2 }, // For Everdell: wants Azul (2nd)
  
  { myGameId: 16, acceptGameId: 2, rank: 1 }, // For Splendor(dup): wants Ticket to Ride (1st)
  { myGameId: 16, acceptGameId: 1, rank: 2 }, // For Splendor(dup): wants Catan (2nd)
  
  // === GROUP 2: College Club ===
  
  { myGameId: 17, acceptGameId: 18, rank: 1 }, // Alex: for Risk, accept Monopoly (1st choice)
  { myGameId: 17, acceptGameId: 20, rank: 2 }, // Alex: for Risk, accept Scrabble (2nd choice)
  
  { myGameId: 18, acceptGameId: 17, rank: 1 }, // Taylor: for Monopoly, accept Risk (1st choice) - creates direct swap
  { myGameId: 19, acceptGameId: 20, rank: 1 }, // Taylor: for Clue, accept Scrabble (1st choice)
  
  { myGameId: 20, acceptGameId: 19, rank: 1 }, // Jamie: for Scrabble, accept Clue (1st choice) - creates swap with Taylor
  { myGameId: 21, acceptGameId: 17, rank: 1 }, // Jamie: for Uno, accept Risk (1st choice)
];
