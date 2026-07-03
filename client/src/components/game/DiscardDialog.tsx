import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Resource, Commodity } from '@catan/shared';
import './DiscardDialog.css';

const DiscardDialog: React.FC = () => {
  const { gameState, playerId, dispatch } = useGame();
  
  const [selectedResources, setSelectedResources] = useState<Partial<Record<Resource, number>>>({});
  const [selectedCommodities, setSelectedCommodities] = useState<Partial<Record<Commodity, number>>>({});

  if (!gameState || !gameState.pendingDiscards) return null;

  const required = gameState.pendingDiscards[playerId] || 0;
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  const totalSelected = 
    Object.values(selectedResources).reduce((sum, val) => sum + (val || 0), 0) +
    Object.values(selectedCommodities).reduce((sum, val) => sum + (val || 0), 0);

  const handleResourceChange = (res: Resource, amount: number) => {
    const current = selectedResources[res] || 0;
    const maxVal = player.resources[res] || 0;
    const nextVal = Math.max(0, Math.min(maxVal, current + amount));
    
    // Prevent selecting more than required
    if (amount > 0 && totalSelected >= required) return;

    setSelectedResources({
      ...selectedResources,
      [res]: nextVal
    });
  };

  const handleCommodityChange = (com: Commodity, amount: number) => {
    const current = selectedCommodities[com] || 0;
    const maxVal = player.commodities ? (player.commodities[com] || 0) : 0;
    const nextVal = Math.max(0, Math.min(maxVal, current + amount));

    // Prevent selecting more than required
    if (amount > 0 && totalSelected >= required) return;

    setSelectedCommodities({
      ...selectedCommodities,
      [com]: nextVal
    });
  };

  const handleConfirm = () => {
    if (totalSelected !== required) return;

    // Build discard parameters
    const cleanResources: Partial<Record<Resource, number>> = {};
    Object.keys(selectedResources).forEach((key) => {
      const res = key as Resource;
      if (selectedResources[res]) {
        cleanResources[res] = selectedResources[res];
      }
    });

    const cleanCommodities: Partial<Record<Commodity, number>> = {};
    Object.keys(selectedCommodities).forEach((key) => {
      const com = key as Commodity;
      if (selectedCommodities[com]) {
        cleanCommodities[com] = selectedCommodities[com];
      }
    });

    dispatch({
      type: 'DISCARD_CARDS',
      resources: cleanResources,
      commodities: cleanCommodities
    });
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

  return (
    <div className="discard-overlay">
      <div className="discard-modal glass-panel">
        <div className="discard-header">
          <h2>Barbarians Demand Discards!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            You rolled or triggered a 7 and exceeded your hand limit. Choose cards to discard.
          </p>
        </div>

        <div className="discard-target-badge">
          DISCARD PROGRESS: {totalSelected} / {required} CARDS SELECTED
        </div>

        <div className="discard-grid">
          {allResources.map(res => {
            const current = selectedResources[res] || 0;
            const maxVal = player.resources[res] || 0;
            
            return (
              <div key={res} className="discard-item">
                <span className="discard-item-name" style={{ color: `var(--color-${res.toLowerCase()})` }}>
                  {res} ({maxVal} owned)
                </span>
                <div className="discard-controls">
                  <button 
                    type="button" 
                    className="discard-btn"
                    onClick={() => handleResourceChange(res, -1)}
                    disabled={current === 0}
                  >
                    -
                  </button>
                  <span className="discard-qty">{current}</span>
                  <button 
                    type="button" 
                    className="discard-btn"
                    onClick={() => handleResourceChange(res, 1)}
                    disabled={current === maxVal || totalSelected >= required}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          {allCommodities.map(com => {
            const current = selectedCommodities[com] || 0;
            const maxVal = player.commodities ? (player.commodities[com] || 0) : 0;

            return (
              <div key={com} className="discard-item">
                <span className="discard-item-name" style={{ color: `var(--color-${com.toLowerCase()})` }}>
                  {com} ({maxVal} owned)
                </span>
                <div className="discard-controls">
                  <button 
                    type="button" 
                    className="discard-btn"
                    onClick={() => handleCommodityChange(com, -1)}
                    disabled={current === 0}
                  >
                    -
                  </button>
                  <span className="discard-qty">{current}</span>
                  <button 
                    type="button" 
                    className="discard-btn"
                    onClick={() => handleCommodityChange(com, 1)}
                    disabled={current === maxVal || totalSelected >= required}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '12px' }}
          onClick={handleConfirm}
          disabled={totalSelected !== required}
        >
          CONFIRM DISCARD
        </button>
      </div>
    </div>
  );
};

export default DiscardDialog;
