import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { TurnPhase } from '@catan/shared';
import './TurnTimer.css';

const DEFAULT_TURN_TIME = 90; // 90 seconds per turn
const SETUP_TURN_TIME = 120;  // 120 seconds for setup placements

const TurnTimer: React.FC = () => {
  const { gameState, playerId, dispatch } = useGame();
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TURN_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!gameState) return null;

  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  const activePlayer = gameState.players.find(p => p.id === activePlayerId);
  const isMyTurn = activePlayerId === playerId;

  // Determine turn phase time
  const getPhaseTimeLimit = (phase: TurnPhase) => {
    if (
      phase === TurnPhase.SETUP_SETTLEMENT ||
      phase === TurnPhase.SETUP_ROAD ||
      phase === TurnPhase.SETUP_CITY ||
      phase === TurnPhase.SETUP_CITY_ROAD
    ) {
      return SETUP_TURN_TIME;
    }
    return DEFAULT_TURN_TIME;
  };

  // Reset timer on active player change or phase change
  useEffect(() => {
    const limit = getPhaseTimeLimit(gameState.turnPhase);
    setTimeLeft(limit);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activePlayerId, gameState.turnPhase, gameState.turnNumber]);

  // Handle auto-actions when timer expires
  useEffect(() => {
    if (timeLeft === 0 && isMyTurn) {
      // Auto-trigger moves to prevent game stagnation
      if (gameState.turnPhase === TurnPhase.PRE_ROLL || gameState.turnPhase === TurnPhase.ROLL_DICE) {
        dispatch({ type: 'ROLL_DICE' });
      } else if (gameState.turnPhase === TurnPhase.POST_ROLL) {
        dispatch({ type: 'END_TURN' });
      }
    }
  }, [timeLeft, isMyTurn, gameState.turnPhase, dispatch]);

  if (!activePlayer) return null;

  // Format time (e.g. 01:24)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 15;
  const limit = getPhaseTimeLimit(gameState.turnPhase);
  const strokeDashoffset = 88 - (88 * timeLeft) / limit;

  return (
    <div className={`turn-timer-card glass-panel ${isLowTime ? 'low-time' : ''}`}>
      {/* Visual active player indicator */}
      <div className="active-player-info">
        <span 
          className="active-player-dot" 
          style={{ 
            backgroundColor: `var(--color-player-${activePlayer.color})`,
            boxShadow: `0 0 10px var(--color-player-${activePlayer.color})` 
          }}
        />
        <div className="active-player-text">
          <span className="turn-label">CURRENT CHANCE</span>
          <span 
            className="player-name-turn" 
            style={{ color: isMyTurn ? 'var(--accent-primary)' : `var(--color-player-${activePlayer.color})` }}
          >
            {isMyTurn ? '👉 Your Turn!' : activePlayer.name}
          </span>
        </div>
      </div>

      {/* Circular Countdown Progress */}
      <div className="timer-circular-wrap">
        <svg width="40" height="40" viewBox="0 0 36 36" className="timer-circle-svg">
          <circle 
            className="timer-circle-bg" 
            cx="18" 
            cy="18" 
            r="14" 
            fill="none" 
            stroke="rgba(255,255,255,0.06)" 
            strokeWidth="3.5" 
          />
          <circle 
            className="timer-circle-fill" 
            cx="18" 
            cy="18" 
            r="14" 
            fill="none" 
            stroke={isLowTime ? '#ef4444' : 'var(--accent-primary)'} 
            strokeWidth="3.5" 
            strokeDasharray="88" 
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span className={`timer-countdown-text ${isLowTime ? 'pulse-glow-red' : ''}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Primary Turn Actions in Widget */}
      {isMyTurn && (
        <div className="timer-actions">
          {(gameState.turnPhase === TurnPhase.PRE_ROLL || gameState.turnPhase === TurnPhase.ROLL_DICE) && (
            <button 
              className="btn btn-primary pulse-glow timer-action-btn"
              onClick={() => dispatch({ type: 'ROLL_DICE' })}
            >
              🎲 ROLL DICE
            </button>
          )}
          {gameState.turnPhase === TurnPhase.POST_ROLL && (
            <button 
              className="btn btn-primary timer-action-btn"
              onClick={() => dispatch({ type: 'END_TURN' })}
            >
              ✔ END TURN
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TurnTimer;
