// ============================================================
// City Walls
// ============================================================

import { GameState } from '@catan/shared/types/game.js';
import { BUILDING_COSTS } from '@catan/shared/constants/costs.js';
import { getPlayerById } from '../engine/game-state.js';
import { deductResources, updatePlayer, updateVertex, addActionLog } from './utils.js';

export function buildCityWall(state: GameState, playerId: string, vertexKey: string): GameState {
  const player = getPlayerById(state, playerId);
  if (player.cityWallCount >= 3) throw new Error("Maximum of 3 city walls reached");
  
  const vertex = state.board.vertices[vertexKey];
  if (!vertex.building || vertex.building.playerId !== playerId) throw new Error("Not your building");
  if (vertex.building.type !== 'city') throw new Error("City walls can only be built on cities");
  if (vertex.building.hasCityWall) throw new Error("City already has a wall");

  const newPlayer = deductResources(player, BUILDING_COSTS.CITY_WALL);
  newPlayer.cityWallCount++;

  let newState = updatePlayer(state, playerId, newPlayer);
  newState = updateVertex(newState, vertexKey, {
    building: { ...vertex.building, hasCityWall: true }
  });

  return addActionLog(newState, "built a City Wall", playerId);
}
