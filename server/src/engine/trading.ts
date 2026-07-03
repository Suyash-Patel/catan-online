// ============================================================
// Trading System
// ============================================================

import { GameState, TradeOffer, Resource, Commodity, Player } from '@catan/shared/types/game.js';
import { PortType } from '@catan/shared/types/board.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';
import { getPlayerById } from './game-state.js';

export function getPlayerTradeRatios(state: GameState, playerId: string) {
  const player = getPlayerById(state, playerId);
  
  // Default ratio is 4:1 for everything
  const ratios: Record<string, number> = {
    [Resource.BRICK]: 4,
    [Resource.LUMBER]: 4,
    [Resource.ORE]: 4,
    [Resource.GRAIN]: 4,
    [Resource.WOOL]: 4,
    [Commodity.PAPER]: 4,
    [Commodity.CLOTH]: 4,
    [Commodity.COIN]: 4,
  };

  // Find player's coastal buildings
  for (const port of state.board.ports) {
    let hasAccess = false;
    for (const vk of port.vertices) {
      const building = state.board.vertices[vk].building;
      if (building && building.playerId === playerId) {
        hasAccess = true;
        break;
      }
    }
    
    if (hasAccess) {
      if (port.type === PortType.GENERAL_3_1) {
        // Only update if current is 4 (don't overwrite a 2:1 port)
        for (const key of Object.keys(ratios)) {
          if (ratios[key] === 4) ratios[key] = 3;
        }
      } else if (port.type === PortType.BRICK_2_1) ratios[Resource.BRICK] = 2;
      else if (port.type === PortType.LUMBER_2_1) ratios[Resource.LUMBER] = 2;
      else if (port.type === PortType.ORE_2_1) ratios[Resource.ORE] = 2;
      else if (port.type === PortType.GRAIN_2_1) ratios[Resource.GRAIN] = 2;
      else if (port.type === PortType.WOOL_2_1) ratios[Resource.WOOL] = 2;
    }
  }

  // C&K: Merchant provides 2:1 for the specific resource
  if (state.citiesAndKnights && state.merchant && state.merchant.playerId === playerId) {
    const hex = state.board.hexes[state.merchant.hexKey];
    if (hex) {
      switch (hex.terrain) {
        case 'HILLS': ratios[Resource.BRICK] = 2; break;
        case 'FOREST': ratios[Resource.LUMBER] = 2; break;
        case 'MOUNTAINS': ratios[Resource.ORE] = 2; break;
        case 'FIELDS': ratios[Resource.GRAIN] = 2; break;
        case 'PASTURE': ratios[Resource.WOOL] = 2; break;
      }
    }
  }

  // C&K: Trade L3 provides 2:1 for ALL commodities
  if (state.citiesAndKnights && player.improvementLevels[ImprovementTrack.TRADE] >= 3) {
    ratios[Commodity.PAPER] = 2;
    ratios[Commodity.CLOTH] = 2;
    ratios[Commodity.COIN] = 2;
  }
  
  // C&K: Merchant Fleet provides 2:1 for chosen resource/commodity
  if (state.citiesAndKnights && state.merchantFleetResource && state.turnOrder[state.currentPlayerIndex] === playerId) {
    ratios[state.merchantFleetResource] = 2;
  }

  return ratios;
}

export function executeBankTrade(state: GameState, playerId: string, give: { type: Resource | Commodity; amount: number }, receive: { type: Resource | Commodity; amount: number }): GameState {
  const ratios = getPlayerTradeRatios(state, playerId);
  const ratio = ratios[give.type];
  
  if (give.amount !== receive.amount * ratio) {
    throw new Error(`Invalid trade ratio. Required ${ratio}:1, got ${give.amount}:${receive.amount}`);
  }

  const player = getPlayerById(state, playerId);
  const newResources = { ...player.resources };
  const newCommodities = { ...player.commodities };

  // Deduct give
  if (give.type in Resource) newResources[give.type as Resource] -= give.amount;
  else newCommodities[give.type as Commodity] -= give.amount;

  // Add receive
  if (receive.type in Resource) newResources[receive.type as Resource] += receive.amount;
  else newCommodities[receive.type as Commodity] += receive.amount;

  return {
    ...state,
    players: state.players.map((p: any) => p.id === playerId ? { ...p, resources: newResources, commodities: newCommodities } : p)
  };
}

export function createTradeOffer(state: GameState, offer: TradeOffer): GameState {
  return { ...state, activeTradeOffer: offer };
}

export function respondToTradeOffer(state: GameState, tradeId: string, playerId: string, accept: boolean): GameState {
  if (!state.activeTradeOffer || state.activeTradeOffer.id !== tradeId) return state;
  
  const newState = { ...state };
  newState.activeTradeOffer = {
    ...state.activeTradeOffer,
    responses: {
      ...state.activeTradeOffer.responses,
      [playerId]: accept ? 'accepted' : 'rejected'
    }
  };
  
  return newState;
}

export function executePlayerTrade(state: GameState, tradeId: string, acceptedByPlayerId: string): GameState {
  if (!state.activeTradeOffer || state.activeTradeOffer.id !== tradeId) return state;
  
  const offer = state.activeTradeOffer;
  const offeringPlayer = getPlayerById(state, offer.offeringPlayerId);
  const acceptingPlayer = getPlayerById(state, acceptedByPlayerId);

  // Apply offering player diffs
  const newOffR = { ...offeringPlayer.resources };
  const newOffC = { ...offeringPlayer.commodities };
  // Offering player GIVES 'offering' and GETS 'requesting'
  for (const r of Object.keys(offer.offering) as Resource[]) newOffR[r] -= offer.offering[r] || 0;
  for (const c of Object.keys(offer.offering) as Commodity[]) newOffC[c] -= offer.offering[c] || 0;
  for (const r of Object.keys(offer.requesting) as Resource[]) newOffR[r] += offer.requesting[r] || 0;
  for (const c of Object.keys(offer.requesting) as Commodity[]) newOffC[c] += offer.requesting[c] || 0;

  // Apply accepting player diffs
  const newAccR = { ...acceptingPlayer.resources };
  const newAccC = { ...acceptingPlayer.commodities };
  // Accepting player GIVES 'requesting' and GETS 'offering'
  for (const r of Object.keys(offer.requesting) as Resource[]) newAccR[r] -= offer.requesting[r] || 0;
  for (const c of Object.keys(offer.requesting) as Commodity[]) newAccC[c] -= offer.requesting[c] || 0;
  for (const r of Object.keys(offer.offering) as Resource[]) newAccR[r] += offer.offering[r] || 0;
  for (const c of Object.keys(offer.offering) as Commodity[]) newAccC[c] += offer.offering[c] || 0;

  return {
    ...state,
    activeTradeOffer: null,
    players: state.players.map((p: any) => {
      if (p.id === offeringPlayer.id) return { ...p, resources: newOffR, commodities: newOffC };
      if (p.id === acceptingPlayer.id) return { ...p, resources: newAccR, commodities: newAccC };
      return p;
    })
  };
}
