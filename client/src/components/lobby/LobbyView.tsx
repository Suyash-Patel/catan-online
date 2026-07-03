import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import './LobbyView.css';

const LobbyView: React.FC = () => {
  const { createRoom, joinRoom, playerName, setPlayerName } = useGame();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [playerCount, setPlayerCount] = useState<3 | 4 | 5 | 6>(4);
  const [citiesAndKnights, setCitiesAndKnights] = useState(true);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    createRoom(playerCount, citiesAndKnights);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    joinRoom(roomCode);
  };

  return (
    <div className="lobby-container">
      {/* Visual background decorations */}
      <div className="bg-hexes">
        <svg width="100%" height="100%">
          <pattern id="hex-pattern" width="80" height="138.56" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M40 0 L80 23.09 L80 69.28 L40 92.37 L0 69.28 L0 23.09 Z M40 138.56 L80 115.47 L80 69.28 L40 92.37 L0 69.28 L0 115.47 Z" fill="none" stroke="var(--accent-primary)" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      </div>

      <div className="lobby-card glass-panel">
        <div className="lobby-title-wrap">
          <div className="lobby-logo">CATAN</div>
          <div className="lobby-subtitle">CITIES & KNIGHTS EDITION</div>
        </div>

        <div className="lobby-tabs">
          <button 
            className={`lobby-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
          <button 
            className={`lobby-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </button>
        </div>

        <div className="lobby-form-group">
          <label className="lobby-label">YOUR PLAYER NAME</label>
          <input 
            type="text" 
            className="input" 
            placeholder="Enter player name..." 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            required
          />
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="lobby-setting-row">
              <span className="lobby-label" style={{ margin: 0 }}>PLAYER COUNT</span>
              <select 
                className="input" 
                style={{ width: '120px', padding: '6px 12px' }}
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value) as any)}
              >
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
                <option value={5}>5 Players</option>
                <option value={6}>6 Players</option>
              </select>
            </div>

            <div className="lobby-setting-row">
              <div>
                <span className="lobby-label" style={{ margin: 0, display: 'block' }}>CITIES & KNIGHTS</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enable C&K expansion rules</span>
              </div>
              <label className="lobby-toggle">
                <input 
                  type="checkbox" 
                  checked={citiesAndKnights} 
                  onChange={(e) => setCitiesAndKnights(e.target.checked)} 
                />
                <span className="lobby-toggle-slider"></span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary lobby-submit-btn">
              CREATE ROOM
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div className="lobby-form-group">
              <label className="lobby-label">ROOM ACCESS CODE</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Enter 6-character code..." 
                value={roomCode} 
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}
              />
            </div>

            <button type="submit" className="btn btn-primary lobby-submit-btn">
              JOIN ROOM
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LobbyView;
