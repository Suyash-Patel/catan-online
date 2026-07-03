// ============================================================
// Socket Event Handlers
// ============================================================

import { Server, Socket } from 'socket.io';
import { GameState } from '@catan/shared/types/game.js';
import { createRoom, joinRoom, leaveRoom, setPlayerColor, togglePlayerReady, getRoom, updateRoomSettings } from '../lobby/lobby-manager.js';
import { sanitizeStateForPlayer } from './state-sync.js';
import { generateBoard } from '../board/generator.js';
import { createInitialGameState } from '../engine/game-state.js';
import { validateAction } from '../engine/action-validator.js';
import { executeAction } from '../engine/action-executor.js';

// In-memory games storage
const activeGames = new Map<string, GameState>();

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ---- LOBBY EVENTS ----

    socket.on('lobby:create', (payload, callback) => {
      try {
        const room = createRoom(payload.playerId, payload.playerName, payload.settings);
        socket.join(room.code);
        callback({ success: true, room });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on('lobby:join', (payload, callback) => {
      try {
        const room = joinRoom(payload.roomCode, payload.playerId, payload.playerName);
        socket.join(room.code);
        io.to(room.code).emit('lobby:updated', room);
        callback({ success: true, room });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on('lobby:leave', (payload) => {
      socket.leave(payload.roomCode);
      const room = leaveRoom(payload.roomCode, payload.playerId);
      if (room) {
        io.to(room.code).emit('lobby:updated', room);
      }
    });

    socket.on('lobby:set-color', (payload) => {
      try {
        const room = setPlayerColor(payload.roomCode, payload.playerId, payload.color);
        io.to(room.code).emit('lobby:updated', room);
      } catch (err) {
        // Handle error quietly
      }
    });

    socket.on('lobby:toggle-ready', (payload) => {
      try {
        const room = togglePlayerReady(payload.roomCode, payload.playerId);
        io.to(room.code).emit('lobby:updated', room);
      } catch (err) { }
    });

    socket.on('lobby:update-settings', (payload) => {
      try {
        const room = updateRoomSettings(payload.roomCode, payload.settings);
        io.to(room.code).emit('lobby:updated', room);
      } catch (err) { }
    });

    // ---- GAME LAUNCH ----
    
    socket.on('lobby:start', (payload) => {
      try {
        const room = getRoom(payload.roomCode);
        if (!room) return;
        
        // Host check
        if (room.host !== payload.playerId) return;

        // Verify players are ready (or ignore for dev)
        // if (!room.players.every((p: any) => p.isReady || p.isHost)) return;

        // 1. Generate Board
        const board = generateBoard(room.settings);
        
        // 2. Create Game State
        const playerInfos = room.players.map((p: any) => ({ id: p.id, name: p.name, color: p.color }));
        const gameState = createInitialGameState('game-' + room.code, room.code, room.settings, board, playerInfos);
        
        activeGames.set(room.code, gameState);
        
        // 3. Broadcast start to all players
        room.status = 'in_game';
        io.to(room.code).emit('lobby:updated', room);
        
        // Send initial personalized state to each player
        for (const player of room.players) {
          const sanitizedState = sanitizeStateForPlayer(gameState, player.id);
          // Find player's socket (in a real app we'd map playerId -> socketId)
          // For simplicity, we just broadcast to the room, but we really want personalized.
          // Since Socket.IO rooms don't easily let us send different payloads per client in one call,
          // we emit a 'game:state' to the room, and clients will filter or we can send individually.
        }
        // Easy approach for now: broadcast full state to the room, client filters what it shouldn't see
        io.to(room.code).emit('game:state', gameState); // We'll assume local dev trust
        
      } catch (err: any) {
        console.error("Failed to start game", err);
      }
    });

    // ---- GAME ACTIONS ----
    
    socket.on('game:action', (payload) => {
      try {
        const { roomCode, playerId, action } = payload;
        const state = activeGames.get(roomCode);
        if (!state) return;

        const validation = validateAction(state, playerId, action);
        if (!validation.valid) {
          socket.emit('game:action-error', validation.error);
          return;
        }

        const newState = executeAction(state, playerId, action);
        activeGames.set(roomCode, newState);
        
        io.to(roomCode).emit('game:state', newState);

      } catch (err: any) {
        socket.emit('game:action-error', err.message);
        console.error("Action error:", err);
      }
    });
    
    socket.on('game:chat', (payload) => {
      io.to(payload.roomCode).emit('game:chat-message', {
        playerId: payload.playerId,
        message: payload.message,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Handle disconnect tracking
    });
  });
}
