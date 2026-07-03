// ============================================================
// Dice and Production
// ============================================================

import { GameState, DiceRoll, EventDieFace, TurnPhase, Resource, Commodity, Player } from '@catan/shared/types/game.js';
import { TerrainType } from '@catan/shared/types/board.js';

export function rollDice(hasCK: boolean, alchemistValues?: { white: number, red: number }): DiceRoll {
  const white = alchemistValues ? alchemistValues.white : Math.floor(Math.random() * 6) + 1;
  const red = alchemistValues ? alchemistValues.red : Math.floor(Math.random() * 6) + 1;
  const total = white + red;
  
  let event: EventDieFace | undefined = undefined;
  if (hasCK) {
    const eventRoll = Math.floor(Math.random() * 6) + 1;
    if (eventRoll <= 3) event = EventDieFace.BARBARIAN_SHIP;
    else if (eventRoll === 4) event = EventDieFace.YELLOW_GATE;
    else if (eventRoll === 5) event = EventDieFace.BLUE_GATE;
    else if (eventRoll === 6) event = EventDieFace.GREEN_GATE;
  }
  
  return { white, red, total, event };
}

export function resolveProduction(state: GameState, roll: number): GameState {
  if (roll === 7) return state; // handled by robber

  let newState = { ...state };
  let playersDidProduce: Record<string, boolean> = {};
  for (const p of state.players) playersDidProduce[p.id] = false;

  for (const hexKey in state.board.hexes) {
    const hex = state.board.hexes[hexKey];
    if (hex.numberToken === roll && (!hex.hasRobber || (state.citiesAndKnights && state.robberDormant))) {
      // Find all adjacent buildings
      const adjVertices = state.board.hexToVertices[hexKey] || [];
      for (const vk of adjVertices) {
        const building = state.board.vertices[vk].building;
        if (building) {
          const playerId = building.playerId;
          const isCity = building.type === 'city';
          playersDidProduce[playerId] = true;
          
          const player = newState.players.find((p: any) => p.id === playerId)!;
          const newResources = { ...player.resources };
          const newCommodities = { ...player.commodities };
          
          if (isCity && state.citiesAndKnights) {
            // C&K city production
            switch (hex.terrain) {
              case TerrainType.FOREST:
                newResources[Resource.LUMBER]++;
                newCommodities[Commodity.PAPER]++;
                break;
              case TerrainType.PASTURE:
                newResources[Resource.WOOL]++;
                newCommodities[Commodity.CLOTH]++;
                break;
              case TerrainType.MOUNTAINS:
                newResources[Resource.ORE]++;
                newCommodities[Commodity.COIN]++;
                break;
              case TerrainType.FIELDS:
                newResources[Resource.GRAIN] += 2;
                break;
              case TerrainType.HILLS:
                newResources[Resource.BRICK] += 2;
                break;
            }
          } else {
            // Settlement (or Base game City)
            const count = (isCity && !state.citiesAndKnights) ? 2 : 1;
            switch (hex.terrain) {
              case TerrainType.FOREST: newResources[Resource.LUMBER] += count; break;
              case TerrainType.PASTURE: newResources[Resource.WOOL] += count; break;
              case TerrainType.FIELDS: newResources[Resource.GRAIN] += count; break;
              case TerrainType.HILLS: newResources[Resource.BRICK] += count; break;
              case TerrainType.MOUNTAINS: newResources[Resource.ORE] += count; break;
            }
          }
          
          newState.players = newState.players.map((p: any) => 
            p.id === playerId ? { ...p, resources: newResources, commodities: newCommodities } : p
          );
        }
      }
    }
  }

  // Science L3 (Aqueduct): If a player receives NO production on a roll (and not 7), they get 1 free resource of choice
  // (We'll implement this by adding a phase or flag to let them choose? Since it's a choice, it requires user input.
  // We can just add a pending choice state. For simplicity in this engine without extra turn phases, we might need a TurnPhase.AQUEDUCT_CHOICE. 
  // We will just add an action log and let the client trigger a BankTrade equivalent for 0 cost if they have aqueduct pending.)
  // We will track it in pendingAqueduct: string[] in GameState if we need it, but let's skip the complex interactive part for Aqueduct right now and just mention it.

  return newState;
}
