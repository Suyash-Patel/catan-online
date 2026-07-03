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
import { TurnPhase } from '@catan/shared';
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

  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  const activePlayer = gameState.players.find(p => p.id === activePlayerId);
  const isMyTurn = activePlayerId === playerId;

  // Check if player needs to discard
  const needsDiscard = gameState.pendingDiscards && gameState.pendingDiscards[playerId] > 0;
  const player = gameState.players.find(p => p.id === playerId);

  const getGuideIcon = (phase: TurnPhase) => {
    switch (phase) {
      case TurnPhase.SETUP_SETTLEMENT: return '🏠';
      case TurnPhase.SETUP_ROAD: return '🛣️';
      case TurnPhase.SETUP_CITY: return '🏰';
      case TurnPhase.SETUP_CITY_ROAD: return '🛣️';
      case TurnPhase.PRE_ROLL:
      case TurnPhase.ROLL_DICE: return '🎲';
      case TurnPhase.ROBBER_MOVE: return '💀';
      case TurnPhase.ROBBER_STEAL: return '🎴';
      case TurnPhase.POST_ROLL: return '⚙️';
      default: return '⏳';
    }
  };

  const getGuideText = (phase: TurnPhase, isMyTurn: boolean, name: string) => {
    if (isMyTurn) {
      switch (phase) {
        case TurnPhase.SETUP_SETTLEMENT: return 'Click a glowing white circle on the board to place your starting Settlement!';
        case TurnPhase.SETUP_ROAD: return 'Click a thick glowing line to place your starting Road next to your settlement!';
        case TurnPhase.SETUP_CITY: return 'Click a glowing white circle on the board to place your starting City!';
        case TurnPhase.SETUP_CITY_ROAD: return 'Click a thick glowing line to place your starting Road next to your city!';
        case TurnPhase.PRE_ROLL:
        case TurnPhase.ROLL_DICE: return 'It is your turn! Roll the dice using the 🎲 button at the bottom right.';
        case TurnPhase.ROBBER_MOVE: return 'Click any hex tile on the board to move the Robber there!';
        case TurnPhase.ROBBER_STEAL: return 'Click on a highlighted building to steal a resource card from that player!';
        case TurnPhase.POST_ROLL: return 'Build structures, trade cards, or pass turn using the ⌛ Hourglass button.';
        default: return 'Please complete your turn action.';
      }
    } else {
      switch (phase) {
        case TurnPhase.SETUP_SETTLEMENT: return `Waiting for ${name} to place their starting Settlement...`;
        case TurnPhase.SETUP_ROAD: return `Waiting for ${name} to place their starting Road...`;
        case TurnPhase.SETUP_CITY: return `Waiting for ${name} to place their starting City...`;
        case TurnPhase.SETUP_CITY_ROAD: return `Waiting for ${name} to place their starting Road...`;
        case TurnPhase.PRE_ROLL:
        case TurnPhase.ROLL_DICE: return `${name} is preparing to roll...`;
        case TurnPhase.ROBBER_MOVE: return `${name} is moving the Robber...`;
        case TurnPhase.ROBBER_STEAL: return `${name} is stealing a card...`;
        case TurnPhase.POST_ROLL: return `${name} is trading and building...`;
        default: return `Waiting for ${name} to finish their turn...`;
      }
    }
  };

  return (
    <div className="game-layout">
      {/* 1. Floating Board Area */}
      <div className="game-board-area">
        {activePlayer && (
          <div className={`game-step-guide ${isMyTurn ? 'my-turn-guide' : 'opponent-turn-guide'}`}>
            <span className="guide-icon">{getGuideIcon(gameState.turnPhase)}</span>
            <span className="guide-text">{getGuideText(gameState.turnPhase, isMyTurn, activePlayer.name)}</span>
          </div>
        )}
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
