// ============================================================
// Card Definitions — Development Cards & Progress Cards
// ============================================================

import { DevCardType } from '../types/game.js';
import { ImprovementTrack, ProgressCardType, type ProgressCardDefinition } from '../types/ck.js';

// --- Base Development Card Deck (25 cards, used only when C&K is OFF) ---

export interface DevCardDefinition {
  type: DevCardType;
  count: number;
  description: string;
}

export const DEV_CARD_DEFINITIONS: DevCardDefinition[] = [
  { type: DevCardType.KNIGHT, count: 14, description: 'Move the robber. Counts toward Largest Army.' },
  { type: DevCardType.VICTORY_POINT, count: 5, description: 'Worth 1 victory point. Revealed only when you win.' },
  { type: DevCardType.ROAD_BUILDING, count: 2, description: 'Place 2 roads for free.' },
  { type: DevCardType.YEAR_OF_PLENTY, count: 2, description: 'Take any 2 resources from the bank.' },
  { type: DevCardType.MONOPOLY, count: 2, description: 'Name a resource. All players give you ALL of that resource.' },
];

export const TOTAL_DEV_CARDS = 25;

// --- Progress Card Definitions (54 total: 18 per deck) ---

export const PROGRESS_CARD_DEFINITIONS: ProgressCardDefinition[] = [
  // ===== SCIENCE (Green) — 18 cards =====
  {
    type: ProgressCardType.ALCHEMIST, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Choose the result of both production dice before rolling. Only the event die is random.',
  },
  {
    type: ProgressCardType.CRANE, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Build one city improvement for 1 fewer commodity than normal.',
  },
  {
    type: ProgressCardType.ENGINEER, deck: ImprovementTrack.SCIENCE, count: 1, isVP: false,
    description: 'Build one city wall for free.',
  },
  {
    type: ProgressCardType.INVENTOR, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Swap any 2 number tokens on the board. Cannot swap 2, 6, 8, or 12.',
  },
  {
    type: ProgressCardType.IRRIGATION, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Collect 2 grain for each field hex adjacent to any of your settlements or cities.',
  },
  {
    type: ProgressCardType.MEDICINE, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Upgrade a settlement to a city for only 2 ore + 1 grain (instead of 3 ore + 2 grain).',
  },
  {
    type: ProgressCardType.MINING, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Collect 2 ore for each mountain hex adjacent to any of your settlements or cities.',
  },
  {
    type: ProgressCardType.PRINTER, deck: ImprovementTrack.SCIENCE, count: 1, isVP: true,
    description: 'Worth 1 VP. Revealed immediately when drawn. Cannot be stolen.',
  },
  {
    type: ProgressCardType.ROAD_BUILDING, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Build 2 roads for free.',
  },
  {
    type: ProgressCardType.SMITH, deck: ImprovementTrack.SCIENCE, count: 2, isVP: false,
    description: 'Promote (upgrade) up to 2 of your knights for free.',
  },

  // ===== POLITICS (Blue) — 18 cards =====
  {
    type: ProgressCardType.BISHOP, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Move the robber. Steal 1 card from EACH player with a building adjacent to that hex.',
  },
  {
    type: ProgressCardType.CONSTITUTION, deck: ImprovementTrack.POLITICS, count: 1, isVP: true,
    description: 'Worth 1 VP. Revealed immediately when drawn. Cannot be stolen.',
  },
  {
    type: ProgressCardType.DESERTER, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'An opponent removes one knight. You may place a free basic knight on your road network.',
  },
  {
    type: ProgressCardType.DIPLOMAT, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Remove an open road. If it\'s yours, relocate it for free. If opponent\'s, it returns to their supply.',
  },
  {
    type: ProgressCardType.INTRIGUE, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Displace an opponent\'s knight adjacent to one of your roads (no strength requirement).',
  },
  {
    type: ProgressCardType.SABOTEUR, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Each player with equal or more VP than you discards half their resource/commodity cards.',
  },
  {
    type: ProgressCardType.SPY, deck: ImprovementTrack.POLITICS, count: 3, isVP: false,
    description: 'Look at an opponent\'s progress cards. Steal one (not VP cards).',
  },
  {
    type: ProgressCardType.WARLORD, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Activate all of your knights for free.',
  },
  {
    type: ProgressCardType.WEDDING, deck: ImprovementTrack.POLITICS, count: 2, isVP: false,
    description: 'Each player with more VP than you gives you 2 resource or commodity cards.',
  },

  // ===== TRADE (Yellow) — 18 cards =====
  {
    type: ProgressCardType.COMMERCIAL_HARBOR, deck: ImprovementTrack.TRADE, count: 2, isVP: false,
    description: 'Each opponent gives you 1 commodity of their choice; you give each 1 resource of your choice.',
  },
  {
    type: ProgressCardType.MASTER_MERCHANT, deck: ImprovementTrack.TRADE, count: 2, isVP: false,
    description: 'Choose an opponent with more VP. View their hand and steal 2 cards of your choice.',
  },
  {
    type: ProgressCardType.MERCHANT, deck: ImprovementTrack.TRADE, count: 6, isVP: false,
    description: 'Place the Merchant on an adjacent hex. Gain 2:1 trade for that resource and +1 VP while you control it.',
  },
  {
    type: ProgressCardType.MERCHANT_FLEET, deck: ImprovementTrack.TRADE, count: 2, isVP: false,
    description: 'Choose a resource or commodity. Trade it at 2:1 with the bank for the rest of your turn.',
  },
  {
    type: ProgressCardType.RESOURCE_MONOPOLY, deck: ImprovementTrack.TRADE, count: 4, isVP: false,
    description: 'Name a resource. Each player gives you up to 2 of that resource.',
  },
  {
    type: ProgressCardType.TRADE_MONOPOLY, deck: ImprovementTrack.TRADE, count: 2, isVP: false,
    description: 'Name a commodity. Each player gives you 1 of that commodity.',
  },
];

/** Get definitions for a specific deck */
export function getProgressCardsByDeck(deck: ImprovementTrack): ProgressCardDefinition[] {
  return PROGRESS_CARD_DEFINITIONS.filter(c => c.deck === deck);
}

/** Get definition for a specific card type */
export function getProgressCardDefinition(type: ProgressCardType): ProgressCardDefinition {
  const def = PROGRESS_CARD_DEFINITIONS.find(c => c.type === type);
  if (!def) throw new Error(`Unknown progress card type: ${type}`);
  return def;
}
