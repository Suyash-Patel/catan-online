import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import LobbyView from './components/lobby/LobbyView';
import RoomView from './components/lobby/RoomView';
import GameView from './components/game/GameView';

const NavigationController: React.FC = () => {
  const { room } = useGame();

  if (!room) {
    return <LobbyView />;
  }

  if (room.status === 'waiting') {
    return <RoomView />;
  }

  return <GameView />;
};

function App() {
  return (
    <GameProvider>
      <NavigationController />
    </GameProvider>
  );
}

export default App;
