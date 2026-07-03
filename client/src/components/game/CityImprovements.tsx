import React from 'react';
import { useGame } from '../../context/GameContext';
import { ImprovementTrack, Commodity, TurnPhase } from '@catan/shared';
import './CityImprovements.css';

const CityImprovements: React.FC = () => {
  const { gameState, playerId, dispatch } = useGame();

  if (!gameState || !gameState.citiesAndKnights) return null;

  const player = gameState.players.find(p => p.id === playerId);
  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  const isMyTurn = activePlayerId === playerId && gameState.turnPhase === TurnPhase.POST_ROLL;

  if (!player) return null;

  const tracks = [
    {
      id: ImprovementTrack.TRADE,
      name: 'TRADE',
      commodity: Commodity.CLOTH,
      color: 'cloth'
    },
    {
      id: ImprovementTrack.POLITICS,
      name: 'POLITICS',
      commodity: Commodity.COIN,
      color: 'coin'
    },
    {
      id: ImprovementTrack.SCIENCE,
      name: 'SCIENCE',
      commodity: Commodity.PAPER,
      color: 'paper'
    }
  ];

  const handleUpgrade = (trackId: ImprovementTrack) => {
    dispatch({
      type: 'IMPROVE_CITY',
      track: trackId
    });
  };

  return (
    <div className="improvements-container">
      <span className="lobby-label" style={{ marginBottom: 0 }}>CITY IMPROVEMENTS</span>
      <div className="improvements-track-list">
        {tracks.map(track => {
          const currentLevel = player.improvementLevels[track.id] || 0;
          const nextLevel = currentLevel + 1;
          const canUpgradeFurther = currentLevel < 5;
          
          // Commodity cost type & amount
          const commodityBalance = player.commodities ? (player.commodities[track.commodity] || 0) : 0;
          const affordable = commodityBalance >= nextLevel;
          
          // Must have at least one city built (limit is 4 cities, so citiesRemaining < 4)
          const hasCityBuilt = player.citiesRemaining < 4;
          
          const disabled = !isMyTurn || !canUpgradeFurther || !affordable || !hasCityBuilt;

          return (
            <div key={track.id} className="improvement-track-row">
              <span className="improvement-track-title">{track.name}</span>
              
              <div className="improvement-levels">
                {[0, 1, 2, 3, 4, 5].map(lvl => (
                  <div 
                    key={lvl} 
                    className={`improvement-level-box ${currentLevel === lvl ? 'active' : ''}`}
                  >
                    {lvl}
                  </div>
                ))}
              </div>

              {canUpgradeFurther ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    className="improvement-cost-badge"
                    style={{ backgroundColor: `var(--color-${track.color})` }}
                  >
                    {nextLevel}
                  </span>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                    onClick={() => handleUpgrade(track.id)}
                    disabled={disabled}
                  >
                    UPGRADE
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  MAXED
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CityImprovements;
