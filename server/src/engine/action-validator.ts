// ============================================================
// Action Validator
// ============================================================

import { GameState, TurnPhase, GamePhase } from '@catan/shared/types/game.js';
import { GameAction } from '@catan/shared/types/actions.js';
import { canBuildSettlement, canBuildCity, canBuildRoad } from './building.js';
import { getSpecialBuildPlayer } from './special-build.js';

export function validateAction(state: GameState, playerId: string, action: GameAction): { valid: boolean; error?: string } {
  // 1. Check game over
  if (state.phase === GamePhase.FINISHED) return { valid: false, error: "Game is over" };

  // 2. Identify active player based on phase
  let activePlayerId = state.turnOrder[state.currentPlayerIndex];
  
  if (state.turnPhase === TurnPhase.SPECIAL_BUILD) {
    activePlayerId = getSpecialBuildPlayer(state);
  } else if (state.turnPhase === TurnPhase.ROBBER_STEAL) {
    // Must be current player
  } else if (state.turnPhase === TurnPhase.DISCARD) {
    // Anyone in pendingDiscards can discard
    if (action.type === 'DISCARD_CARDS') {
      if (state.pendingDiscards[playerId] > 0) return { valid: true };
      return { valid: false, error: "Not your turn to discard" };
    }
    return { valid: false, error: "Must resolve discards first" };
  } else if (action.type === 'RESPOND_TRADE' || action.type === 'WEDDING_RESPONSE' || action.type === 'COMMERCIAL_HARBOR_RESPONSE') {
    // Can be other players responding
    return { valid: true }; // Specific validation happens inside executor
  } else if (action.type === 'CHOOSE_CITY_TO_PILLAGE' || action.type === 'CHOOSE_PROGRESS_CARD_DECK') {
    // Handled in CK module
    return { valid: true };
  }

  if (playerId !== activePlayerId) {
    return { valid: false, error: "Not your turn" };
  }

  // 3. Phase validation
  switch (action.type) {
    case 'PLACE_INITIAL_SETTLEMENT':
      if (state.turnPhase !== TurnPhase.SETUP_SETTLEMENT) return { valid: false, error: "Wrong phase" };
      return canBuildSettlement(state, playerId, action.vertexKey, true);
    
    case 'PLACE_INITIAL_CITY':
      if (state.turnPhase !== TurnPhase.SETUP_CITY) return { valid: false, error: "Wrong phase" };
      // In C&K round 2 setup, you place a city for free. We treat it like a free settlement + instant upgrade.
      // But distance rules apply.
      return canBuildSettlement(state, playerId, action.vertexKey, true);
      
    case 'PLACE_INITIAL_ROAD':
      if (state.turnPhase !== TurnPhase.SETUP_ROAD && state.turnPhase !== TurnPhase.SETUP_CITY_ROAD) return { valid: false, error: "Wrong phase" };
      // Note: we can't fully validate setup road connectivity here without passing the just-built vertex.
      // We will assume it's valid if it passes basic checks, full check in executor.
      return canBuildRoad(state, playerId, action.edgeKey, true);
      
    case 'ROLL_DICE':
      if (state.turnPhase !== TurnPhase.PRE_ROLL) return { valid: false, error: "Cannot roll now" };
      return { valid: true };
      
    case 'END_TURN':
      if (state.turnPhase !== TurnPhase.POST_ROLL) return { valid: false, error: "Cannot end turn now" };
      return { valid: true };
      
    case 'BUILD_SETTLEMENT':
      if (state.turnPhase !== TurnPhase.POST_ROLL && state.turnPhase !== TurnPhase.SPECIAL_BUILD) return { valid: false, error: "Wrong phase" };
      return canBuildSettlement(state, playerId, action.vertexKey, false);
      
    case 'BUILD_CITY':
      if (state.turnPhase !== TurnPhase.POST_ROLL && state.turnPhase !== TurnPhase.SPECIAL_BUILD) return { valid: false, error: "Wrong phase" };
      return canBuildCity(state, playerId, action.vertexKey, false);
      
    case 'BUILD_ROAD':
      if (state.turnPhase !== TurnPhase.POST_ROLL && state.turnPhase !== TurnPhase.SPECIAL_BUILD) return { valid: false, error: "Wrong phase" };
      return canBuildRoad(state, playerId, action.edgeKey, false);
      
    case 'MOVE_ROBBER':
      if (state.turnPhase !== TurnPhase.ROBBER_MOVE) return { valid: false, error: "Wrong phase" };
      return { valid: true }; // Exclude same hex checked in executor
      
    case 'STEAL_RESOURCE':
      if (state.turnPhase !== TurnPhase.ROBBER_STEAL) return { valid: false, error: "Wrong phase" };
      if (!state.pendingStealFrom.includes(action.targetPlayerId)) return { valid: false, error: "Invalid target" };
      return { valid: true };
      
    case 'PASS_SPECIAL_BUILD':
      if (state.turnPhase !== TurnPhase.SPECIAL_BUILD) return { valid: false, error: "Not special build phase" };
      return { valid: true };
      
    // Default valid for other complex actions that will be validated in executor (e.g., C&K actions)
    default:
      return { valid: true };
  }
}
