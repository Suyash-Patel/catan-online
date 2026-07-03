// ============================================================
// Lobby & Networking Types
// ============================================================

import type { GameSettings, PlayerColor } from './game.js';

export interface LobbyPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface Room {
  id: string;
  code: string;       // 6-char alphanumeric room code
  host: string;       // host player ID
  players: LobbyPlayer[];
  settings: GameSettings;
  status: 'waiting' | 'in_game' | 'finished';
  createdAt: number;
}

// --- Socket Events (Client → Server) ---

export interface ClientToServerEvents {
  'lobby:create': (data: { playerName: string; settings: GameSettings }) => void;
  'lobby:join': (data: { roomCode: string; playerName: string }) => void;
  'lobby:leave': () => void;
  'lobby:set-color': (data: { color: PlayerColor }) => void;
  'lobby:toggle-ready': () => void;
  'lobby:update-settings': (data: Partial<GameSettings>) => void;
  'lobby:start': () => void;
  'game:action': (data: { action: import('./actions.js').GameAction }) => void;
  'game:reconnect': (data: { roomCode: string; playerId: string }) => void;
}

// --- Socket Events (Server → Client) ---

export interface ServerToClientEvents {
  'lobby:created': (data: { room: Room; playerId: string }) => void;
  'lobby:joined': (data: { room: Room; playerId: string }) => void;
  'lobby:updated': (data: { room: Room }) => void;
  'lobby:error': (data: { message: string }) => void;
  'lobby:player-joined': (data: { player: LobbyPlayer }) => void;
  'lobby:player-left': (data: { playerId: string }) => void;
  'game:started': (data: { gameState: import('./game.js').ClientGameState }) => void;
  'game:state-update': (data: { gameState: import('./game.js').ClientGameState }) => void;
  'game:action-error': (data: { message: string }) => void;
  'game:action-log': (data: { entry: import('./game.js').ActionLogEntry }) => void;
  'game:player-disconnected': (data: { playerId: string }) => void;
  'game:player-reconnected': (data: { playerId: string }) => void;
  'game:over': (data: { winnerId: string; finalState: import('./game.js').ClientGameState }) => void;
}
