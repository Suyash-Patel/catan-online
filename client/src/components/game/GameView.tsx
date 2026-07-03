import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import BoardRenderer from '../board/BoardRenderer';
import OtherPlayers from './OtherPlayers';
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

  const player = gameState.players.find(p => p.id === playerId);

  return (
    <div className="game-layout">
      {/* 1. Floating Board Area */}
      <div className="game-board-area">
        <BoardRenderer state={gameState} playerId={playerId} />
      </div>

      {/* 2. Top-Right Overlays (Dice, Barbarians, Settings) */}
      <div className="game-overlays-container">
        {gameState.citiesAndKnights && <BarbarianTrack />}
        <DiceDisplay />
      </div>

      {/* 3. Right Sidebar Stack (Chat/Feed + Opponent Cards + Local Info) */}
      <div className={`game-sidebar-stack ${showLog ? 'mobile-visible' : ''}`}>
        {/* Chat / Feed panel at top */}
        <div className="sidebar-section chat-section">
          <ActionLog />
        </div>

        {/* Opponents profile stack in middle */}
        <div className="sidebar-section opponents-section">
          <div className="sidebar-section-header">OPPONENTS</div>
          <OtherPlayers />
        </div>

        {/* Local Player Info Box at bottom */}
        {player && (
          <div className="sidebar-section local-player-card">
            <div className="local-player-header">
              <span className="local-color-indicator" style={{ backgroundColor: `var(--color-player-${player.color})` }} />
              <span className="local-player-name">{player.name} (You)</span>
            </div>
            <div className="local-player-vp-badge">🏆 {player.victoryPoints} VP</div>
            <div className="local-player-supplies">
              <span>🛣️ Roads: {player.roadsRemaining}</span>
              <span>🏠 Settle: {player.settlementsRemaining}</span>
              <span>🏰 Cities: {player.citiesRemaining}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Floating Dashboard (Active Cards, Build options, Timer, Pass) */}
      <div className="game-floating-dashboard">
        <PlayerDashboard />
      </div>

      {/* Mobile Chat / Log Toggle Button */}
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
