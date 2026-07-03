import React from 'react';
import { useGame } from '../../context/GameContext';
import './GameOverScreen.css';

const GameOverScreen: React.FC = () => {
  const { gameState, leaveRoom } = useGame();

  if (!gameState || !gameState.winnerPlayerId) return null;

  const winner = gameState.players.find(p => p.id === gameState.winnerPlayerId);
  
  // Sort players by VP descending
  const sortedPlayers = [...gameState.players].sort((a, b) => b.victoryPoints - a.victoryPoints);

  return (
    <div className="gameover-overlay">
      <div className="gameover-card glass-panel">
        <div className="gameover-trophy">🏆</div>
        <h1 className="gameover-title">Victory Achieved!</h1>
        
        {winner && (
          <div 
            className="gameover-winner-badge"
            style={{ 
              backgroundColor: `rgba(255, 255, 255, 0.02)`,
              borderColor: `var(--color-player-${winner.color})`,
              color: `var(--color-player-${winner.color})`
            }}
          >
            {winner.name.toUpperCase()} WINS THE GAME!
          </div>
        )}

        <div className="gameover-results-title">FINAL LEADERBOARD</div>
        <div className="gameover-leaderboard">
          {sortedPlayers.map((p, idx) => {
            const isWinner = p.id === gameState.winnerPlayerId;
            return (
              <div 
                key={p.id} 
                className="gameover-row"
                style={{ 
                  borderColor: isWinner ? `var(--color-player-${p.color})` : 'var(--glass-border)',
                  background: isWinner ? `rgba(255, 255, 255, 0.04)` : 'rgba(255, 255, 255, 0.01)'
                }}
              >
                <div className="gameover-row-player">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                    #{idx + 1}
                  </span>
                  <div 
                    className="gameover-row-color" 
                    style={{ backgroundColor: `var(--color-player-${p.color})` }}
                  />
                  <span className="gameover-row-name">
                    {p.name} {isWinner && '👑'}
                  </span>
                </div>
                <span className="gameover-row-vp">
                  {p.victoryPoints} VP
                </span>
              </div>
            );
          })}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '12px' }}
          onClick={leaveRoom}
        >
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
