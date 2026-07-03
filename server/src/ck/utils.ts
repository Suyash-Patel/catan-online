// ============================================================
// C&K Utilities
// ============================================================

import { GameState, Player, Resource, Commodity } from '@catan/shared/types/game.js';
import { getPlayerById } from '../engine/game-state.js';
import { deductResources as engineDeductR, hasResources as engineHasR } from '../engine/building.js';
import { Vertex } from '@catan/shared/types/board.js';

export const deductResources = engineDeductR;
export const hasResources = engineHasR;

export function hasCommodities(player: Player, cost: Partial<Record<Commodity, number>>): boolean {
  for (const c of Object.keys(cost) as Commodity[]) {
    if (player.commodities[c] < (cost[c] || 0)) {
      return false;
    }
  }
  return true;
}

export function deductCommodities(player: Player, cost: Partial<Record<Commodity, number>>): Player {
  const newCommodities = { ...player.commodities };
  for (const c of Object.keys(cost) as Commodity[]) {
    newCommodities[c] -= (cost[c] || 0);
  }
  return { ...player, commodities: newCommodities };
}

export function addResources(player: Player, add: Partial<Record<Resource, number>>): Player {
  const newR = { ...player.resources };
  for (const r of Object.keys(add) as Resource[]) {
    newR[r] += (add[r] || 0);
  }
  return { ...player, resources: newR };
}

export function addCommodities(player: Player, add: Partial<Record<Commodity, number>>): Player {
  const newC = { ...player.commodities };
  for (const c of Object.keys(add) as Commodity[]) {
    newC[c] += (add[c] || 0);
  }
  return { ...player, commodities: newC };
}

export function getPlayerBuildings(state: GameState, playerId: string): Array<{ vertexKey: string, vertex: Vertex }> {
  const results = [];
  for (const [key, vertex] of Object.entries(state.board.vertices)) {
    if (vertex.building && vertex.building.playerId === playerId) {
      results.push({ vertexKey: key, vertex });
    }
  }
  return results;
}

export function getPlayerKnights(state: GameState, playerId: string): Array<{ vertexKey: string, vertex: Vertex }> {
  const results = [];
  for (const [key, vertex] of Object.entries(state.board.vertices)) {
    if (vertex.knight && vertex.knight.playerId === playerId) {
      results.push({ vertexKey: key, vertex });
    }
  }
  return results;
}

export function updatePlayer(state: GameState, playerId: string, updates: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map((p: any) => p.id === playerId ? { ...p, ...updates } : p)
  };
}

export function updateVertex(state: GameState, vertexKey: string, updates: Partial<Vertex>): GameState {
  return {
    ...state,
    board: {
      ...state.board,
      vertices: {
        ...state.board.vertices,
        [vertexKey]: { ...state.board.vertices[vertexKey], ...updates }
      }
    }
  };
}

export function addActionLog(state: GameState, message: string, playerId?: string): GameState {
  return {
    ...state,
    actionLog: [
      ...state.actionLog,
      {
        id: Math.random().toString(),
        timestamp: Date.now(),
        type: 'action',
        message,
        playerId
      }
    ]
  };
}
