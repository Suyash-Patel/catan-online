import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import './ActionLog.css';

const ActionLog: React.FC = () => {
  const { gameState, sendChat } = useGame();
  const [chatMsg, setChatMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.actionLog]);

  if (!gameState) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    sendChat(chatMsg);
    setChatMsg('');
  };

  const getPlayerNameColor = (playerId?: string) => {
    if (!playerId) return 'var(--text-primary)';
    const player = gameState.players.find(p => p.id === playerId);
    return player ? `var(--color-player-${player.color})` : 'var(--text-primary)';
  };

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return 'System';
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  return (
    <div className="action-log-container">
      <div className="action-log-header">
        <h3>Game Feed & Chat</h3>
      </div>

      <div className="action-log-messages">
        {gameState.actionLog.map((entry, idx) => {
          const isChat = entry.type === 'chat';
          const isSystem = entry.type === 'system';
          const entryClass = isChat ? 'chat' : isSystem ? 'system' : 'action';

          return (
            <div key={entry.id || idx} className={`action-log-entry ${entryClass}`}>
              {!isSystem && (
                <span 
                  className="action-log-player-name" 
                  style={{ color: getPlayerNameColor(entry.playerId) }}
                >
                  {getPlayerName(entry.playerId)}:
                </span>
              )}
              <span className="action-log-msg-text">{entry.message}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="action-log-input-wrap">
        <form onSubmit={handleSubmit} className="action-log-input-form">
          <input
            type="text"
            className="input"
            placeholder="Type message..."
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            maxLength={100}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActionLog;
