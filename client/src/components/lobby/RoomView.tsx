import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerColor } from '@catan/shared';
import './RoomView.css';

const RoomView: React.FC = () => {
  const { 
    room, 
    playerId, 
    leaveRoom, 
    setColor, 
    toggleReady, 
    startGame 
  } = useGame();

  if (!room) return null;

  const myMember = room.players.find(p => p.id === playerId);
  const isHost = room.host === playerId;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    alert('Room code copied to clipboard!');
  };

  const handleColorSelect = (color: PlayerColor) => {
    // Check if color is taken
    const isTaken = room.players.some(p => p.color === color && p.id !== playerId);
    if (!isTaken) {
      setColor(color);
    }
  };

  const allColors = [
    PlayerColor.RED,
    PlayerColor.BLUE,
    PlayerColor.WHITE,
    PlayerColor.ORANGE,
    PlayerColor.GREEN,
    PlayerColor.BROWN
  ];

  const canStart = isHost && room.players.length >= 3; // Standard Catan minimum is 3 players

  return (
    <div className="room-container">
      <div className="room-card glass-panel">
        <div className="room-header">
          <div>
            <h2>Lobby Waiting Room</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Settings: {room.settings.citiesAndKnights ? 'Cities & Knights' : 'Base Game'} • {room.settings.playerCount} Players
            </p>
          </div>
          <div className="room-code-badge" onClick={copyCode} title="Click to copy code">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ROOM CODE</span>
            <span className="room-code-val">{room.code}</span>
          </div>
        </div>

        <h3 className="lobby-label">PLAYERS ({room.players.length}/{room.settings.playerCount})</h3>
        <div className="room-player-list">
          {room.players.map(p => {
            const isPlayerHost = p.id === room.host;
            const statusClass = isPlayerHost 
              ? 'status-host' 
              : p.isReady 
                ? 'status-ready' 
                : 'status-waiting';
            
            const statusText = isPlayerHost 
              ? 'HOST' 
              : p.isReady 
                ? 'READY' 
                : 'WAITING';

            return (
              <div key={p.id} className="room-player-row">
                <div className="room-player-info">
                  <div 
                    className="room-player-color-dot" 
                    style={{ backgroundColor: `var(--color-player-${p.color})` }}
                  />
                  <span className="room-player-name">
                    {p.name} {p.id === playerId && ' (You)'}
                  </span>
                </div>
                <span className={`room-player-status ${statusClass}`}>
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>

        <div className="room-color-selector">
          <label className="lobby-label">CHOOSE YOUR COLOR</label>
          <div className="room-color-grid">
            {allColors.map(color => {
              const isTaken = room.players.some(p => p.color === color && p.id !== playerId);
              const isMine = myMember?.color === color;
              
              return (
                <button
                  key={color}
                  className={`color-option-btn ${isMine ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                  style={{ backgroundColor: `var(--color-player-${color})` }}
                  onClick={() => handleColorSelect(color)}
                  disabled={isTaken}
                  title={isTaken ? 'Color taken' : color}
                />
              );
            })}
          </div>
        </div>

        <div className="room-actions">
          <button className="btn btn-secondary room-btn-flex" onClick={leaveRoom}>
            LEAVE
          </button>
          
          {!isHost && (
            <button 
              className={`btn room-btn-flex ${myMember?.isReady ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleReady}
            >
              {myMember?.isReady ? 'NOT READY' : 'READY'}
            </button>
          )}

          {isHost && (
            <button 
              className="btn btn-primary room-btn-flex" 
              onClick={startGame}
              disabled={room.players.length < 2} // Let dev play with 2+ players for testing
            >
              START GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomView;
