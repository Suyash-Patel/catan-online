// ============================================================
// Building Rules & Execution
// ============================================================

import { GameState, Player, Resource, TurnPhase, GamePhase } from '@catan/shared/types/game.js';
import { BUILDING_COSTS, SUPPLY_LIMITS } from '@catan/shared/constants/costs.js';
import { getPlayerById } from './game-state.js';

/**
 * Check if the distance rule is satisfied (no adjacent buildings).
 */
export function checkDistanceRule(state: GameState, vertexKey: string): boolean {
  const adjacentVertices = state.board.vertexToVertices[vertexKey] || [];
  for (const adjKey of adjacentVertices) {
    if (state.board.vertices[adjKey].building !== null) {
      return false; // Found a building on an adjacent vertex
    }
  }
  return true;
}

/**
 * Check if the player has a road connected to this vertex.
 */
export function hasConnectedRoadToVertex(state: GameState, playerId: string, vertexKey: string): boolean {
  const adjacentEdges = state.board.vertexToEdges[vertexKey] || [];
  for (const edgeKey of adjacentEdges) {
    const road = state.board.edges[edgeKey].road;
    if (road && road.playerId === playerId) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the player has a road connected to this edge.
 * It must connect via a vertex that doesn't have an OPPONENT'S building blocking it.
 */
export function hasConnectedRoadToEdge(state: GameState, playerId: string, edgeKey: string): boolean {
  const [v1, v2] = state.board.edgeToVertices[edgeKey];
  
  const checkConnectionThroughVertex = (vKey: string) => {
    const building = state.board.vertices[vKey].building;
    // If there's an opponent building here, it blocks road connections
    if (building && building.playerId !== playerId) {
      return false;
    }
    // C&K: Opponent knights also block roads
    if (state.citiesAndKnights) {
      const knight = state.board.vertices[vKey].knight;
      if (knight && knight.playerId !== playerId) {
        return false;
      }
    }
    
    // Check other edges at this vertex
    const adjEdges = state.board.vertexToEdges[vKey] || [];
    for (const adjEdgeKey of adjEdges) {
      if (adjEdgeKey === edgeKey) continue;
      const road = state.board.edges[adjEdgeKey].road;
      if (road && road.playerId === playerId) {
        return true;
      }
    }
    return false;
  };

  return checkConnectionThroughVertex(v1) || checkConnectionThroughVertex(v2);
}

/**
 * Check if a player has enough resources.
 */
export function hasResources(player: Player, cost: Partial<Record<Resource, number>>): boolean {
  for (const r of Object.keys(cost) as Resource[]) {
    if (player.resources[r] < (cost[r] || 0)) {
      return false;
    }
  }
  return true;
}

export function deductResources(player: Player, cost: Partial<Record<Resource, number>>): Player {
  const newResources = { ...player.resources };
  for (const r of Object.keys(cost) as Resource[]) {
    newResources[r] -= (cost[r] || 0);
  }
  return { ...player, resources: newResources };
}

export function canBuildSettlement(state: GameState, playerId: string, vertexKey: string, isSetup = false): { valid: boolean, error?: string } {
  const player = getPlayerById(state, playerId);
  if (player.settlementsRemaining <= 0) return { valid: false, error: "No settlements remaining" };
  
  const vertex = state.board.vertices[vertexKey];
  if (!vertex) return { valid: false, error: "Invalid vertex" };
  if (vertex.building) return { valid: false, error: "Vertex already occupied" };
  
  if (!checkDistanceRule(state, vertexKey)) return { valid: false, error: "Distance rule violated" };
  
  // Check if vertex touches at least one land hex (not SEA)
  const adjacentHexes = state.board.vertexToHexes[vertexKey] || [];
  const touchesLand = adjacentHexes.some(hk => {
    const hex = state.board.hexes[hk];
    return hex && hex.terrain !== 'SEA';
  });
  if (!touchesLand) return { valid: false, error: "Cannot build in the ocean" };
  
  if (!isSetup) {
    if (!hasConnectedRoadToVertex(state, playerId, vertexKey)) return { valid: false, error: "Must connect to road" };
    if (!hasResources(player, BUILDING_COSTS.SETTLEMENT)) return { valid: false, error: "Not enough resources" };
  }
  
  return { valid: true };
}

export function buildSettlement(state: GameState, playerId: string, vertexKey: string, isSetup = false): GameState {
  const player = getPlayerById(state, playerId);
  const cost = isSetup ? {} : BUILDING_COSTS.SETTLEMENT;
  
  const newPlayer = deductResources(player, cost);
  newPlayer.settlementsRemaining--;

  const newState = { ...state, players: state.players.map((p: any) => p.id === playerId ? newPlayer : p) };
  newState.board = { ...state.board, vertices: { ...state.board.vertices, [vertexKey]: { ...state.board.vertices[vertexKey], building: { playerId, type: 'settlement', hasCityWall: false, hasMetropolis: false } } } };
  
  return newState;
}

export function canBuildCity(state: GameState, playerId: string, vertexKey: string, isSetup = false): { valid: boolean, error?: string } {
  const player = getPlayerById(state, playerId);
  if (player.citiesRemaining <= 0) return { valid: false, error: "No cities remaining" };
  
  const vertex = state.board.vertices[vertexKey];
  if (!vertex) return { valid: false, error: "Invalid vertex" };
  if (!vertex.building || vertex.building.type !== 'settlement' || vertex.building.playerId !== playerId) {
    return { valid: false, error: "Must upgrade own settlement" };
  }
  
  if (!isSetup) {
    // Check if player has Medicine card effect applied? For now, we assume base cost. 
    // Medicine card is played as an action, not a passive cost reduction.
    // Wait, the Medicine card lets you upgrade for 2 Ore + 1 Grain AS the card's effect.
    // So normal buildCity is always standard cost.
    if (!hasResources(player, BUILDING_COSTS.CITY)) return { valid: false, error: "Not enough resources" };
  }
  
  return { valid: true };
}

export function buildCity(state: GameState, playerId: string, vertexKey: string, isSetup = false, overrideCost?: Partial<Record<Resource, number>>): GameState {
  const player = getPlayerById(state, playerId);
  const cost = isSetup ? {} : (overrideCost || BUILDING_COSTS.CITY);
  
  const newPlayer = deductResources(player, cost);
  newPlayer.citiesRemaining--;
  newPlayer.settlementsRemaining++; // Return settlement to supply

  const newState = { ...state, players: state.players.map((p: any) => p.id === playerId ? newPlayer : p) };
  
  // Preserve existing building properties (like walls/metropolis, though normal settlements don't have them, C&K might have weird edge cases)
  const existingBuilding = state.board.vertices[vertexKey].building!;
  
  newState.board = { 
    ...state.board, 
    vertices: { 
      ...state.board.vertices, 
      [vertexKey]: { 
        ...state.board.vertices[vertexKey], 
        building: { ...existingBuilding, type: 'city' } 
      } 
    } 
  };
  
  return newState;
}

export function canBuildRoad(state: GameState, playerId: string, edgeKey: string, isSetup = false, setupVertexKey?: string): { valid: boolean, error?: string } {
  const player = getPlayerById(state, playerId);
  if (player.roadsRemaining <= 0) return { valid: false, error: "No roads remaining" };
  
  const edge = state.board.edges[edgeKey];
  if (!edge) return { valid: false, error: "Invalid edge" };
  if (edge.road) return { valid: false, error: "Edge already occupied" };
  
  if (isSetup && setupVertexKey) {
    // In setup, the road must connect to the newly built settlement/city
    const isAdjacentToVertex = state.board.edgeToVertices[edgeKey].includes(setupVertexKey);
    if (!isAdjacentToVertex) return { valid: false, error: "Road must connect to newly placed building" };
  } else {
    if (!hasConnectedRoadToEdge(state, playerId, edgeKey)) return { valid: false, error: "Must connect to own road or building" };
    if (!hasResources(player, BUILDING_COSTS.ROAD)) return { valid: false, error: "Not enough resources" };
  }
  
  return { valid: true };
}

export function buildRoad(state: GameState, playerId: string, edgeKey: string, isSetup = false): GameState {
  const player = getPlayerById(state, playerId);
  const cost = isSetup ? {} : BUILDING_COSTS.ROAD;
  
  const newPlayer = deductResources(player, cost);
  newPlayer.roadsRemaining--;

  const newState = { ...state, players: state.players.map((p: any) => p.id === playerId ? newPlayer : p) };
  newState.board = { ...state.board, edges: { ...state.board.edges, [edgeKey]: { ...state.board.edges[edgeKey], road: { playerId } } } };
  
  return newState;
}
