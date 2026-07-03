import React, { useState, useEffect, useRef } from 'react';
import { useGame, BuildMode } from '../../context/GameContext';
import { Resource, Commodity, TurnPhase, BUILDING_COSTS } from '@catan/shared';
import TradePanel from './TradePanel';
import CityImprovements from './CityImprovements';
import './PlayerDashboard.css';

const DEFAULT_TURN_TIME = 90;
const SETUP_TURN_TIME = 120;

const PlayerDashboard: React.FC = () => {
  const { gameState, playerId, buildMode, setBuildMode, dispatch } = useGame();
  const [showTrade, setShowTrade] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TURN_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!gameState) return null;

  const player = gameState.players.find(p => p.id === playerId);
  const activePlayerId = gameState.turnOrder[gameState.currentPlayerIndex];
  const activePlayer = gameState.players.find(p => p.id === activePlayerId);
  const isMyTurn = activePlayerId === playerId;

  if (!player || !activePlayer) return null;

  const isRollPhase = gameState.turnPhase === TurnPhase.PRE_ROLL || gameState.turnPhase === TurnPhase.ROLL_DICE;
  const isPostRollPhase = gameState.turnPhase === TurnPhase.POST_ROLL;
  const isSpecialBuild = gameState.turnPhase === TurnPhase.SPECIAL_BUILD && 
                         gameState.specialBuildOrder[gameState.specialBuildCurrentIndex] === playerId;

  const canBuildOrBuy = isMyTurn && isPostRollPhase || isSpecialBuild;

  // Determine turn phase time limit
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

  // Timer countdown handling
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

  // Expiration actions
  useEffect(() => {
    if (timeLeft === 0 && isMyTurn) {
      if (gameState.turnPhase === TurnPhase.PRE_ROLL || gameState.turnPhase === TurnPhase.ROLL_DICE) {
        dispatch({ type: 'ROLL_DICE' });
      } else if (gameState.turnPhase === TurnPhase.POST_ROLL) {
        dispatch({ type: 'END_TURN' });
      }
    }
  }, [timeLeft, isMyTurn, gameState.turnPhase, dispatch]);

  const handleRoll = () => dispatch({ type: 'ROLL_DICE' });
  const handleEndTurn = () => dispatch({ type: 'END_TURN' });
  const handlePassSpecialBuild = () => dispatch({ type: 'PASS_SPECIAL_BUILD' });

  // Check if player can afford item
  const canAfford = (cost: Partial<Record<Resource, number>>) => {
    return Object.entries(cost).every(([res, amount]) => {
      const balance = player.resources[res as Resource] || 0;
      return balance >= amount;
    });
  };

  const getResourceIcon = (res: Resource | Commodity) => {
    switch (res) {
      case Resource.BRICK: return '🧱';
      case Resource.LUMBER: return '🌲';
      case Resource.ORE: return '⛰️';
      case Resource.GRAIN: return '🌾';
      case Resource.WOOL: return '🐑';
      case Commodity.PAPER: return '📜';
      case Commodity.CLOTH: return '👕';
      case Commodity.COIN: return '🪙';
      default: return '';
    }
  };

  // Setup options
  const buildOptions = [
    { id: 'road' as BuildMode, name: 'Road', icon: '🛣️', supply: player.roadsRemaining, cost: BUILDING_COSTS.ROAD },
    { id: 'settlement' as BuildMode, name: 'Settle', icon: '🏠', supply: player.settlementsRemaining, cost: BUILDING_COSTS.SETTLEMENT },
    { id: 'city' as BuildMode, name: 'City', icon: '🏰', supply: player.citiesRemaining, cost: BUILDING_COSTS.CITY },
  ];

  if (gameState.citiesAndKnights) {
    buildOptions.push(
      { id: 'knight' as BuildMode, name: 'Knight', icon: '🛡️', supply: player.knightsRemaining.basic, cost: BUILDING_COSTS.KNIGHT },
      { id: 'city_wall' as BuildMode, name: 'Wall', icon: '🧱', supply: 3 - player.cityWallCount, cost: BUILDING_COSTS.CITY_WALL }
    );
  }

  const handleBuildSelect = (optId: BuildMode) => {
    const isSetup = gameState.turnPhase === TurnPhase.SETUP_SETTLEMENT || 
                    gameState.turnPhase === TurnPhase.SETUP_ROAD || 
                    gameState.turnPhase === TurnPhase.SETUP_CITY || 
                    gameState.turnPhase === TurnPhase.SETUP_CITY_ROAD;

    if (!canBuildOrBuy && !isSetup) return;

    if (buildMode === optId) {
      setBuildMode(null);
    } else {
      setBuildMode(optId);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Get human-readable turn phase
  const getPhaseName = () => {
    switch (gameState.turnPhase) {
      case TurnPhase.SETUP_SETTLEMENT: return 'Place Settlement';
      case TurnPhase.SETUP_ROAD: return 'Place Road';
      case TurnPhase.SETUP_CITY: return 'Place City';
      case TurnPhase.SETUP_CITY_ROAD: return 'Place Road';
      case TurnPhase.PRE_ROLL:
      case TurnPhase.ROLL_DICE: return 'Roll Dice';
      case TurnPhase.DISCARD: return 'Discard Cards';
      case TurnPhase.ROBBER_MOVE: return 'Move Robber';
      case TurnPhase.ROBBER_STEAL: return 'Steal Card';
      case TurnPhase.POST_ROLL: return 'Build / Trade';
      case TurnPhase.SPECIAL_BUILD: return 'Special Build';
      default: return 'Catan Turn';
    }
  };

  return (
    <div className="bottom-dashboard-bar">
      {/* 1. Left Section: Resource Hand Row */}
      <div className="dashboard-resource-hand">
        {Object.values(Resource).map(res => {
          const count = player.resources[res] || 0;
          return (
            <div 
              key={res} 
              className={`resource-card-tile resource-${res} ${count > 0 ? 'has-count' : ''}`}
              title={`${res}: ${count} cards`}
            >
              <span className="resource-card-icon">{getResourceIcon(res)}</span>
              <span className="resource-card-qty">{count}</span>
              <span className="resource-card-lbl">{res.substring(0, 4)}</span>
            </div>
          );
        })}

        {gameState.citiesAndKnights && Object.values(Commodity).map(com => {
          const count = player.commodities ? (player.commodities[com] || 0) : 0;
          return (
            <div 
              key={com} 
              className={`resource-card-tile resource-${com} ${count > 0 ? 'has-count' : ''}`}
              title={`${com}: ${count} cards`}
            >
              <span className="resource-card-icon">{getResourceIcon(com)}</span>
              <span className="resource-card-qty">{count}</span>
              <span className="resource-card-lbl">{com.substring(0, 4)}</span>
            </div>
          );
        })}
      </div>

      {/* 2. Middle Section: Build Menu Items */}
      <div className="dashboard-build-menu">
        {buildOptions.map(opt => {
          const active = buildMode === opt.id;
          const affordable = canAfford(opt.cost);
          const isSetup = gameState.turnPhase === TurnPhase.SETUP_SETTLEMENT || 
                          gameState.turnPhase === TurnPhase.SETUP_ROAD || 
                          gameState.turnPhase === TurnPhase.SETUP_CITY || 
                          gameState.turnPhase === TurnPhase.SETUP_CITY_ROAD;

          const isDisabled = (!canBuildOrBuy && !isSetup) || (!affordable && !isSetup);

          return (
            <div 
              key={opt.id}
              className={`build-tile ${active ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleBuildSelect(opt.id)}
              title={`Build ${opt.name}`}
            >
              <span className="build-tile-icon">{opt.icon}</span>
              <span className="build-tile-supply">{opt.supply}</span>
              <span className="build-tile-lbl">{opt.name}</span>
            </div>
          );
        })}

        {/* Development Card Purchase Button (Base Catan only) */}
        {!gameState.citiesAndKnights && (
          <div 
            className={`build-tile ${!canBuildOrBuy || !canAfford(BUILDING_COSTS.DEVELOPMENT_CARD) ? 'disabled' : ''}`}
            onClick={() => canBuildOrBuy && canAfford(BUILDING_COSTS.DEVELOPMENT_CARD) && dispatch({ type: 'BUY_DEVELOPMENT_CARD' })}
            title="Buy Development Card"
          >
            <span className="build-tile-icon">🃏</span>
            <span className="build-tile-lbl">Card</span>
          </div>
        )}

        {/* C&K Improvements Panel Toggle */}
        {gameState.citiesAndKnights && (
          <div 
            className={`build-tile ${showImprovements ? 'active' : ''}`}
            onClick={() => setShowImprovements(!showImprovements)}
            title="City Improvements Tracker"
          >
            <span className="build-tile-icon">🏛️</span>
            <span className="build-tile-lbl">Tracks</span>
          </div>
        )}
      </div>

      {/* 3. Center Section: Turn Status & Timer Banner */}
      <div className="dashboard-status-banner">
        <div className="status-info-wrap">
          <span className="status-turn-lbl">
            {isMyTurn ? '👉 YOUR TURN' : `${activePlayer.name}'s TURN`}
          </span>
          <span className="status-turn-val">{getPhaseName()}</span>
        </div>
        <div className={`status-timer ${timeLeft <= 15 ? 'low-time' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 4. Right Section: Action Panel */}
      <div className="dashboard-action-panel">
        {/* Roll Dice Trigger */}
        {isRollPhase && isMyTurn && (
          <button className="action-tile-btn roll-dice" onClick={handleRoll}>
            <span className="build-tile-icon">🎲</span>
            <span className="action-tile-lbl">ROLL</span>
          </button>
        )}

        {/* Trade Menu Trigger */}
        {isPostRollPhase && isMyTurn && (
          <button className="action-tile-btn trade" onClick={() => setShowTrade(true)}>
            <span className="build-tile-icon">💱</span>
            <span className="action-tile-lbl">TRADE</span>
          </button>
        )}

        {/* Hourglass End Turn Button - Always visible on your turn but disabled when not allowed */}
        {isMyTurn && (
          <button 
            className={`action-tile-btn end-turn ${!isPostRollPhase ? 'disabled' : ''}`} 
            onClick={handleEndTurn} 
            disabled={!isPostRollPhase}
            title={
              isPostRollPhase 
                ? "End Turn" 
                : isRollPhase 
                  ? "Roll the dice first!" 
                  : "Complete starting placements first!"
            }
          >
            <span className="build-tile-icon">⌛</span>
            <span className="action-tile-lbl">PASS</span>
          </button>
        )}

        {/* Special Build pass button */}
        {isSpecialBuild && (
          <button className="action-tile-btn pass-special" onClick={handlePassSpecialBuild}>
            <span className="build-tile-icon">⏩</span>
            <span className="action-tile-lbl">PASS</span>
          </button>
        )}
      </div>

      {/* Popups & Panels */}
      {showTrade && <TradePanel onClose={() => setShowTrade(false)} />}
      {showImprovements && gameState.citiesAndKnights && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 99, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontFamily: 'Outfit, sans-serif' }}>City Improvement Tracks</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowImprovements(false)}>✕</button>
          </div>
          <CityImprovements />
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
