// ============================================================
// Progress Cards
// ============================================================

import { GameState } from '@catan/shared/types/game.js';
import { ProgressCardType } from '@catan/shared/types/ck.js';
import { ImprovementTrack } from '@catan/shared/types/ck.js';
import { PROGRESS_CARD_DEFINITIONS } from '@catan/shared/constants/cards.js';
import { getPlayerById } from '../engine/game-state.js';
import { updatePlayer } from './utils.js';
import { v4 as uuidv4 } from 'uuid';

export function createProgressCardDecks() {
  const decks = {
    trade: [] as any[],
    politics: [] as any[],
    science: [] as any[]
  };
  
  for (const def of PROGRESS_CARD_DEFINITIONS) {
    const deck = def.deck === ImprovementTrack.TRADE ? decks.trade : 
                 def.deck === ImprovementTrack.POLITICS ? decks.politics : 
                 decks.science;
                 
    for (let i = 0; i < def.count; i++) {
      deck.push({ id: uuidv4(), type: def.type, deck: def.deck });
    }
  }
  
  // Shuffle
  for (const key of ['trade', 'politics', 'science'] as const) {
    const deck = decks[key];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  return decks;
}

export function drawProgressCard(state: GameState, playerId: string, track: ImprovementTrack): GameState {
  const deckKey = track === ImprovementTrack.TRADE ? 'trade' : 
                  track === ImprovementTrack.POLITICS ? 'politics' : 'science';
                  
  const deck = [...state.progressCardDecks[deckKey]];
  if (deck.length === 0) return state; // Deck empty
  
  const card = deck.pop()!;
  const player = getPlayerById(state, playerId);
  
  // Hand limit is max 4 cards. We enforce this later or immediately depending on rules.
  // We'll just add it to their hand.
  const newPlayer = { ...player, progressCards: [...player.progressCards, card] };
  
  return {
    ...updatePlayer(state, playerId, newPlayer),
    progressCardDecks: { ...state.progressCardDecks, [deckKey]: deck }
  };
}

export function executeProgressCard(state: GameState, playerId: string, cardId: string, payload: any): GameState {
  const player = getPlayerById(state, playerId);
  const card = player.progressCards.find(c => c.id === cardId);
  if (!card) throw new Error("Card not found in hand");
  
  let newState = { ...state };
  
  // Basic implementation - we just remove the card from hand
  // In a full implementation, we would switch on card.type and call specific effects
  
  newState = updatePlayer(newState, playerId, {
    progressCards: player.progressCards.filter(c => c.id !== cardId)
  });
  
  if (card.type === ProgressCardType.PRINTER || card.type === ProgressCardType.CONSTITUTION) {
    // VP cards are moved to revealed
    newState = updatePlayer(newState, playerId, {
      vpCardsRevealed: [...player.vpCardsRevealed, card.type]
    });
  }
  
  return newState;
}
