import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, Room, GameAction } from '@catan/shared';

export type BuildMode = 'settlement' | 'city' | 'road' | 'knight' | 'knight_upgrade' | 'knight_activate' | 'city_wall' | 'robber_move';

interface GameContextType {
  gameState: ClientGameState | null;
  room: Room | null;
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  buildMode: BuildMode | null;
  setBuildMode: (mode: BuildMode | null) => void;
  selectedVertex: string | null;
  setSelectedVertex: (key: string | null) => void;
  selectedEdge: string | null;
  setSelectedEdge: (key: string | null) => void;
  selectedHex: string | null;
  setSelectedHex: (key: string | null) => void;
  
  // Lobby functions
  createRoom: (playerCount: 3 | 4 | 5 | 6, citiesAndKnights: boolean) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setColor: (color: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  
  // Game functions
  dispatch: (action: GameAction) => void;
  sendChat: (msg: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Socket instance
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const socket: Socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true
});

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerId] = useState(() => {
    const saved = localStorage.getItem('catan_player_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 9);
    localStorage.setItem('catan_player_id', newId);
    return newId;
  });
  
  const [playerName, setPlayerNameState] = useState(() => {
    return localStorage.getItem('catan_player_name') || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    localStorage.setItem('catan_player_name', name);
  };

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  // Build and selection states
  const [buildMode, setBuildMode] = useState<BuildMode | null>(null);
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);

  useEffect(() => {
    if (socket.connected) {
      setConnectionStatus('connected');
    }

    socket.on('connect', () => {
      setConnectionStatus('connected');
      // If we were in a room, try to reconnect or re-request room status
      if (room?.code) {
        socket.emit('lobby:join', { roomCode: room.code, playerId, playerName }, (res: any) => {
          if (res.success) {
            setRoom(res.room);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('lobby:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('game:state', (updatedState: ClientGameState) => {
      setGameState(updatedState);
    });

    socket.on('game:action-error', (error: string) => {
      alert(`Game Action Error: ${error}`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby:updated');
      socket.off('game:state');
      socket.off('game:action-error');
    };
  }, [room?.code, playerId, playerName]);

  const createRoom = (playerCount: 3 | 4 | 5 | 6, citiesAndKnights: boolean) => {
    socket.emit('lobby:create', {
      playerId,
      playerName,
      settings: { playerCount, citiesAndKnights }
    }, (res: any) => {
      if (res.success) {
        setRoom(res.room);
      } else {
        alert(res.error || 'Failed to create room');
      }
    });
  };

  const joinRoom = (code: string) => {
    socket.emit('lobby:join', {
      roomCode: code.toUpperCase(),
      playerId,
      playerName
    }, (res: any) => {
      if (res.success) {
        setRoom(res.room);
      } else {
        alert(res.error || 'Failed to join room');
      }
    });
  };

  const leaveRoom = () => {
    if (room) {
      socket.emit('lobby:leave', { roomCode: room.code, playerId });
      setRoom(null);
      setGameState(null);
    }
  };

  const setColor = (color: string) => {
    if (room) {
      socket.emit('lobby:set-color', { roomCode: room.code, playerId, color });
    }
  };

  const toggleReady = () => {
    if (room) {
      socket.emit('lobby:toggle-ready', { roomCode: room.code, playerId });
    }
  };

  const startGame = () => {
    if (room) {
      socket.emit('lobby:start', { roomCode: room.code, playerId });
    }
  };

  const dispatch = (action: GameAction) => {
    if (room) {
      socket.emit('game:action', { roomCode: room.code, playerId, action });
      // Reset build modes after action
      setBuildMode(null);
      setSelectedVertex(null);
      setSelectedEdge(null);
      setSelectedHex(null);
    }
  };

  const sendChat = (message: string) => {
    if (room) {
      socket.emit('game:chat', { roomCode: room.code, playerId, message });
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      room,
      playerId,
      playerName,
      setPlayerName,
      connectionStatus,
      buildMode,
      setBuildMode,
      selectedVertex,
      setSelectedVertex,
      selectedEdge,
      setSelectedEdge,
      selectedHex,
      setSelectedHex,
      createRoom,
      joinRoom,
      leaveRoom,
      setColor,
      toggleReady,
      startGame,
      dispatch,
      sendChat
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
