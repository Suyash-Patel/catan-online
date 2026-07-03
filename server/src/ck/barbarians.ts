// ============================================================
// Barbarians
// ============================================================

import { GameState } from '@catan/shared/types/game.js';
import { getPlayerById, calculateVictoryPoints } from '../engine/game-state.js';
import { updatePlayer, updateVertex, addActionLog } from './utils.js';

export function advanceBarbarianShip(state: GameState): GameState {
  let newState = { ...state };
  newState.barbarianState = {
    ...newState.barbarianState,
    position: newState.barbarianState.position + 1
  };
  
  if (newState.barbarianState.position >= newState.barbarianState.trackLength) {
    newState = resolveBarbarianAttack(newState);
    newState.barbarianState.position = 0;
    newState.barbarianState.hasAttackedOnce = true;
    newState.robberDormant = false; // Robber unlocked after first attack
  }
  
  return newState;
}

export function resolveBarbarianAttack(state: GameState): GameState {
  let newState = { ...state };
  
  // 1. Calculate Barbarian Strength
  let barbarianStrength = 0;
  for (const vertex of Object.values(newState.board.vertices)) {
    if (vertex.building && vertex.building.type === 'city') {
      // Note: Metropolises DO count towards barbarian strength
      barbarianStrength++;
    }
  }
  
  // 2. Calculate Defender Strength (by player and total)
  let totalDefense = 0;
  const playerDefense: Record<string, number> = {};
  for (const player of newState.players) playerDefense[player.id] = 0;
  
  for (const vertex of Object.values(newState.board.vertices)) {
    if (vertex.knight && vertex.knight.isActive) {
      const strength = vertex.knight.level; // Basic=1, Strong=2, Mighty=3
      playerDefense[vertex.knight.playerId] += strength;
      totalDefense += strength;
    }
  }
  
  // 3. Resolve
  if (totalDefense >= barbarianStrength) {
    // Defenders win
    newState = addActionLog(newState, `Defenders won! (${totalDefense} vs ${barbarianStrength})`);
    
    // Find highest contributor(s)
    let max = -1;
    for (const id in playerDefense) {
      if (playerDefense[id] > max) max = playerDefense[id];
    }
    
    if (max > 0) { // Must have contributed something
      const winners = Object.keys(playerDefense).filter(id => playerDefense[id] === max);
      
      if (winners.length === 1) {
        // Defender of Catan VP
        if (newState.defenderCardsRemaining > 0) {
          newState.defenderCardsRemaining--;
          const player = getPlayerById(newState, winners[0]);
          newState = updatePlayer(newState, winners[0], { defenderOfCatanCount: player.defenderOfCatanCount + 1 });
          newState = addActionLog(newState, `Defender of Catan awarded to ${player.name}`, winners[0]);
        } else {
          // No VP cards left, draw progress card (rare)
          // Just skip for now to simplify
        }
      } else {
        // Ties draw a progress card of choice
        // For simplicity in this engine, we will log it. In a real implementation they'd get a choice phase.
        newState = addActionLog(newState, `Tied defenders: ${winners.join(', ')} (Progress card choice pending)`);
      }
    }
  } else {
    // Barbarians win
    newState = addActionLog(newState, `Barbarians won! (${barbarianStrength} vs ${totalDefense})`);
    
    // Find lowest contributor(s)
    let min = Infinity;
    for (const player of newState.players) {
      if (playerDefense[player.id] < min) min = playerDefense[player.id];
    }
    
    const losers = Object.keys(playerDefense).filter(id => playerDefense[id] === min);
    
    for (const loserId of losers) {
      // Pillage a city
      // They lose one city (downgraded to settlement). Metropolises are immune.
      // If they only have settlements, nothing happens.
      // If they have multiple cities, they choose one. We'll auto-choose one for now to avoid blocking the game loop.
      
      let targetCity: string | null = null;
      for (const [key, vertex] of Object.entries(newState.board.vertices)) {
        if (vertex.building && vertex.building.playerId === loserId && vertex.building.type === 'city' && !vertex.building.hasMetropolis) {
          targetCity = key;
          break;
        }
      }
      
      if (targetCity) {
        const player = getPlayerById(newState, loserId);
        newState = updatePlayer(newState, loserId, {
          citiesRemaining: player.citiesRemaining + 1,
          settlementsRemaining: player.settlementsRemaining - 1
        });
        
        // City wall is destroyed when pillaged
        const hadWall = newState.board.vertices[targetCity].building!.hasCityWall;
        if (hadWall) {
          newState = updatePlayer(newState, loserId, { cityWallCount: player.cityWallCount - 1 });
        }
        
        newState = updateVertex(newState, targetCity, {
          building: { playerId: loserId, type: 'settlement', hasCityWall: false, hasMetropolis: false }
        });
        
        newState = addActionLog(newState, `City pillaged!`, loserId);
      }
    }
  }
  
  // 4. Deactivate all knights
  for (const [key, vertex] of Object.entries(newState.board.vertices)) {
    if (vertex.knight && vertex.knight.isActive) {
      newState = updateVertex(newState, key, {
        knight: { ...vertex.knight, isActive: false }
      });
    }
  }
  
  // Recalculate VPs
  newState.players = newState.players.map((p: any) => ({
    ...p,
    victoryPoints: calculateVictoryPoints(newState, p.id)
  }));
  
  return newState;
}
