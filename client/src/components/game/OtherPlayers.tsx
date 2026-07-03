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
            <div 
              className="opponent-color-indicator" 
              style={{ backgroundColor: `var(--color-player-${p.color})` }}
            />
            <span className="opponent-name">{p.name}</span>
            
            {/* Victory Points */}
            <span className="opponent-stat opponent-stat-vp">
              🏆 {p.victoryPoints} VP
            </span>

            {/* Total Cards */}
            <span className="opponent-stat" title="Total Resource & Commodity Cards">
              🎴 {totalCards}
            </span>

            {/* Progress Cards */}
            {gameState.citiesAndKnights && (
              <span className="opponent-stat" title="Progress Cards">
                🧪 {progressCount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OtherPlayers;
