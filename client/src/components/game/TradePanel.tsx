import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Resource, Commodity, PortType } from '@catan/shared';
import './TradePanel.css';

interface TradePanelProps {
  onClose: () => void;
}

const TradePanel: React.FC<TradePanelProps> = ({ onClose }) => {
  const { gameState, playerId, dispatch } = useGame();
  
  const [giveType, setGiveType] = useState<Resource | Commodity | null>(null);
  const [receiveType, setReceiveType] = useState<Resource | Commodity | null>(null);
  const [receiveAmount, setReceiveAmount] = useState(1);

  if (!gameState || !playerId) return null;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // Compute trade ratios for the player
  const getRatios = () => {
    const ratios: Record<string, number> = {
      [Resource.BRICK]: 4,
      [Resource.LUMBER]: 4,
      [Resource.ORE]: 4,
      [Resource.GRAIN]: 4,
      [Resource.WOOL]: 4,
      [Commodity.PAPER]: 4,
      [Commodity.CLOTH]: 4,
      [Commodity.COIN]: 4,
    };

    // Check ports
    gameState.board.ports.forEach(port => {
      // Does player own a building on any vertex of this port?
      const ownsPortBuilding = port.vertices.some(vKey => {
        const vertex = gameState.board.vertices[vKey];
        return vertex && vertex.building && vertex.building.playerId === playerId;
      });

      if (ownsPortBuilding) {
        if (port.type === PortType.GENERAL_3_1) {
          Object.keys(ratios).forEach(key => {
            if (ratios[key] === 4) ratios[key] = 3;
          });
        } else if (port.type === PortType.BRICK_2_1) ratios[Resource.BRICK] = 2;
        else if (port.type === PortType.LUMBER_2_1) ratios[Resource.LUMBER] = 2;
        else if (port.type === PortType.ORE_2_1) ratios[Resource.ORE] = 2;
        else if (port.type === PortType.GRAIN_2_1) ratios[Resource.GRAIN] = 2;
        else if (port.type === PortType.WOOL_2_1) ratios[Resource.WOOL] = 2;
      }
    });

    // C&K: Trade improvement track L3 = 2:1 commodities
    if (gameState.citiesAndKnights && player.improvementLevels && player.improvementLevels.TRADE >= 3) {
      ratios[Commodity.PAPER] = 2;
      ratios[Commodity.CLOTH] = 2;
      ratios[Commodity.COIN] = 2;
    }

    // C&K: Merchant 2:1 trade
    if (gameState.citiesAndKnights && gameState.merchant && gameState.merchant.playerId === playerId) {
      const merchantHex = gameState.board.hexes[gameState.merchant.hexKey];
      if (merchantHex) {
        const terrain = merchantHex.terrain;
        if (terrain === 'HILLS') ratios[Resource.BRICK] = 2;
        else if (terrain === 'FOREST') ratios[Resource.LUMBER] = 2;
        else if (terrain === 'MOUNTAINS') ratios[Resource.ORE] = 2;
        else if (terrain === 'FIELDS') ratios[Resource.GRAIN] = 2;
        else if (terrain === 'PASTURE') ratios[Resource.WOOL] = 2;
      }
    }

    return ratios;
  };

  const ratios = getRatios();
  const giveRatio = giveType ? ratios[giveType] : 4;
  const giveAmountRequired = giveRatio * receiveAmount;

  // Check if player has enough balance to give
  const hasBalance = () => {
    if (!giveType) return false;
    
    // Check Resources
    if (giveType in Resource) {
      const balance = player.resources[giveType as Resource] || 0;
      return balance >= giveAmountRequired;
    }
    
    // Check Commodities
    const balance = player.commodities ? (player.commodities[giveType as Commodity] || 0) : 0;
    return balance >= giveAmountRequired;
  };

  const handleExecute = () => {
    if (!giveType || !receiveType || !hasBalance()) return;

    dispatch({
      type: 'BANK_TRADE',
      give: { type: giveType, amount: giveAmountRequired },
      receive: { type: receiveType, amount: receiveAmount }
    });
    onClose();
  };

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

  const renderResourceGrid = (
    selected: Resource | Commodity | null, 
    onSelect: (type: Resource | Commodity) => void,
    excludeType?: Resource | Commodity | null
  ) => {
    return (
      <div className="trade-select-grid">
        {allResources.map(res => {
          if (res === excludeType) return null;
          const isSelected = selected === res;
          return (
            <button
              key={res}
              type="button"
              className={`trade-resource-btn ${isSelected ? 'selected' : ''}`}
              style={{ borderColor: isSelected ? `var(--color-${res.toLowerCase()})` : 'transparent' }}
              onClick={() => onSelect(res)}
            >
              {res}
            </button>
          );
        })}
        {allCommodities.map(com => {
          if (com === excludeType) return null;
          const isSelected = selected === com;
          return (
            <button
              key={com}
              type="button"
              className={`trade-resource-btn ${isSelected ? 'selected' : ''}`}
              style={{ borderColor: isSelected ? `var(--color-${com.toLowerCase()})` : 'transparent' }}
              onClick={() => onSelect(com)}
            >
              {com}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="trade-panel-wrap">
      <div className="trade-panel-header">
        <h2 style={{ fontSize: '1.2rem' }}>Maritime Bank Trade</h2>
        <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>✕</button>
      </div>

      <div className="trade-panel-content">
        <div className="trade-flow">
          {/* GIVE SIDE */}
          <div className="trade-half">
            <span className="lobby-label">GIVE</span>
            {renderResourceGrid(giveType, setGiveType, receiveType)}
          </div>

          <div className="trade-arrow">➔</div>

          {/* RECEIVE SIDE */}
          <div className="trade-half">
            <span className="lobby-label">RECEIVE</span>
            {renderResourceGrid(receiveType, setReceiveType, giveType)}
          </div>
        </div>

        {giveType && receiveType && (
          <div className="trade-ratio-info">
            Trade Ratio: <strong style={{ color: 'var(--accent-primary)' }}>{giveRatio}:1</strong>
            <br />
            You will trade <strong style={{ color: '#ef4444' }}>{giveAmountRequired} {giveType}</strong> for <strong style={{ color: '#10b981' }}>{receiveAmount} {receiveType}</strong>
            <br />
            <span style={{ fontSize: '0.8rem', color: hasBalance() ? '#34d399' : '#f87171', marginTop: '6px', display: 'block' }}>
              {hasBalance() ? '✓ Funds available' : '✗ Insufficient cards'}
            </span>
          </div>
        )}

        <button 
          className="btn btn-primary" 
          disabled={!giveType || !receiveType || !hasBalance()}
          onClick={handleExecute}
          style={{ width: '100%', padding: '12px' }}
        >
          EXECUTE TRADE
        </button>
      </div>
    </div>
  );
};

export default TradePanel;
