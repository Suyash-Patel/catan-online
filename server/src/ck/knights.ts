// ============================================================
// Knights
// ============================================================

import { GameState, Resource } from '@catan/shared/types/game.js';
import { KnightLevel } from '@catan/shared/types/ck.js';
import { BUILDING_COSTS } from '@catan/shared/constants/costs.js';
import { getPlayerById } from '../engine/game-state.js';
import { hasConnectedRoadToVertex } from '../engine/building.js';
import { deductResources, updatePlayer, updateVertex, addActionLog } from './utils.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';

export function hireKnight(state: GameState, playerId: string, vertexKey: string): GameState {
  const player = getPlayerById(state, playerId);
  if (player.knightsRemaining.basic <= 0) throw new Error("No basic knights remaining");
  
  const vertex = state.board.vertices[vertexKey];
  if (vertex.building || vertex.knight) throw new Error("Vertex already occupied");
  
  if (!hasConnectedRoadToVertex(state, playerId, vertexKey)) throw new Error("Must connect to road");

  const newPlayer = deductResources(player, BUILDING_COSTS.KNIGHT);
  newPlayer.knightsRemaining.basic--;

  let newState = updatePlayer(state, playerId, newPlayer);
  newState = updateVertex(newState, vertexKey, {
    knight: {
      playerId,
      level: KnightLevel.BASIC,
      isActive: false,
      hasActedThisTurn: true // Cannot act on the turn it is hired
    }
  });

  return addActionLog(newState, "hired a Basic Knight", playerId);
}

export function activateKnight(state: GameState, playerId: string, vertexKey: string): GameState {
  const player = getPlayerById(state, playerId);
  const vertex = state.board.vertices[vertexKey];
  
  if (!vertex.knight || vertex.knight.playerId !== playerId) throw new Error("Not your knight");
  if (vertex.knight.isActive) throw new Error("Knight already active");
  if (vertex.knight.hasActedThisTurn) throw new Error("Knight already acted this turn");

  const newPlayer = deductResources(player, BUILDING_COSTS.KNIGHT_ACTIVATE);
  
  let newState = updatePlayer(state, playerId, newPlayer);
  newState = updateVertex(newState, vertexKey, {
    knight: { ...vertex.knight, isActive: true, hasActedThisTurn: true }
  });

  return addActionLog(newState, "activated a Knight", playerId);
}

export function upgradeKnight(state: GameState, playerId: string, vertexKey: string): GameState {
  const player = getPlayerById(state, playerId);
  const vertex = state.board.vertices[vertexKey];
  
  if (!vertex.knight || vertex.knight.playerId !== playerId) throw new Error("Not your knight");
  if (vertex.knight.level === KnightLevel.MIGHTY) throw new Error("Cannot upgrade mighty knight");
  
  if (vertex.knight.level === KnightLevel.STRONG) {
    if (player.improvementLevels[ImprovementTrack.POLITICS] < 3) throw new Error("Need Politics level 3 for Mighty Knights");
    if (player.knightsRemaining.mighty <= 0) throw new Error("No mighty knights remaining");
  } else if (vertex.knight.level === KnightLevel.BASIC) {
    if (player.knightsRemaining.strong <= 0) throw new Error("No strong knights remaining");
  }
  
  if (vertex.knight.hasActedThisTurn) throw new Error("Knight already acted this turn");

  const newPlayer = deductResources(player, BUILDING_COSTS.KNIGHT_UPGRADE);
  
  const newLevel = vertex.knight.level === KnightLevel.BASIC ? KnightLevel.STRONG : KnightLevel.MIGHTY;
  
  if (newLevel === KnightLevel.STRONG) {
    newPlayer.knightsRemaining.basic++;
    newPlayer.knightsRemaining.strong--;
  } else {
    newPlayer.knightsRemaining.strong++;
    newPlayer.knightsRemaining.mighty--;
  }

  let newState = updatePlayer(state, playerId, newPlayer);
  newState = updateVertex(newState, vertexKey, {
    knight: { ...vertex.knight, level: newLevel, hasActedThisTurn: true }
  });

  return addActionLog(newState, `upgraded to ${newLevel} Knight`, playerId);
}
