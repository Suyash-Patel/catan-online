// ============================================================
// Action Executor
// ============================================================

import { GameState, TurnPhase, GamePhase, Player, Resource, Commodity } from '@catan/shared/types/game.js';
import { GameAction } from '@catan/shared/types/actions.js';
import { checkWinCondition, calculateVictoryPoints, getPlayerById } from './game-state.js';
import { buildSettlement, buildCity, buildRoad, deductResources } from './building.js';
import { advanceSetupPhase, awardStartingResources } from './setup-phase.js';
import { rollDice, resolveProduction } from './dice.js';
import { resolveDiscardPhase, moveRobber, stealResource } from './robber.js';
import { executeBankTrade, createTradeOffer, respondToTradeOffer, executePlayerTrade } from './trading.js';
import { buyDevCard, playKnight, playYearOfPlenty, playMonopoly } from './dev-cards.js';
import { updateLongestRoad } from './longest-road.js';
import { initSpecialBuildPhase, passSpecialBuild } from './special-build.js';

export function executeAction(state: GameState, playerId: string, action: GameAction): GameState {
  let newState = { ...state };
  let trackRoad = false;

  switch (action.type) {
    case 'PLACE_INITIAL_SETTLEMENT':
    case 'PLACE_INITIAL_CITY':
      const isCity = action.type === 'PLACE_INITIAL_CITY';
      if (isCity) {
        newState = buildSettlement(newState, playerId, action.vertexKey, true); // base
        newState = buildCity(newState, playerId, action.vertexKey, true); // upgrade
      } else {
        newState = buildSettlement(newState, playerId, action.vertexKey, true);
      }
      
      // Save last placement for road check
      (newState as any)._lastSetupVertex = action.vertexKey;
      
      if (newState.setupRound === 2) {
        newState = awardStartingResources(newState, playerId, action.vertexKey);
      }
      
      newState = advanceSetupPhase(newState, isCity ? 'city' : 'settlement');
      break;
      
    case 'PLACE_INITIAL_ROAD':
      newState = buildRoad(newState, playerId, action.edgeKey, true);
      trackRoad = true;
      newState = advanceSetupPhase(newState, 'road');
      break;
      
    case 'ROLL_DICE':
      const roll = rollDice(newState.citiesAndKnights);
      newState.lastRoll = roll;
      
      // Resolve Event Die first if C&K
      if (newState.citiesAndKnights && roll.event) {
        // TODO: CK event resolution
        // newState = resolveEventDie(newState, roll.event, roll.red);
      }

      // Then Production
      if (roll.total === 7) {
        newState = resolveDiscardPhase(newState);
      } else {
        newState = resolveProduction(newState, roll.total);
        newState.turnPhase = TurnPhase.POST_ROLL;
      }
      
      newState.actionLog = [...newState.actionLog, {
        id: Math.random().toString(),
        timestamp: Date.now(),
        playerId,
        type: 'action',
        message: `rolled a ${roll.total}`
      }];
      break;

    case 'END_TURN':
      if (newState.settings.playerCount >= 5) {
        newState = initSpecialBuildPhase(newState);
      } else {
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.turnOrder.length;
        newState.turnPhase = TurnPhase.PRE_ROLL;
        newState.turnNumber++;
        
        // Reset turn flags
        newState.players = newState.players.map((p: any) => ({
          ...p,
          hasPlayedDevCardThisTurn: false,
          devCardsBoughtThisTurn: []
        }));
        newState.alchemistActive = false;
        newState.alchemistValues = null;
        newState.merchantFleetResource = null;
      }
      break;

    case 'BUILD_SETTLEMENT':
      newState = buildSettlement(newState, playerId, action.vertexKey, false);
      break;
      
    case 'BUILD_CITY':
      newState = buildCity(newState, playerId, action.vertexKey, false);
      break;
      
    case 'BUILD_ROAD':
      newState = buildRoad(newState, playerId, action.edgeKey, false);
      trackRoad = true;
      break;

    case 'DISCARD_CARDS':
      const player = getPlayerById(newState, playerId);
      const newR = { ...player.resources };
      const newC = { ...player.commodities };
      
      for (const r of Object.keys(action.resources) as Resource[]) {
        newR[r] -= (action.resources as Record<Resource, number>)[r];
      }
      if (action.commodities) {
        for (const c of Object.keys(action.commodities) as Commodity[]) {
          newC[c] -= (action.commodities as Record<Commodity, number>)[c];
        }
      }
      
      newState.players = newState.players.map((p: any) => 
        p.id === playerId ? { ...p, resources: newR, commodities: newC } : p
      );
      
      delete newState.pendingDiscards[playerId];
      
      if (Object.keys(newState.pendingDiscards).length === 0) {
        newState.turnPhase = TurnPhase.ROBBER_MOVE;
      }
      break;
      
    case 'MOVE_ROBBER':
      newState = moveRobber(newState, action.hexKey);
      break;
      
    case 'STEAL_RESOURCE':
      newState = stealResource(newState, action.targetPlayerId);
      newState.pendingStealFrom = [];
      newState.turnPhase = TurnPhase.POST_ROLL;
      break;

    case 'BANK_TRADE':
      newState = executeBankTrade(newState, playerId, action.give, action.receive);
      break;
      
    case 'PASS_SPECIAL_BUILD':
      newState = passSpecialBuild(newState);
      break;

    // TODO: Other Base actions and C&K actions...
  }

  // Post-action state checks
  if (trackRoad) {
    newState = updateLongestRoad(newState);
  }

  // Recalculate VPs
  newState.players = newState.players.map((p: any) => ({
    ...p,
    victoryPoints: calculateVictoryPoints(newState, p.id)
  }));

  // Check Win
  const winner = checkWinCondition(newState);
  if (winner) {
    newState.winnerPlayerId = winner;
    newState.phase = GamePhase.FINISHED;
    newState.turnPhase = TurnPhase.GAME_OVER;
  }

  return newState;
}
