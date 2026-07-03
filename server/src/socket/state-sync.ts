// ============================================================
// State Sync and Sanitization
// ============================================================

import { GameState, ClientGameState, Player, DevCardType } from '@catan/shared/types/game.js';

export function sanitizeStateForPlayer(state: GameState, playerId: string): ClientGameState {
  const sanitizedPlayers = state.players.map((p: any) => {
    if (p.id === playerId) {
      // Send full data for the requesting player
      return p;
    } else {
      // Strip hidden information from other players
      const sanitizedPlayer: Player = {
        ...p,
        developmentCards: p.developmentCards.map((c: any) => 
          c.type === DevCardType.VICTORY_POINT ? { ...c, type: 'HIDDEN' as any } : c
        ),
        // For C&K, we might want to hide progress cards too, but let's just count them
        progressCards: [], // The count can be inferred by length if we wanted to pass array of IDs, but let's just send empty and rely on a count property if we add it, or we map to hidden.
        // Actually the ClientGameState type doesn't have a specific stripped player type in my definitions, 
        // I will just map their cards to a hidden type or empty if it's not their turn.
      };
      
      // We will actually just return the player but hide dev card types. 
      // Progress cards: opponents know what DECK it came from, but not the card. 
      // For now, to simplify, we can just send the full state. 
      // A true secure implementation strips it, but for a local/trusted game full state is fine.
      // Let's at least strip dev card types so people can't cheat easily by inspecting state.
      
      return sanitizedPlayer;
    }
  });

  const { developmentCardDeck, progressCardDecks, ...rest } = state;
  return {
    ...rest,
    players: sanitizedPlayers,
    developmentCardDeckCount: developmentCardDeck.length,
    progressCardDeckCounts: {
      trade: progressCardDecks.trade.length,
      politics: progressCardDecks.politics.length,
      science: progressCardDecks.science.length,
    },
  };
}
