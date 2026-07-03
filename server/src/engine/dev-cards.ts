// ============================================================
// Development Cards (Base Game)
// ============================================================

import { GameState, DevCardType, Resource, TurnPhase } from '@catan/shared/types/game.js';
import { DEV_CARD_DEFINITIONS, TOTAL_DEV_CARDS } from '@catan/shared/constants/cards.js';
import { MIN_LARGEST_ARMY, VP_VALUES } from '@catan/shared/constants/costs.js';
import { getPlayerById, calculateVictoryPoints } from './game-state.js';
import { deductResources } from './building.js';
import { BUILDING_COSTS } from '@catan/shared/constants/costs.js';
import { v4 as uuidv4 } from 'uuid';

export function createDevCardDeck() {
  const deck = [];
  for (const def of DEV_CARD_DEFINITIONS) {
    for (let i = 0; i < def.count; i++) {
      deck.push({ id: uuidv4(), type: def.type, turnBought: -1 });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function buyDevCard(state: GameState, playerId: string): GameState {
  if (state.developmentCardDeck.length === 0) throw new Error("Deck is empty");
  
  const player = getPlayerById(state, playerId);
  const newPlayer = deductResources(player, BUILDING_COSTS.DEVELOPMENT_CARD);
  
  const deck = [...state.developmentCardDeck];
  const card = deck.pop()!;
  card.turnBought = state.turnNumber;
  
  newPlayer.developmentCards = [...newPlayer.developmentCards, card];
  newPlayer.devCardsBoughtThisTurn = [...newPlayer.devCardsBoughtThisTurn, card.id];

  return {
    ...state,
    developmentCardDeck: deck,
    players: state.players.map((p: any) => p.id === playerId ? newPlayer : p)
  };
}

export function updateLargestArmy(state: GameState): GameState {
  let newState = { ...state };
  
  let currentHolder = newState.largestArmyPlayerId;
  let currentSize = newState.largestArmySize;
  
  for (const player of newState.players) {
    if (player.knightsPlayed > currentSize && player.knightsPlayed >= MIN_LARGEST_ARMY) {
      currentHolder = player.id;
      currentSize = player.knightsPlayed;
    }
  }
  
  newState.largestArmyPlayerId = currentHolder;
  newState.largestArmySize = currentSize;
  
  // Recalculate VPs
  newState.players = newState.players.map((p: any) => ({
    ...p,
    victoryPoints: calculateVictoryPoints(newState, p.id)
  }));
  
  return newState;
}

export function playKnight(state: GameState, playerId: string, cardId: string): GameState {
  let newState = markCardPlayed(state, playerId, cardId);
  
  const player = newState.players.find((p: any) => p.id === playerId)!;
  newState.players = newState.players.map((p: any) => 
    p.id === playerId ? { ...p, knightsPlayed: p.knightsPlayed + 1 } : p
  );
  
  newState = updateLargestArmy(newState);
  newState.turnPhase = TurnPhase.ROBBER_MOVE;
  
  return newState;
}

export function playYearOfPlenty(state: GameState, playerId: string, cardId: string, r1: Resource, r2: Resource): GameState {
  let newState = markCardPlayed(state, playerId, cardId);
  const player = newState.players.find((p: any) => p.id === playerId)!;
  
  const newResources = { ...player.resources };
  newResources[r1]++;
  newResources[r2]++;
  
  newState.players = newState.players.map((p: any) => p.id === playerId ? { ...p, resources: newResources } : p);
  return newState;
}

export function playMonopoly(state: GameState, playerId: string, cardId: string, resource: Resource): GameState {
  let newState = markCardPlayed(state, playerId, cardId);
  let totalStolen = 0;
  
  newState.players = newState.players.map((p: any) => {
    if (p.id === playerId) return p;
    totalStolen += p.resources[resource];
    return { ...p, resources: { ...p.resources, [resource]: 0 } };
  });
  
  const player = newState.players.find((p: any) => p.id === playerId)!;
  newState.players = newState.players.map((p: any) => 
    p.id === playerId ? { ...p, resources: { ...p.resources, [resource]: p.resources[resource] + totalStolen } } : p
  );
  
  return newState;
}

export function markCardPlayed(state: GameState, playerId: string, cardId: string): GameState {
  const player = getPlayerById(state, playerId);
  return {
    ...state,
    players: state.players.map((p: any) => 
      p.id === playerId ? {
        ...p,
        hasPlayedDevCardThisTurn: true,
        developmentCards: p.developmentCards.filter((c: any) => c.id !== cardId)
      } : p
    )
  };
}
