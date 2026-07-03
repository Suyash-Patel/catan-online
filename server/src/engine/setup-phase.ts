// ============================================================
// Setup Phase
// ============================================================

import { GameState, TurnPhase, GamePhase, Resource } from '@catan/shared/types/game.js';
import { TerrainType } from '@catan/shared/types/board.js';
import { getPlayerById } from './game-state.js';

export function advanceSetupPhase(state: GameState, lastAction: 'settlement' | 'city' | 'road'): GameState {
  let newState = { ...state };
  
  if (lastAction === 'settlement') {
    newState.turnPhase = TurnPhase.SETUP_ROAD;
    return newState;
  }
  
  if (lastAction === 'city') {
    newState.turnPhase = TurnPhase.SETUP_CITY_ROAD;
    return newState;
  }
  
  if (lastAction === 'road') {
    // Road placed, move to next player or phase
    if (newState.setupForward) {
      if (newState.currentPlayerIndex < newState.turnOrder.length - 1) {
        newState.currentPlayerIndex++;
        newState.turnPhase = TurnPhase.SETUP_SETTLEMENT;
      } else {
        // End of round 1
        newState.setupForward = false;
        newState.setupRound = 2;
        newState.turnPhase = newState.citiesAndKnights ? TurnPhase.SETUP_CITY : TurnPhase.SETUP_SETTLEMENT;
      }
    } else {
      // Round 2 (reverse)
      if (newState.currentPlayerIndex > 0) {
        newState.currentPlayerIndex--;
        newState.turnPhase = newState.citiesAndKnights ? TurnPhase.SETUP_CITY : TurnPhase.SETUP_SETTLEMENT;
      } else {
        // End of setup
        newState.phase = GamePhase.PLAYING;
        newState.turnPhase = TurnPhase.PRE_ROLL;
        newState.setupRound = 0;
      }
    }
  }
  
  return newState;
}

export function awardStartingResources(state: GameState, playerId: string, vertexKey: string): GameState {
  const player = getPlayerById(state, playerId);
  const newResources = { ...player.resources };
  
  const adjHexes = state.board.vertexToHexes[vertexKey] || [];
  for (const hexKey of adjHexes) {
    const hex = state.board.hexes[hexKey];
    if (!hex) continue;
    switch (hex.terrain) {
      case TerrainType.FOREST: newResources[Resource.LUMBER]++; break;
      case TerrainType.PASTURE: newResources[Resource.WOOL]++; break;
      case TerrainType.FIELDS: newResources[Resource.GRAIN]++; break;
      case TerrainType.HILLS: newResources[Resource.BRICK]++; break;
      case TerrainType.MOUNTAINS: newResources[Resource.ORE]++; break;
    }
  }
  
  const newPlayer = { ...player, resources: newResources };
  return { ...state, players: state.players.map((p: any) => p.id === playerId ? newPlayer : p) };
}
