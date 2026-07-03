import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Resource, Commodity, TurnPhase } from '@catan/shared';
import BuildMenu from './BuildMenu';
import CityImprovements from './CityImprovements';
import TradePanel from './TradePanel';
import './PlayerDashboard.css';

const PlayerDashboard: React.FC = () => {
  const { gameState, playerId, dispatch } = useGame();
  const [showTrade, setShowTrade] = useState(false);

  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  
  const isMyTurn = activePlayerId === playerId;
  const isRollPhase = gameState.turnPhase === TurnPhase.PRE_ROLL || gameState.turnPhase === TurnPhase.ROLL_DICE;
  const isPostRollPhase = gameState.turnPhase === TurnPhase.POST_ROLL;
  const isSpecialBuild = gameState.turnPhase === TurnPhase.SPECIAL_BUILD && 
                         gameState.specialBuildOrder[gameState.specialBuildCurrentIndex] === playerId;

  if (!player) return null;

  const allResources = [
    Resource.BRICK,
    Resource.LUMBER,
    Resource.ORE,
    Resource.GRAIN,
    Resource.WOOL
  ];

  const allCommodities = gameState.citiesAndKnights ? [
    Commodity.PAPER,
    Commodity.CLOTH,
    Commodity.COIN
  ] : [];

  const handleRoll = () => {
    dispatch({ type: 'ROLL_DICE' });
  };

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
  };

  const handlePassSpecialBuild = () => {
    dispatch({ type: 'PASS_SPECIAL_BUILD' });
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="dashboard-grid">
        {/* Stats Column */}
        <div className="dashboard-stats">
          <div className="dashboard-vp-badge">
            <span>MY VP</span>
            <span>🏆 {player.victoryPoints}</span>
          </div>
          
          <div className="dashboard-pieces">
            <span>Roads: {player.roadsRemaining}</span>
            <span>Settlements: {player.settlementsRemaining}</span>
            <span>Cities: {player.citiesRemaining}</span>
          </div>
        </div>

        {/* Card Hand */}
        <div className="dashboard-cards">
          {allResources.map(res => {
            const count = player.resources[res] || 0;
            return (
              <div 
                key={res} 
                className="card-display resource"
                style={{ borderColor: count > 0 ? `var(--color-${res.toLowerCase()})` : 'var(--glass-border)' }}
              >
                <span className="card-count" style={{ color: count > 0 ? `var(--color-${res.toLowerCase()})` : 'inherit' }}>
                  {count}
                </span>
                <span className="card-label">{res}</span>
              </div>
            );
          })}

          {allCommodities.map(com => {
            const count = player.commodities ? (player.commodities[com] || 0) : 0;
            return (
              <div 
                key={com} 
                className="card-display commodity"
                style={{ borderColor: count > 0 ? `var(--color-${com.toLowerCase()})` : 'var(--glass-border)' }}
              >
                <span className="card-count" style={{ color: count > 0 ? `var(--color-${com.toLowerCase()})` : 'inherit' }}>
                  {count}
                </span>
                <span className="card-label">{com}</span>
              </div>
            );
          })}
        </div>

        {/* Actions Button Panel */}
        <div className="dashboard-actions">
          {/* Trade panel trigger */}
          {gameState.turnPhase === TurnPhase.POST_ROLL && isMyTurn && (
            <button className="btn btn-secondary" onClick={() => setShowTrade(true)}>
              💱 TRADE
            </button>
          )}

          {/* Roll dice trigger */}
          {isRollPhase && isMyTurn && (
            <button className="btn btn-primary pulse-glow" onClick={handleRoll}>
              🎲 ROLL DICE
            </button>
          )}

          {/* End Turn trigger */}
          {isPostRollPhase && isMyTurn && (
            <button className="btn btn-primary" onClick={handleEndTurn}>
              ✔ END TURN
            </button>
          )}

          {/* Special build pass */}
          {isSpecialBuild && (
            <button className="btn btn-secondary" onClick={handlePassSpecialBuild}>
              ⏩ PASS BUILD
            </button>
          )}
        </div>
      </div>

      {/* Popups and sub-panels inline */}
      <div className="dashboard-submenu-grid">
        <BuildMenu />
        {gameState.citiesAndKnights && <CityImprovements />}
      </div>

      {showTrade && <TradePanel onClose={() => setShowTrade(false)} />}
    </div>
  );
};

export default PlayerDashboard;
