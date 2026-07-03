// ============================================================
// Special Build Phase (5-6 Players)
// ============================================================

import { GameState, TurnPhase } from '@catan/shared/types/game.js';

export function initSpecialBuildPhase(state: GameState): GameState {
  if (state.settings.playerCount < 5) return state; // Only for 5-6 players
  
  const activePlayer = state.turnOrder[state.currentPlayerIndex];
  const order = [...state.turnOrder];
  
  // Rotate so active player is at the end, then remove them
  while (order[0] !== activePlayer) {
    order.push(order.shift()!);
  }
  order.shift(); // Remove active player
  
  return {
    ...state,
    turnPhase: TurnPhase.SPECIAL_BUILD,
    specialBuildOrder: order,
    specialBuildCurrentIndex: 0
  };
}

export function passSpecialBuild(state: GameState): GameState {
  if (state.turnPhase !== TurnPhase.SPECIAL_BUILD) return state;
  
  const newState = { ...state };
  newState.specialBuildCurrentIndex++;
  
  // If everyone passed, move to next player's actual turn
  if (newState.specialBuildCurrentIndex >= newState.specialBuildOrder.length) {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.turnOrder.length;
    newState.turnPhase = TurnPhase.PRE_ROLL;
    newState.turnNumber++;
    
    // Reset flags
    newState.players = newState.players.map((p: any) => ({
      ...p,
      hasPlayedDevCardThisTurn: false,
      devCardsBoughtThisTurn: []
    }));
    newState.alchemistActive = false;
    newState.alchemistValues = null;
    newState.merchantFleetResource = null;
  }
  
  return newState;
}

export function getSpecialBuildPlayer(state: GameState): string {
  return state.specialBuildOrder[state.specialBuildCurrentIndex];
}
