// ============================================================
// Core Game State Types
// ============================================================

import type { Board, HexCoord, VertexCoord, EdgeCoord } from './board.js';
import type {
  BarbarianState,
  ImprovementTrack,
  KnightLevel,
  Metropolis,
  ProgressCardType,
  MerchantState,
} from './ck.js';

// --- Enums ---

export enum Resource {
  BRICK = 'BRICK',
  LUMBER = 'LUMBER',
  ORE = 'ORE',
  GRAIN = 'GRAIN',
  WOOL = 'WOOL',
}

export enum Commodity {
  PAPER = 'PAPER',   // from Forest (cities)
  CLOTH = 'CLOTH',   // from Pasture (cities)
  COIN = 'COIN',     // from Mountains (cities)
}

export enum PlayerColor {
  RED = 'RED',
  BLUE = 'BLUE',
  WHITE = 'WHITE',
  ORANGE = 'ORANGE',
  GREEN = 'GREEN',
  BROWN = 'BROWN',
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export enum TurnPhase {
  // Setup phases
  SETUP_SETTLEMENT = 'SETUP_SETTLEMENT',
  SETUP_ROAD = 'SETUP_ROAD',
  SETUP_CITY = 'SETUP_CITY',         // C&K: second placement is a city
  SETUP_CITY_ROAD = 'SETUP_CITY_ROAD', // Road after the city

  // Playing phases
  PRE_ROLL = 'PRE_ROLL',           // Can play Alchemist, Knight actions before rolling
  ROLL_DICE = 'ROLL_DICE',
  RESOLVE_EVENT = 'RESOLVE_EVENT',  // Event die resolution (barbarian/progress cards)
  DISCARD = 'DISCARD',              // Players with 7+ cards must discard
  ROBBER_MOVE = 'ROBBER_MOVE',      // Move robber (on 7, or knight, or Bishop)
  ROBBER_STEAL = 'ROBBER_STEAL',    // Choose player to steal from
  POST_ROLL = 'POST_ROLL',         // Main action phase: build, trade, play cards
  SPECIAL_BUILD = 'SPECIAL_BUILD',  // 5-6 player special building phase

  // End
  GAME_OVER = 'GAME_OVER',
}

// --- Player ---

export interface ResourceCards {
  [Resource.BRICK]: number;
  [Resource.LUMBER]: number;
  [Resource.ORE]: number;
  [Resource.GRAIN]: number;
  [Resource.WOOL]: number;
}

export interface CommodityCards {
  [Commodity.PAPER]: number;
  [Commodity.CLOTH]: number;
  [Commodity.COIN]: number;
}

export interface PlayerImprovementLevels {
  [ImprovementTrack.TRADE]: number;    // 0-5
  [ImprovementTrack.POLITICS]: number; // 0-5
  [ImprovementTrack.SCIENCE]: number;  // 0-5
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isConnected: boolean;

  // Resources & commodities
  resources: ResourceCards;
  commodities: CommodityCards;

  // Buildings remaining (supply)
  settlementsRemaining: number; // starts 5
  citiesRemaining: number;     // starts 4
  roadsRemaining: number;      // starts 15

  // C&K supply
  knightsRemaining: { basic: number; strong: number; mighty: number }; // 2 each

  // Cards
  developmentCards: DevelopmentCard[];       // Base game only
  progressCards: ProgressCardInstance[];     // C&K only
  vpCardsRevealed: ProgressCardType[];      // VP progress cards (Printer, Constitution)

  // C&K state
  improvementLevels: PlayerImprovementLevels;
  cityWallCount: number;                    // 0-3
  defenderOfCatanCount: number;             // VP cards earned from barbarian defense

  // Computed (but stored for convenience)
  knightsPlayed: number;    // Base game knight dev cards played (for Largest Army)
  longestRoadLength: number;
  victoryPoints: number;    // Always recomputed by server

  // Trade state
  hasPlayedDevCardThisTurn: boolean;
  devCardsBoughtThisTurn: string[];  // IDs of cards bought this turn (can't play same turn)
}

// --- Development Cards (base game only) ---

export enum DevCardType {
  KNIGHT = 'KNIGHT',
  ROAD_BUILDING = 'ROAD_BUILDING',
  YEAR_OF_PLENTY = 'YEAR_OF_PLENTY',
  MONOPOLY = 'MONOPOLY',
  VICTORY_POINT = 'VICTORY_POINT',
}

export interface DevelopmentCard {
  id: string;
  type: DevCardType;
  turnBought: number;
}

// --- Progress Card Instance ---

export interface ProgressCardInstance {
  id: string;
  type: ProgressCardType;
  deck: ImprovementTrack;
}

// --- Dice ---

export interface DiceRoll {
  white: number;   // 1-6
  red: number;     // 1-6
  total: number;   // white + red (2-12)
  event?: EventDieFace; // Only in C&K mode
}

export enum EventDieFace {
  BARBARIAN_SHIP = 'BARBARIAN_SHIP',
  YELLOW_GATE = 'YELLOW_GATE',  // Trade
  BLUE_GATE = 'BLUE_GATE',      // Politics
  GREEN_GATE = 'GREEN_GATE',    // Science
}

// --- Trade ---

export interface TradeOffer {
  id: string;
  offeringPlayerId: string;
  targetPlayerIds: string[] | 'all'; // specific players or broadcast
  offering: Partial<ResourceCards> & Partial<CommodityCards>;
  requesting: Partial<ResourceCards> & Partial<CommodityCards>;
  responses: Record<string, 'accepted' | 'rejected' | 'pending'>;
  status: 'open' | 'accepted' | 'rejected' | 'cancelled';
}

// --- Action Log ---

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  playerId?: string;
  message: string;
  type: 'action' | 'system' | 'chat' | 'trade';
}

// --- Game State (the master object) ---

export interface GameState {
  id: string;
  roomCode: string;
  settings: GameSettings;
  phase: GamePhase;
  turnPhase: TurnPhase;

  // Board
  board: Board;

  // Players
  players: Player[];
  turnOrder: string[];        // Player IDs in turn order
  currentPlayerIndex: number; // Index into turnOrder
  setupRound: number;         // 1 or 2 during setup
  setupForward: boolean;      // true = going forward (1→2→3→4), false = reverse

  // Dice
  lastRoll: DiceRoll | null;
  turnNumber: number;

  // Robber
  robberHex: HexCoord;
  robberDormant: boolean;     // C&K: robber can't move until first barbarian attack

  // Development cards deck (base game)
  developmentCardDeck: DevelopmentCard[];
  largestArmyPlayerId: string | null;
  largestArmySize: number;

  // Longest road
  longestRoadPlayerId: string | null;
  longestRoadLength: number;

  // C&K state
  citiesAndKnights: boolean;
  barbarianState: BarbarianState;
  metropolises: Metropolis[];
  progressCardDecks: {
    trade: ProgressCardInstance[];
    politics: ProgressCardInstance[];
    science: ProgressCardInstance[];
  };
  merchant: MerchantState | null;
  defenderCardsRemaining: number; // 6 total

  // Trading
  activeTradeOffer: TradeOffer | null;

  // Special build phase (5-6 players)
  specialBuildOrder: string[];      // Player IDs who can still build
  specialBuildCurrentIndex: number;

  // Pending actions (for multi-step resolution)
  pendingDiscards: Record<string, number>;  // playerId → number they must discard
  pendingStealFrom: string[];               // Players the robber-mover can steal from

  // Alchemist (C&K)
  alchemistActive: boolean;
  alchemistValues: { white: number; red: number } | null;

  // Merchant Fleet (C&K)
  merchantFleetResource: Resource | Commodity | null;

  // Action log
  actionLog: ActionLogEntry[];

  // Win condition
  winnerPlayerId: string | null;
  victoryPointsToWin: number; // 10 (base) or 13 (C&K)
}

export interface GameSettings {
  playerCount: 3 | 4 | 5 | 6;
  citiesAndKnights: boolean;
}

// --- Client-visible state (with hidden info stripped) ---

export interface ClientGameState extends Omit<GameState, 'developmentCardDeck' | 'progressCardDecks'> {
  developmentCardDeckCount: number;
  progressCardDeckCounts: { trade: number; politics: number; science: number };
  // Other players' cards are replaced with counts in the Player objects
}
