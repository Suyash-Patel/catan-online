// ============================================================
// Lobby Manager
// ============================================================

import { Room, LobbyPlayer } from '@catan/shared/types/lobby.js';
import { GameSettings, PlayerColor } from '@catan/shared/types/game.js';

const activeRooms = new Map<string, Room>();

const AVAILABLE_COLORS = [
  PlayerColor.RED, PlayerColor.BLUE, PlayerColor.WHITE, 
  PlayerColor.ORANGE, PlayerColor.GREEN, PlayerColor.BROWN
];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createRoom(hostId: string, hostName: string, settings: GameSettings): Room {
  let code = generateCode();
  while (activeRooms.has(code)) code = generateCode();

  const hostPlayer: LobbyPlayer = {
    id: hostId,
    name: hostName,
    color: AVAILABLE_COLORS[0],
    isHost: true,
    isReady: true,
    isConnected: true,
  };

  const room: Room = {
    id: code,
    code,
    host: hostId,
    players: [hostPlayer],
    settings,
    status: 'waiting',
    createdAt: Date.now()
  };

  activeRooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return activeRooms.get(code);
}

export function joinRoom(code: string, playerId: string, playerName: string): Room {
  const room = activeRooms.get(code);
  if (!room) throw new Error("Room not found");
  if (room.status !== 'waiting') throw new Error("Game already started");
  if (room.players.length >= room.settings.playerCount) throw new Error("Room is full");
  
  // Check if player already in room
  const existing = room.players.find((p: any) => p.id === playerId);
  if (existing) return room;

  // Find unused color
  const usedColors = new Set(room.players.map((p: any) => p.color));
  const availableColor = AVAILABLE_COLORS.find((c: any) => !usedColors.has(c)) || AVAILABLE_COLORS[0];

  room.players.push({
    id: playerId,
    name: playerName,
    color: availableColor,
    isHost: false,
    isReady: false,
    isConnected: true,
  });

  return room;
}

export function leaveRoom(code: string, playerId: string): Room | null {
  const room = activeRooms.get(code);
  if (!room) return null;

  room.players = room.players.filter((p: any) => p.id !== playerId);
  
  if (room.players.length === 0) {
    activeRooms.delete(code);
    return null;
  }

  // Host migration
  if (room.host === playerId) {
    room.host = room.players[0].id;
    room.players[0].isHost = true;
  }

  return room;
}

export function updateRoomSettings(code: string, settings: Partial<GameSettings>): Room {
  const room = activeRooms.get(code);
  if (!room) throw new Error("Room not found");
  
  room.settings = { ...room.settings, ...settings };
  return room;
}

export function setPlayerColor(code: string, playerId: string, color: PlayerColor): Room {
  const room = activeRooms.get(code);
  if (!room) throw new Error("Room not found");
  
  const usedBy = room.players.find((p: any) => p.color === color);
  if (usedBy && usedBy.id !== playerId) throw new Error("Color already taken");

  const player = room.players.find((p: any) => p.id === playerId);
  if (player) player.color = color;
  
  return room;
}

export function togglePlayerReady(code: string, playerId: string): Room {
  const room = activeRooms.get(code);
  if (!room) throw new Error("Room not found");
  
  const player = room.players.find((p: any) => p.id === playerId);
  if (player && !player.isHost) {
    player.isReady = !player.isReady;
  }
  
  return room;
}
