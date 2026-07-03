// ============================================================
// Event Die Resolution
// ============================================================

import { GameState, EventDieFace } from '@catan/shared/types/game.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';
import { getPlayerById } from '../engine/game-state.js';
import { drawProgressCard } from './progress-cards.js';
import { advanceBarbarianShip } from './barbarians.js';
import { addActionLog } from './utils.js';

export function resolveEventDie(state: GameState, event: EventDieFace, redDie: number): GameState {
  let newState = { ...state };
  
  if (event === EventDieFace.BARBARIAN_SHIP) {
    newState = advanceBarbarianShip(newState);
  } else {
    let track: ImprovementTrack;
    if (event === EventDieFace.YELLOW_GATE) track = ImprovementTrack.TRADE;
    else if (event === EventDieFace.BLUE_GATE) track = ImprovementTrack.POLITICS;
    else track = ImprovementTrack.SCIENCE; // GREEN_GATE
    
    // For each player, if their level >= redDie (where levels 1-3 match die 1-3, etc... wait)
    // Rule: The red die shows a number (1-6). The improvement track has dice patterns at each level.
    // L1: 1,2 | L2: 1,2,3 | L3: 1,2,3,4 | L4: 1,2,3,4,5 | L5: 1,2,3,4,5,6
    // Actually, usually L1 unlocks at 3, L2 at 4, L3 at 5, L4 at 6, etc.
    // Let's check the exact C&K rule:
    // Level 1: red die = 1, 2
    // Level 2: red die = 1, 2, 3
    // Level 3: red die = 1, 2, 3, 4
    // Level 4: red die = 1, 2, 3, 4, 5
    // Level 5: red die = 1, 2, 3, 4, 5, 6
    // So player draws if redDie <= (player level + 1)?
    // No, wait:
    // L1: red die 1 or 2 -> draws? Yes.
    // L2: red die 1, 2, 3 -> draws? Yes.
    // So if (redDie <= player.level[track] + 1), wait, if level is 0, redDie can never be <= 1?
    // At level 0, you never draw. So if level === 0, no draw.
    // If level === 1, draw on 1, 2. (redDie <= 2)
    // If level === 2, draw on 1, 2, 3. (redDie <= 3)
    // If level === 3, draw on 1, 2, 3, 4. (redDie <= 4)
    // If level === 4, draw on 1, 2, 3, 4, 5. (redDie <= 5)
    // If level === 5, draw on 1-6. (redDie <= 6)
    // Formula: level > 0 && redDie <= level + 1
    
    for (const player of newState.players) {
      const level = player.improvementLevels[track];
      if (level > 0 && redDie <= level + 1) {
        newState = drawProgressCard(newState, player.id, track);
        newState = addActionLog(newState, `drew a ${track} progress card`, player.id);
      }
    }
  }
  
  return newState;
}
