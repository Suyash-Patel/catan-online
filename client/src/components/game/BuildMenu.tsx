import React from 'react';
import { useGame, BuildMode } from '../../context/GameContext';
import { BUILDING_COSTS, Resource, TurnPhase } from '@catan/shared';
import './BuildMenu.css';

interface Option {
  id: BuildMode | 'buy_dev_card';
  name: string;
  cost: Partial<Record<Resource, number>> & { brick?: number; lumber?: number; ore?: number; grain?: number; wool?: number };
}

const BuildMenu: React.FC = () => {
  const { gameState, playerId, buildMode, setBuildMode, dispatch } = useGame();

  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  
  // Checking active phase
  const isMyTurn = activePlayerId === playerId;
  const isSetup = gameState.turnPhase === TurnPhase.SETUP_SETTLEMENT || 
                  gameState.turnPhase === TurnPhase.SETUP_ROAD || 
                  gameState.turnPhase === TurnPhase.SETUP_CITY || 
                  gameState.turnPhase === TurnPhase.SETUP_CITY_ROAD;

  const isSpecialBuild = gameState.turnPhase === TurnPhase.SPECIAL_BUILD && 
                         gameState.specialBuildOrder[gameState.specialBuildCurrentIndex] === playerId;

  const canBuildOrBuy = isMyTurn && gameState.turnPhase === TurnPhase.POST_ROLL || isSpecialBuild;

  if (!player) return null;

  // Check if player can afford an item
  const canAfford = (cost: Partial<Record<Resource, number>>) => {
    return Object.entries(cost).every(([res, amount]) => {
      const balance = player.resources[res as Resource] || 0;
      return balance >= amount;
    });
  };

  const options: Option[] = [
    {
      id: 'road',
      name: 'ROAD',
      cost: BUILDING_COSTS.ROAD
    },
    {
      id: 'settlement',
      name: 'SETTLEMENT',
      cost: BUILDING_COSTS.SETTLEMENT
    },
    {
      id: 'city',
      name: 'CITY',
      cost: BUILDING_COSTS.CITY
    }
  ];

  // Base dev cards or C&K items
  if (!gameState.citiesAndKnights) {
    options.push({
      id: 'buy_dev_card',
      name: 'DEV CARD',
      cost: BUILDING_COSTS.DEVELOPMENT_CARD
    });
  } else {
    // Add C&K specific items
    options.push(
      {
        id: 'knight',
        name: 'HIRE KNIGHT',
        cost: BUILDING_COSTS.KNIGHT
      },
      {
        id: 'city_wall',
        name: 'CITY WALL',
        cost: BUILDING_COSTS.CITY_WALL
      }
    );
  }

  const handleSelect = (optId: BuildMode | 'buy_dev_card') => {
    if (!canBuildOrBuy && !isSetup) return;

    if (optId === 'buy_dev_card') {
      dispatch({ type: 'BUY_DEVELOPMENT_CARD' });
      return;
    }

    if (buildMode === optId) {
      setBuildMode(null);
    } else {
      setBuildMode(optId);
    }
  };

  return (
    <div className="build-menu-container">
      <span className="lobby-label" style={{ marginBottom: 0 }}>BUILD OPTIONS</span>
      <div className="build-menu-grid">
        {options.map(opt => {
          const active = buildMode === opt.id;
          const affordable = canAfford(opt.cost);
          const isDisabled = (!canBuildOrBuy && !isSetup) || !affordable;

          return (
            <div 
              key={opt.id}
              className={`build-option-card ${active ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleSelect(opt.id)}
            >
              <span className="build-option-name">{opt.name}</span>
              <div className="build-option-costs">
                {Object.entries(opt.cost).map(([res, amount]) => (
                  <span 
                    key={res} 
                    className="cost-pip"
                    style={{ backgroundColor: `var(--color-${res.toLowerCase()})` }}
                  >
                    {amount}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuildMenu;
