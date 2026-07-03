import React from 'react';
import { useGame } from '../../context/GameContext';
import { EventDieFace } from '@catan/shared';
import './DiceDisplay.css';

const DiceDisplay: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;

  const roll = gameState.lastRoll;

  const getEventDieEmoji = (face: EventDieFace) => {
    switch (face) {
      case EventDieFace.BARBARIAN_SHIP: return '⛵';
      case EventDieFace.YELLOW_GATE: return '🟨';
      case EventDieFace.BLUE_GATE: return '🟦';
      case EventDieFace.GREEN_GATE: return '🟩';
      default: return '❓';
    }
  };

  const getEventDieClass = (face: EventDieFace) => {
    switch (face) {
      case EventDieFace.BARBARIAN_SHIP: return 'barbarian';
      case EventDieFace.YELLOW_GATE: return 'yellow';
      case EventDieFace.BLUE_GATE: return 'blue';
      case EventDieFace.GREEN_GATE: return 'green';
      default: return '';
    }
  };

  return (
    <div className="dice-container">
      {roll ? (
        <>
          <div className="die die-white">{roll.white}</div>
          <div className="die die-red">{roll.red}</div>
          {gameState.citiesAndKnights && roll.event && (
            <div className={`die-event ${getEventDieClass(roll.event)}`} title={`Event die: ${roll.event}`}>
              {getEventDieEmoji(roll.event)}
            </div>
          )}
          <div className="roll-total-badge">
            TOTAL: {roll.total}
          </div>
        </>
      ) : (
        <>
          <div className="die die-white">?</div>
          <div className="die die-red">?</div>
          {gameState.citiesAndKnights && (
            <div className="die-event" style={{ background: 'var(--bg-tertiary)' }}>?</div>
          )}
        </>
      )}
    </div>
  );
};

export default DiceDisplay;
