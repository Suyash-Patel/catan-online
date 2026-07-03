// ============================================================
// Game State Initialization & Helpers
// ============================================================

import { GameState, GameSettings, GamePhase, TurnPhase, Player, Resource, Commodity, PlayerColor } from '@catan/shared/types/game.js';
import { Board, HexCoord } from '@catan/shared/types/board.js';
import { SUPPLY_LIMITS, VP_TO_WIN_BASE, VP_TO_WIN_CK, VP_VALUES } from '@catan/shared/constants/costs.js';

export function createInitialPlayer(id: string, name: string, color: PlayerColor): Player {
  return {
    id,
    name,
    color,
    isConnected: true,
    resources: {
      [Resource.BRICK]: 0,
      [Resource.LUMBER]: 0,
      [Resource.ORE]: 0,
      [Resource.GRAIN]: 0,
      [Resource.WOOL]: 0,
    },
    commodities: {
      [Commodity.PAPER]: 0,
      [Commodity.CLOTH]: 0,
      [Commodity.COIN]: 0,
    },
    settlementsRemaining: SUPPLY_LIMITS.SETTLEMENTS,
    citiesRemaining: SUPPLY_LIMITS.CITIES,
    roadsRemaining: SUPPLY_LIMITS.ROADS,
    knightsRemaining: {
      basic: SUPPLY_LIMITS.KNIGHTS_BASIC,
      strong: SUPPLY_LIMITS.KNIGHTS_STRONG,
      mighty: SUPPLY_LIMITS.KNIGHTS_MIGHTY,
    },
    developmentCards: [],
    progressCards: [],
    vpCardsRevealed: [],
    improvementLevels: {
      TRADE: 0,
      POLITICS: 0,
      SCIENCE: 0,
    },
    cityWallCount: 0,
    defenderOfCatanCount: 0,
    knightsPlayed: 0,
    longestRoadLength: 0,
    victoryPoints: 0,
    hasPlayedDevCardThisTurn: false,
    devCardsBoughtThisTurn: [],
  };
}

export function createInitialGameState(
  id: string,
  roomCode: string,
  settings: GameSettings,
  board: Board,
  playerInfos: { id: string; name: string; color: PlayerColor }[]
): GameState {
  const players = playerInfos.map(p => createInitialPlayer(p.id, p.name, p.color));
  
  // Randomize turn order
  const turnOrder = [...players.map((p: any) => p.id)];
  for (let i = turnOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
  }

  let robberHex: HexCoord | null = null;
  for (const key in board.hexes) {
    if (board.hexes[key].hasRobber) {
      robberHex = board.hexes[key].coord;
      break;
    }
  }

  return {
    id,
    roomCode,
    settings,
    phase: GamePhase.SETUP,
    turnPhase: TurnPhase.SETUP_SETTLEMENT,
    board,
    players,
    turnOrder,
    currentPlayerIndex: 0,
    setupRound: 1,
    setupForward: true,
    lastRoll: null,
    turnNumber: 1,
    robberHex: robberHex!,
    robberDormant: settings.citiesAndKnights, // Dormant in C&K until first attack
    developmentCardDeck: [], // Should be initialized if not C&K
    largestArmyPlayerId: null,
    largestArmySize: 0,
    longestRoadPlayerId: null,
    longestRoadLength: 0,
    citiesAndKnights: settings.citiesAndKnights,
    barbarianState: {
      position: 0,
      trackLength: 7,
      hasAttackedOnce: false,
    },
    metropolises: [],
    progressCardDecks: {
      trade: [],
      politics: [],
      science: [],
    },
    merchant: null,
    defenderCardsRemaining: 6,
    activeTradeOffer: null,
    specialBuildOrder: [],
    specialBuildCurrentIndex: 0,
    pendingDiscards: {},
    pendingStealFrom: [],
    alchemistActive: false,
    alchemistValues: null,
    merchantFleetResource: null,
    actionLog: [],
    winnerPlayerId: null,
    victoryPointsToWin: settings.citiesAndKnights ? VP_TO_WIN_CK : VP_TO_WIN_BASE,
  };
}

export function getActivePlayer(state: GameState): Player {
  const id = state.turnOrder[state.currentPlayerIndex];
  return getPlayerById(state, id);
}

export function getPlayerById(state: GameState, id: string): Player {
  const player = state.players.find((p: any) => p.id === id);
  if (!player) throw new Error(`Player ${id} not found`);
  return player;
}

export function calculateVictoryPoints(state: GameState, playerId: string): number {
  let vp = 0;
  
  // 1. Settlements and Cities
  for (const vertex of Object.values(state.board.vertices)) {
    if (vertex.building && vertex.building.playerId === playerId) {
      if (vertex.building.type === 'settlement') {
        vp += VP_VALUES.SETTLEMENT;
      } else if (vertex.building.type === 'city') {
        vp += VP_VALUES.CITY;
        if (vertex.building.hasMetropolis) {
          vp += VP_VALUES.METROPOLIS;
        }
      }
    }
  }

  // 2. Longest Road
  if (state.longestRoadPlayerId === playerId) {
    vp += VP_VALUES.LONGEST_ROAD;
  }

  // 3. Largest Army (base game only)
  if (!state.citiesAndKnights && state.largestArmyPlayerId === playerId) {
    vp += VP_VALUES.LARGEST_ARMY;
  }

  // 4. Defender of Catan
  const player = getPlayerById(state, playerId);
  vp += player.defenderOfCatanCount * VP_VALUES.DEFENDER_OF_CATAN;

  // 5. Merchant
  if (state.merchant && state.merchant.playerId === playerId) {
    vp += VP_VALUES.MERCHANT;
  }

  // 6. VP Cards
  vp += player.vpCardsRevealed.length * VP_VALUES.VP_PROGRESS_CARD;

  // For base game dev cards, usually VP cards are kept hidden until they win, 
  // but for server tracking we can count them for the win check.
  if (!state.citiesAndKnights) {
    const vpDevCards = player.developmentCards.filter(c => c.type === 'VICTORY_POINT');
    vp += vpDevCards.length * VP_VALUES.VP_DEV_CARD;
  }

  return vp;
}

export function checkWinCondition(state: GameState): string | null {
  for (const player of state.players) {
    if (player.victoryPoints >= state.victoryPointsToWin) {
      return player.id;
    }
  }
  return null;
}
