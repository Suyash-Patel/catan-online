import React from 'react';
import { useGame } from '../../context/GameContext';
import './OtherPlayers.css';

const OtherPlayers: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;

  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];

  return (
    <div className="opponents-list">
      {gameState.players.map(p => {
        const isActive = p.id === activePlayerId;
        
        // Sum up total cards in hand (resources + commodities)
        const resourceCount = Object.values(p.resources).reduce((sum, count) => sum + (count || 0), 0);
        const commodityCount = p.commodities ? Object.values(p.commodities).reduce((sum, count) => sum + (count || 0), 0) : 0;
        const totalCards = resourceCount + commodityCount;
        
        // Total progress cards
        const progressCount = p.progressCards ? p.progressCards.length : 0;

        return (
          <div 
            key={p.id} 
            className={`opponent-card ${isActive ? 'active' : ''}`}
            title={`${p.name}'s info`}
          >
            <div className="opponent-header">
              <div className="opponent-avatar-wrap">
                <div 
                  className="opponent-color-indicator" 
                  style={{ backgroundColor: `var(--color-player-${p.color})` }}
                />
              </div>
              <span className="opponent-name">{p.name}</span>
              <span className="opponent-vp-badge">
                🏆 {p.victoryPoints} VP
              </span>
            </div>

            <div className="opponent-stats-row">
              <div className="opponent-stat" title="Resource & Commodity Cards">
                🎴 <span>{totalCards}</span>
              </div>
              
              {gameState.citiesAndKnights && (
                <div className="opponent-stat" title="Progress Cards">
                  🧪 <span>{progressCount}</span>
                </div>
              )}

              <div className="opponent-stat" title="Road Length">
                🛣️ <span>{p.longestRoadLength}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OtherPlayers;
