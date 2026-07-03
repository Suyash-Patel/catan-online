// ============================================================
// Robber Logic
// ============================================================

import { GameState, TurnPhase, Resource, Commodity } from '@catan/shared/types/game.js';
import { BASE_HAND_LIMIT, CITY_WALL_HAND_BONUS } from '@catan/shared/constants/costs.js';
import { getPlayerById } from './game-state.js';

export function resolveDiscardPhase(state: GameState): GameState {
  let newState = { ...state, pendingDiscards: {} as Record<string, number> };
  let needsDiscard = false;

  for (const player of state.players) {
    const resourceCount = Object.values(player.resources).reduce((a: any, b: any) => a + b, 0);
    const commodityCount = Object.values(player.commodities).reduce((a: any, b: any) => a + b, 0);
    const totalCards = resourceCount + commodityCount;
    
    const limit = BASE_HAND_LIMIT + (player.cityWallCount * CITY_WALL_HAND_BONUS);
    
    if (totalCards > limit) {
      newState.pendingDiscards[player.id] = Math.floor(totalCards / 2);
      needsDiscard = true;
    }
  }

  if (needsDiscard) {
    newState.turnPhase = TurnPhase.DISCARD;
  } else {
    newState.turnPhase = TurnPhase.ROBBER_MOVE;
  }

  return newState;
}

export function getStealTargets(state: GameState, hexKey: string): string[] {
  const targets = new Set<string>();
  const activePlayer = state.turnOrder[state.currentPlayerIndex];
  
  const adjVertices = state.board.hexToVertices[hexKey] || [];
  for (const vk of adjVertices) {
    const building = state.board.vertices[vk].building;
    if (building && building.playerId !== activePlayer) {
      // Must have at least 1 card to steal
      const p = getPlayerById(state, building.playerId);
      const total = Object.values(p.resources).reduce((a: any, b: any) => a + b, 0) + 
                    Object.values(p.commodities).reduce((a: any, b: any) => a + b, 0);
      if (total > 0) {
        targets.add(building.playerId);
      }
    }
  }
  return Array.from(targets);
}

export function moveRobber(state: GameState, hexKey: string): GameState {
  let newState = { ...state };
  
  // Remove from old hex
  const oldHexKey = Object.keys(newState.board.hexes).find(k => newState.board.hexes[k].hasRobber);
  if (oldHexKey) {
    newState.board = {
      ...newState.board,
      hexes: {
        ...newState.board.hexes,
        [oldHexKey]: { ...newState.board.hexes[oldHexKey], hasRobber: false }
      }
    };
  }

  // Add to new hex
  newState.board = {
    ...newState.board,
    hexes: {
      ...newState.board.hexes,
      [hexKey]: { ...newState.board.hexes[hexKey], hasRobber: true }
    }
  };
  
  newState.robberHex = newState.board.hexes[hexKey].coord;

  // Find steal targets
  const targets = getStealTargets(newState, hexKey);
  if (targets.length === 0) {
    newState.turnPhase = TurnPhase.POST_ROLL;
  } else if (targets.length === 1) {
    // Auto-steal if only 1 target
    newState = stealResource(newState, targets[0]);
    newState.turnPhase = TurnPhase.POST_ROLL;
  } else {
    newState.pendingStealFrom = targets;
    newState.turnPhase = TurnPhase.ROBBER_STEAL;
  }

  return newState;
}

export function stealResource(state: GameState, targetPlayerId: string): GameState {
  const target = getPlayerById(state, targetPlayerId);
  const activePlayerId = state.turnOrder[state.currentPlayerIndex];
  const active = getPlayerById(state, activePlayerId);

  // Pool all cards
  const pool: Array<{ type: 'resource' | 'commodity', val: Resource | Commodity }> = [];
  
  for (const r of Object.keys(target.resources) as Resource[]) {
    for (let i = 0; i < target.resources[r]; i++) pool.push({ type: 'resource', val: r });
  }
  for (const c of Object.keys(target.commodities) as Commodity[]) {
    for (let i = 0; i < target.commodities[c]; i++) pool.push({ type: 'commodity', val: c });
  }

  if (pool.length === 0) return state;

  const idx = Math.floor(Math.random() * pool.length);
  const stolen = pool[idx];

  const newTargetR = { ...target.resources };
  const newTargetC = { ...target.commodities };
  const newActiveR = { ...active.resources };
  const newActiveC = { ...active.commodities };

  if (stolen.type === 'resource') {
    newTargetR[stolen.val as Resource]--;
    newActiveR[stolen.val as Resource]++;
  } else {
    newTargetC[stolen.val as Commodity]--;
    newActiveC[stolen.val as Commodity]++;
  }

  return {
    ...state,
    players: state.players.map((p: any) => {
      if (p.id === targetPlayerId) return { ...p, resources: newTargetR, commodities: newTargetC };
      if (p.id === activePlayerId) return { ...p, resources: newActiveR, commodities: newActiveC };
      return p;
    })
  };
}
