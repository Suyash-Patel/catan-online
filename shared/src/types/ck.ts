// ============================================================
// Cities & Knights Expansion Types
// ============================================================

// --- Knight Levels ---

export enum KnightLevel {
  BASIC = 1,
  STRONG = 2,
  MIGHTY = 3,
}

// --- Improvement Tracks ---

export enum ImprovementTrack {
  TRADE = 'TRADE',       // Uses Cloth commodity
  POLITICS = 'POLITICS', // Uses Coin commodity
  SCIENCE = 'SCIENCE',   // Uses Paper commodity
}

// --- Progress Card Types (all 18 unique cards) ---

export enum ProgressCardType {
  // Science (Green) - 10 unique types, 18 total cards
  ALCHEMIST = 'ALCHEMIST',
  CRANE = 'CRANE',
  ENGINEER = 'ENGINEER',
  INVENTOR = 'INVENTOR',
  IRRIGATION = 'IRRIGATION',
  MEDICINE = 'MEDICINE',
  MINING = 'MINING',
  PRINTER = 'PRINTER',           // VP card
  ROAD_BUILDING = 'ROAD_BUILDING',
  SMITH = 'SMITH',

  // Politics (Blue) - 9 unique types, 18 total cards
  BISHOP = 'BISHOP',
  CONSTITUTION = 'CONSTITUTION', // VP card
  DESERTER = 'DESERTER',
  DIPLOMAT = 'DIPLOMAT',
  INTRIGUE = 'INTRIGUE',
  SABOTEUR = 'SABOTEUR',
  SPY = 'SPY',
  WARLORD = 'WARLORD',
  WEDDING = 'WEDDING',

  // Trade (Yellow) - 6 unique types, 18 total cards
  COMMERCIAL_HARBOR = 'COMMERCIAL_HARBOR',
  MASTER_MERCHANT = 'MASTER_MERCHANT',
  MERCHANT = 'MERCHANT',
  MERCHANT_FLEET = 'MERCHANT_FLEET',
  RESOURCE_MONOPOLY = 'RESOURCE_MONOPOLY',
  TRADE_MONOPOLY = 'TRADE_MONOPOLY',
}

// Set of VP progress cards that are revealed immediately and can't be stolen
export const VP_PROGRESS_CARDS: ReadonlySet<ProgressCardType> = new Set([
  ProgressCardType.PRINTER,
  ProgressCardType.CONSTITUTION,
]);

// --- Barbarian State ---

export interface BarbarianState {
  position: number;       // 0-7 on the track (7 = attack!)
  trackLength: number;    // 7
  hasAttackedOnce: boolean; // First attack unlocks the robber
}

// --- Metropolis ---

export interface Metropolis {
  track: ImprovementTrack;
  playerId: string;
  vertexKey: string;      // Which city has the metropolis
  isLocked: boolean;      // true when any player reaches level 5 on this track
}

// --- Merchant ---

export interface MerchantState {
  playerId: string;       // Who controls the merchant
  hexKey: string;         // Which hex the merchant is on
}

// --- Progress Card Definitions ---

export interface ProgressCardDefinition {
  type: ProgressCardType;
  deck: ImprovementTrack;
  count: number;          // How many copies in the deck
  isVP: boolean;          // Is this an immediate VP card?
  description: string;    // Human-readable effect description
}
