// ============================================================
// City Improvements
// ============================================================

import { GameState, Commodity } from '@catan/shared/types/game.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';
import { getPlayerById } from '../engine/game-state.js';
import { deductCommodities, updatePlayer, addActionLog } from './utils.js';

export function upgradeImprovement(state: GameState, playerId: string, track: ImprovementTrack): GameState {
  const player = getPlayerById(state, playerId);
  const currentLevel = player.improvementLevels[track];
  
  if (currentLevel >= 5) throw new Error("Track already at max level");
  
  // Must have at least one city to improve (metropolises count as cities)
  let hasCity = false;
  for (const vertex of Object.values(state.board.vertices)) {
    if (vertex.building && vertex.building.playerId === playerId && vertex.building.type === 'city') {
      hasCity = true;
      break;
    }
  }
  if (!hasCity) throw new Error("Need at least one city to buy improvements");

  const costAmount = currentLevel + 1;
  const commodityType = track === ImprovementTrack.TRADE ? Commodity.CLOTH 
                      : track === ImprovementTrack.POLITICS ? Commodity.COIN 
                      : Commodity.PAPER;
                      
  const cost = { [commodityType]: costAmount };
  
  const newPlayer = deductCommodities(player, cost);
  newPlayer.improvementLevels = { ...newPlayer.improvementLevels, [track]: currentLevel + 1 };
  
  let newState = updatePlayer(state, playerId, newPlayer);
  newState = addActionLog(newState, `upgraded ${track} to level ${currentLevel + 1}`, playerId);

  // If level 4 reached, check for metropolis assignment
  if (currentLevel + 1 >= 4) {
    // We defer to a metropolis assignment function that will check if they get it
    // For now we just import and call it
    // return assignMetropolis(newState, playerId, track);
  }

  return newState;
}
