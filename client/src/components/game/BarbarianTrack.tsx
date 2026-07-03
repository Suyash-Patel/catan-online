import React from 'react';
import { useGame } from '../../context/GameContext';
import './BarbarianTrack.css';

const BarbarianTrack: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState || !gameState.barbarianState) return null;

  const { position, trackLength } = gameState.barbarianState;

  const dots = [];
  for (let i = 0; i < trackLength; i++) {
    dots.push(i);
  }

  return (
    <div className="barbarian-track-wrap">
      <span className="barbarian-label">BARBARIAN SHIP</span>
      <div className="barbarian-track-dots">
        {dots.map(idx => {
          const isShip = position === idx;
          const isActive = idx < position;
          return (
            <div 
              key={idx} 
              className={`barbarian-track-dot ${isActive ? 'active' : ''} ${isShip ? 'ship' : ''}`}
              title={isShip ? "Barbarian Ship position" : `Track space ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BarbarianTrack;
