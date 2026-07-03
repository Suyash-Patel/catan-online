// ============================================================
// Building & Action Costs
// ============================================================

import { Resource, Commodity } from '../types/game.js';
import { ImprovementTrack } from '../types/ck.js';

export interface ResourceCost {
  [Resource.BRICK]?: number;
  [Resource.LUMBER]?: number;
  [Resource.ORE]?: number;
  [Resource.GRAIN]?: number;
  [Resource.WOOL]?: number;
}

export interface CommodityCost {
  [Commodity.PAPER]?: number;
  [Commodity.CLOTH]?: number;
  [Commodity.COIN]?: number;
}

export const BUILDING_COSTS = {
  ROAD: {
    [Resource.BRICK]: 1,
    [Resource.LUMBER]: 1,
  } as ResourceCost,

  SETTLEMENT: {
    [Resource.BRICK]: 1,
    [Resource.LUMBER]: 1,
    [Resource.GRAIN]: 1,
    [Resource.WOOL]: 1,
  } as ResourceCost,

  CITY: {
    [Resource.ORE]: 3,
    [Resource.GRAIN]: 2,
  } as ResourceCost,

  DEVELOPMENT_CARD: {
    [Resource.ORE]: 1,
    [Resource.GRAIN]: 1,
    [Resource.WOOL]: 1,
  } as ResourceCost,

  // C&K costs
  KNIGHT: {
    [Resource.WOOL]: 1,
    [Resource.ORE]: 1,
  } as ResourceCost,

  KNIGHT_UPGRADE: {
    [Resource.WOOL]: 1,
    [Resource.ORE]: 1,
  } as ResourceCost,

  KNIGHT_ACTIVATE: {
    [Resource.GRAIN]: 1,
  } as ResourceCost,

  CITY_WALL: {
    [Resource.BRICK]: 2,
  } as ResourceCost,

  // Medicine card: reduced city cost
  CITY_WITH_MEDICINE: {
    [Resource.ORE]: 2,
    [Resource.GRAIN]: 1,
  } as ResourceCost,
} as const;

/** Get the commodity cost for a city improvement level. Level N costs N commodities. */
export function getImprovementCost(track: ImprovementTrack, level: number): CommodityCost {
  switch (track) {
    case ImprovementTrack.TRADE:
      return { [Commodity.CLOTH]: level };
    case ImprovementTrack.POLITICS:
      return { [Commodity.COIN]: level };
    case ImprovementTrack.SCIENCE:
      return { [Commodity.PAPER]: level };
  }
}

/** Supply limits per player */
export const SUPPLY_LIMITS = {
  SETTLEMENTS: 5,
  CITIES: 4,
  ROADS: 15,
  KNIGHTS_BASIC: 2,
  KNIGHTS_STRONG: 2,
  KNIGHTS_MIGHTY: 2,
  CITY_WALLS: 3,
} as const;

/** VP requirements */
export const VP_TO_WIN_BASE = 10;
export const VP_TO_WIN_CK = 13;

/** VP values */
export const VP_VALUES = {
  SETTLEMENT: 1,
  CITY: 2,
  METROPOLIS: 2,        // Bonus on top of city's 2
  LONGEST_ROAD: 2,
  LARGEST_ARMY: 2,      // Base game only
  DEFENDER_OF_CATAN: 1,
  VP_DEV_CARD: 1,
  VP_PROGRESS_CARD: 1,  // Printer, Constitution
  MERCHANT: 1,
} as const;

/** Minimum road length for Longest Road */
export const MIN_LONGEST_ROAD = 5;

/** Minimum knights for Largest Army (base game only) */
export const MIN_LARGEST_ARMY = 3;

/** Barbarian track length */
export const BARBARIAN_TRACK_LENGTH = 7;

/** Max progress cards in hand */
export const MAX_PROGRESS_CARDS = 4;

/** Hand limit on 7 (before city walls) */
export const BASE_HAND_LIMIT = 7;

/** Extra cards per city wall */
export const CITY_WALL_HAND_BONUS = 2;

/** Total defender of catan cards in the game */
export const TOTAL_DEFENDER_CARDS = 6;

/** Max improvement level */
export const MAX_IMPROVEMENT_LEVEL = 5;
