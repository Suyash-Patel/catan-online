// ============================================================
// Metropolis Management
// ============================================================

import { GameState } from '@catan/shared/types/game.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';
import { getPlayerById } from '../engine/game-state.js';
import { updatePlayer, updateVertex, addActionLog } from './utils.js';

export function checkAndAssignMetropolis(state: GameState, playerId: string, track: ImprovementTrack): GameState {
  const player = getPlayerById(state, playerId);
  const newLevel = player.improvementLevels[track];
  
  if (newLevel < 4) return state;

  // Check if anyone else has this metropolis
  const currentMetropolis = state.metropolises.find(m => m.track === track);
  
  let newState = { ...state };

  if (!currentMetropolis) {
    // First to level 4 gets it
    newState = assignMetropolis(newState, playerId, track);
  } else if (newLevel === 5) {
    const currentHolder = getPlayerById(newState, currentMetropolis.playerId);
    if (currentHolder.improvementLevels[track] < 5) {
      // Steal metropolis
      newState = stealMetropolis(newState, playerId, currentMetropolis.playerId, track);
    }
  }
  // If currentLevel === 4 and someone else already has it, do nothing.
  
  return newState;
}

function assignMetropolis(state: GameState, playerId: string, track: ImprovementTrack): GameState {
  // Find a valid city (without a metropolis already)
  let targetVertexKey: string | null = null;
  for (const [key, vertex] of Object.entries(state.board.vertices)) {
    if (vertex.building && vertex.building.playerId === playerId && vertex.building.type === 'city' && !vertex.building.hasMetropolis) {
      targetVertexKey = key;
      break;
    }
  }

  if (!targetVertexKey) {
    // Edge case: no valid city to place it on. The rulebook says you can't build it until you have a valid city.
    // For simplicity, we just won't assign it yet, or the UI should prevent the upgrade if no city available.
    // Assuming UI prevents it.
    return state;
  }

  let newState = updateVertex(state, targetVertexKey, {
    building: { ...state.board.vertices[targetVertexKey].building!, hasMetropolis: true }
  });

  newState.metropolises = [
    ...newState.metropolises.filter(m => m.track !== track),
    { track, playerId, vertexKey: targetVertexKey, isLocked: false }
  ];

  return addActionLog(newState, `built the ${track} Metropolis!`, playerId);
}

function stealMetropolis(state: GameState, newPlayerId: string, oldPlayerId: string, track: ImprovementTrack): GameState {
  const metropolis = state.metropolises.find(m => m.track === track)!;
  
  // Remove from old player
  let newState = updateVertex(state, metropolis.vertexKey, {
    building: { ...state.board.vertices[metropolis.vertexKey].building!, hasMetropolis: false }
  });
  
  newState.metropolises = newState.metropolises.filter(m => m.track !== track);
  
  // Add to new player
  return assignMetropolis(newState, newPlayerId, track);
}
