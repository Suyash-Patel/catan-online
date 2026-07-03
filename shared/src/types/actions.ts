// ============================================================
// Player Actions — Discriminated Union Types
// ============================================================

import type { Resource, Commodity, DevCardType, ResourceCards, CommodityCards } from './game.js';
import type { HexCoord, VertexCoord, EdgeCoord } from './board.js';
import type { ImprovementTrack, ProgressCardType, KnightLevel } from './ck.js';

// --- Base Actions ---

export interface RollDiceAction {
  type: 'ROLL_DICE';
}

export interface EndTurnAction {
  type: 'END_TURN';
}

// --- Setup Actions ---

export interface PlaceInitialSettlementAction {
  type: 'PLACE_INITIAL_SETTLEMENT';
  vertexKey: string;
}

export interface PlaceInitialRoadAction {
  type: 'PLACE_INITIAL_ROAD';
  edgeKey: string;
}

export interface PlaceInitialCityAction {
  type: 'PLACE_INITIAL_CITY';
  vertexKey: string;
}

// --- Building Actions ---

export interface BuildSettlementAction {
  type: 'BUILD_SETTLEMENT';
  vertexKey: string;
}

export interface BuildCityAction {
  type: 'BUILD_CITY';
  vertexKey: string; // Must have own settlement here
}

export interface BuildRoadAction {
  type: 'BUILD_ROAD';
  edgeKey: string;
}

export interface BuildCityWallAction {
  type: 'BUILD_CITY_WALL';
  vertexKey: string; // Must have own city here
}

// --- Development Card Actions (base game only) ---

export interface BuyDevelopmentCardAction {
  type: 'BUY_DEVELOPMENT_CARD';
}

export interface PlayKnightAction {
  type: 'PLAY_KNIGHT';
}

export interface PlayRoadBuildingAction {
  type: 'PLAY_ROAD_BUILDING';
  edge1Key: string;
  edge2Key?: string; // Optional if only 1 road can be placed
}

export interface PlayYearOfPlentyAction {
  type: 'PLAY_YEAR_OF_PLENTY';
  resource1: Resource;
  resource2: Resource;
}

export interface PlayMonopolyAction {
  type: 'PLAY_MONOPOLY';
  resource: Resource;
}

// --- Robber Actions ---

export interface MoveRobberAction {
  type: 'MOVE_ROBBER';
  hexKey: string;
}

export interface StealResourceAction {
  type: 'STEAL_RESOURCE';
  targetPlayerId: string;
}

export interface DiscardCardsAction {
  type: 'DISCARD_CARDS';
  resources: Partial<ResourceCards>;
  commodities?: Partial<CommodityCards>;
}

// --- Trade Actions ---

export interface ProposeTradeAction {
  type: 'PROPOSE_TRADE';
  targetPlayerIds: string[] | 'all';
  offering: Partial<ResourceCards> & Partial<CommodityCards>;
  requesting: Partial<ResourceCards> & Partial<CommodityCards>;
}

export interface RespondTradeAction {
  type: 'RESPOND_TRADE';
  tradeId: string;
  accept: boolean;
}

export interface CancelTradeAction {
  type: 'CANCEL_TRADE';
  tradeId: string;
}

export interface BankTradeAction {
  type: 'BANK_TRADE';
  give: { type: Resource | Commodity; amount: number };
  receive: { type: Resource | Commodity; amount: number };
}

// --- C&K: Knight Actions ---

export interface HireKnightAction {
  type: 'HIRE_KNIGHT';
  vertexKey: string;
}

export interface ActivateKnightAction {
  type: 'ACTIVATE_KNIGHT';
  vertexKey: string;
}

export interface UpgradeKnightAction {
  type: 'UPGRADE_KNIGHT';
  vertexKey: string;
}

export interface MoveKnightAction {
  type: 'MOVE_KNIGHT';
  fromVertexKey: string;
  toVertexKey: string;
}

export interface DisplaceKnightAction {
  type: 'DISPLACE_KNIGHT';
  fromVertexKey: string;
  toVertexKey: string; // Where the displaced knight goes (chosen by its owner)
}

export interface ChaseRobberAction {
  type: 'CHASE_ROBBER';
  knightVertexKey: string;
}

// --- C&K: City Improvement ---

export interface ImproveCityAction {
  type: 'IMPROVE_CITY';
  track: ImprovementTrack;
}

// --- C&K: Progress Card Actions ---

export interface PlayAlchemistAction {
  type: 'PLAY_ALCHEMIST';
  whiteValue: number; // 1-6
  redValue: number;   // 1-6
}

export interface PlayCraneAction {
  type: 'PLAY_CRANE';
  track: ImprovementTrack;
}

export interface PlayEngineerAction {
  type: 'PLAY_ENGINEER';
  vertexKey: string; // City to add wall to
}

export interface PlayInventorAction {
  type: 'PLAY_INVENTOR';
  hexKey1: string;
  hexKey2: string;
}

export interface PlayIrrigationAction {
  type: 'PLAY_IRRIGATION';
}

export interface PlayMedicineAction {
  type: 'PLAY_MEDICINE';
  vertexKey: string; // Settlement to upgrade
}

export interface PlayMiningAction {
  type: 'PLAY_MINING';
}

export interface PlayProgressRoadBuildingAction {
  type: 'PLAY_PROGRESS_ROAD_BUILDING';
  edge1Key: string;
  edge2Key?: string;
}

export interface PlaySmithAction {
  type: 'PLAY_SMITH';
  knightVertexKeys: string[]; // 1-2 knights to upgrade
}

export interface PlayBishopAction {
  type: 'PLAY_BISHOP';
  hexKey: string; // Where to move robber
}

export interface PlayDeserterAction {
  type: 'PLAY_DESERTER';
  targetPlayerId: string;
  targetKnightVertexKey: string; // Opponent's knight to remove
  placeVertexKey: string;         // Where to place your free basic knight
}

export interface PlayDiplomatAction {
  type: 'PLAY_DIPLOMAT';
  edgeKey: string;         // The open road to remove
  relocateEdgeKey?: string; // If your own road, where to move it
}

export interface PlayIntrigueAction {
  type: 'PLAY_INTRIGUE';
  targetKnightVertexKey: string;
  displaceToVertexKey: string; // Where the displaced knight goes
}

export interface PlaySaboteurAction {
  type: 'PLAY_SABOTEUR';
}

export interface PlaySpyAction {
  type: 'PLAY_SPY';
  targetPlayerId: string;
  stealCardId?: string; // Which progress card to steal (after seeing hand)
}

export interface PlayWarlordAction {
  type: 'PLAY_WARLORD';
}

export interface PlayWeddingAction {
  type: 'PLAY_WEDDING';
}

// Wedding response (from other players)
export interface WeddingResponseAction {
  type: 'WEDDING_RESPONSE';
  cards: Partial<ResourceCards> & Partial<CommodityCards>; // 2 cards to give
}

export interface PlayCommercialHarborAction {
  type: 'PLAY_COMMERCIAL_HARBOR';
}

// Commercial Harbor response
export interface CommercialHarborResponseAction {
  type: 'COMMERCIAL_HARBOR_RESPONSE';
  giveCommodity: Commodity;
  receiveResource: Resource;
}

export interface PlayMasterMerchantAction {
  type: 'PLAY_MASTER_MERCHANT';
  targetPlayerId: string;
  stealCards: string[]; // 2 card indices to steal (after seeing hand)
}

export interface PlayMerchantAction {
  type: 'PLAY_MERCHANT';
  hexKey: string; // Where to place the merchant
}

export interface PlayMerchantFleetAction {
  type: 'PLAY_MERCHANT_FLEET';
  resourceOrCommodity: Resource | Commodity;
}

export interface PlayResourceMonopolyAction {
  type: 'PLAY_RESOURCE_MONOPOLY';
  resource: Resource;
}

export interface PlayTradeMonopolyAction {
  type: 'PLAY_TRADE_MONOPOLY';
  commodity: Commodity;
}

// --- C&K: Barbarian Resolution Choices ---

export interface ChooseCityToPillageAction {
  type: 'CHOOSE_CITY_TO_PILLAGE';
  vertexKey: string; // Which city to downgrade
}

export interface ChooseProgressCardDeckAction {
  type: 'CHOOSE_PROGRESS_CARD_DECK';
  deck: ImprovementTrack;
}

// --- Chat ---

export interface ChatMessageAction {
  type: 'CHAT_MESSAGE';
  message: string;
}

// --- Special Build Phase ---

export interface PassSpecialBuildAction {
  type: 'PASS_SPECIAL_BUILD';
}

// --- Union of all actions ---

export type GameAction =
  // Basic
  | RollDiceAction
  | EndTurnAction
  // Setup
  | PlaceInitialSettlementAction
  | PlaceInitialRoadAction
  | PlaceInitialCityAction
  // Building
  | BuildSettlementAction
  | BuildCityAction
  | BuildRoadAction
  | BuildCityWallAction
  // Dev cards (base)
  | BuyDevelopmentCardAction
  | PlayKnightAction
  | PlayRoadBuildingAction
  | PlayYearOfPlentyAction
  | PlayMonopolyAction
  // Robber
  | MoveRobberAction
  | StealResourceAction
  | DiscardCardsAction
  // Trade
  | ProposeTradeAction
  | RespondTradeAction
  | CancelTradeAction
  | BankTradeAction
  // C&K: Knights
  | HireKnightAction
  | ActivateKnightAction
  | UpgradeKnightAction
  | MoveKnightAction
  | DisplaceKnightAction
  | ChaseRobberAction
  // C&K: Improvements
  | ImproveCityAction
  // C&K: Progress cards
  | PlayAlchemistAction
  | PlayCraneAction
  | PlayEngineerAction
  | PlayInventorAction
  | PlayIrrigationAction
  | PlayMedicineAction
  | PlayMiningAction
  | PlayProgressRoadBuildingAction
  | PlaySmithAction
  | PlayBishopAction
  | PlayDeserterAction
  | PlayDiplomatAction
  | PlayIntrigueAction
  | PlaySaboteurAction
  | PlaySpyAction
  | PlayWarlordAction
  | PlayWeddingAction
  | WeddingResponseAction
  | PlayCommercialHarborAction
  | CommercialHarborResponseAction
  | PlayMasterMerchantAction
  | PlayMerchantAction
  | PlayMerchantFleetAction
  | PlayResourceMonopolyAction
  | PlayTradeMonopolyAction
  // C&K: Barbarian responses
  | ChooseCityToPillageAction
  | ChooseProgressCardDeckAction
  // Chat
  | ChatMessageAction
  // Special build
  | PassSpecialBuildAction;
