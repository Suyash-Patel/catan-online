import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import BoardRenderer from '../board/BoardRenderer';
import OtherPlayers from './OtherPlayers';
import TurnTimer from './TurnTimer';
import DiceDisplay from './DiceDisplay';
import BarbarianTrack from './BarbarianTrack';
import PlayerDashboard from './PlayerDashboard';
import ActionLog from './ActionLog';
import DiscardDialog from './DiscardDialog';
import GameOverScreen from './GameOverScreen';
import './GameView.css';

const GameView: React.FC = () => {
  const { gameState, playerId } = useGame();
  const [showLog, setShowLog] = useState(false);

  if (!gameState) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h2>Loading Catan Game Session...</h2>
      </div>
    );
  }

  // Check if player needs to discard
  const needsDiscard = gameState.pendingDiscards && gameState.pendingDiscards[playerId] > 0;

  return (
    <div className="game-layout">
      {/* Top bar */}
      <div className="game-topbar">
        <div className="game-topbar-left">
          <OtherPlayers />
        </div>
        <div className="game-topbar-center">
          <TurnTimer />
        </div>
        <div className="game-topbar-right">
          {gameState.citiesAndKnights && <BarbarianTrack />}
          <DiceDisplay />
        </div>
      </div>

      {/* Board area */}
      <div className="game-board-area">
        <BoardRenderer state={gameState} playerId={playerId} />
      </div>

      {/* Bottom Dashboard */}
      <div className="game-dashboard">
        <PlayerDashboard />
      </div>

      {/* Sidebar */}
      <div className={`game-sidebar ${showLog ? 'mobile-visible' : ''}`}>
        <ActionLog />
      </div>

      {/* Mobile log toggle */}
      <button className="mobile-log-toggle btn btn-ghost" onClick={() => setShowLog(!showLog)}>
        {showLog ? '✕' : '💬'}
      </button>

      {/* Overlays / Modals */}
      {needsDiscard && <DiscardDialog />}
      {gameState.winnerPlayerId && <GameOverScreen />}
    </div>
  );
};

export default GameView;
