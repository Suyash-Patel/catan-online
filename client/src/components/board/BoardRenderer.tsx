import React from 'react';
import { useGame, BuildMode } from '../../context/GameContext';
import { ClientGameState, HexCoord, VertexCoord, EdgeCoord, TerrainType, PortType, TurnPhase } from '@catan/shared';
import { 
  hexToPixel, 
  hexCorners, 
  vertexToPixel, 
  edgeEndpoints, 
  edgeToPixel,
  hexKey,
  vertexKey,
  edgeKey,
  parseVertexKey,
  parseEdgeKey,
  parseHexKey
} from '@catan/shared/hex/coords';

interface BoardRendererProps {
  state: ClientGameState;
  playerId: string;
}

const HEX_SIZE = 60;

const BoardRenderer: React.FC<BoardRendererProps> = ({ state, playerId }) => {
  const { 
    buildMode, 
    setBuildMode,
    selectedVertex, 
    setSelectedVertex,
    selectedEdge, 
    setSelectedEdge,
    selectedHex, 
    setSelectedHex,
    dispatch 
  } = useGame();

  const board = state.board;

  // Compute layout limits
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  Object.values(board.hexes).forEach(hex => {
    const center = hexToPixel(hex.coord, HEX_SIZE);
    minX = Math.min(minX, center.x - HEX_SIZE * 2);
    maxX = Math.max(maxX, center.x + HEX_SIZE * 2);
    minY = Math.min(minY, center.y - HEX_SIZE * 2);
    maxY = Math.max(maxY, center.y + HEX_SIZE * 2);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  const handleHexClick = (key: string) => {
    setSelectedHex(key);
    const parsed = parseHexKey(key);
    
    // Robber placement
    if (gameStateIsRobberMovePhase()) {
      dispatch({
        type: 'MOVE_ROBBER',
        hexKey: key
      });
      return;
    }
  };

  const handleVertexClick = (key: string) => {
    setSelectedVertex(key);
    
    const isSetupPhase = state.turnPhase === TurnPhase.SETUP_SETTLEMENT || 
                         state.turnPhase === TurnPhase.SETUP_ROAD || 
                         state.turnPhase === TurnPhase.SETUP_CITY || 
                         state.turnPhase === TurnPhase.SETUP_CITY_ROAD;

    if (buildMode === 'settlement') {
      if (isSetupPhase) {
        dispatch({ type: 'PLACE_INITIAL_SETTLEMENT', vertexKey: key });
      } else {
        dispatch({ type: 'BUILD_SETTLEMENT', vertexKey: key });
      }
    } else if (buildMode === 'city') {
      if (isSetupPhase) {
        dispatch({ type: 'PLACE_INITIAL_CITY', vertexKey: key });
      } else {
        dispatch({ type: 'BUILD_CITY', vertexKey: key });
      }
    } else if (buildMode === 'knight') {
      dispatch({ type: 'HIRE_KNIGHT', vertexKey: key });
    } else if (buildMode === 'city_wall') {
      dispatch({ type: 'BUILD_CITY_WALL', vertexKey: key });
    } else {
      // General click actions: check if owns building or knight
      const vertex = board.vertices[key];
      if (vertex.knight && vertex.knight.playerId === playerId) {
        // Toggle activate or upgrade or move (depending on state)
        if (!vertex.knight.isActive) {
          dispatch({ type: 'ACTIVATE_KNIGHT', vertexKey: key });
        } else {
          dispatch({ type: 'UPGRADE_KNIGHT', vertexKey: key });
        }
      }
    }
  };

  const handleEdgeClick = (key: string) => {
    setSelectedEdge(key);

    const isSetupPhase = state.turnPhase === TurnPhase.SETUP_SETTLEMENT || 
                         state.turnPhase === TurnPhase.SETUP_ROAD || 
                         state.turnPhase === TurnPhase.SETUP_CITY || 
                         state.turnPhase === TurnPhase.SETUP_CITY_ROAD;

    if (buildMode === 'road') {
      if (isSetupPhase) {
        dispatch({ type: 'PLACE_INITIAL_ROAD', edgeKey: key });
      } else {
        dispatch({ type: 'BUILD_ROAD', edgeKey: key });
      }
    }
  };

  const gameStateIsRobberMovePhase = () => {
    return state.turnPhase === TurnPhase.ROBBER_MOVE;
  };

  // Get color fill by terrain type
  const getTerrainFill = (terrain: TerrainType) => {
    switch (terrain) {
      case TerrainType.FOREST: return 'url(#forest-gradient)';
      case TerrainType.PASTURE: return 'url(#pasture-gradient)';
      case TerrainType.FIELDS: return 'url(#fields-gradient)';
      case TerrainType.HILLS: return 'url(#hills-gradient)';
      case TerrainType.MOUNTAINS: return 'url(#mountains-gradient)';
      case TerrainType.DESERT: return 'url(#desert-gradient)';
      default: return '#111827';
    }
  };

  return (
    <svg 
      className="catan-board-svg" 
      viewBox={`${minX} ${minY} ${width} ${height}`}
      style={{ width: '100%', height: '100%', outline: 'none' }}
    >
      <defs>
        {/* Gradients for hexes */}
        <radialGradient id="forest-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#14532d" />
        </radialGradient>
        <radialGradient id="pasture-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </radialGradient>
        <radialGradient id="fields-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="hills-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
        <radialGradient id="mountains-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#4b5563" />
        </radialGradient>
        <radialGradient id="desert-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </radialGradient>
      </defs>

      {/* 1. Hexes Layer */}
      <g id="hexes-layer">
        {Object.entries(board.hexes).map(([key, hex]) => {
          const center = hexToPixel(hex.coord, HEX_SIZE);
          const corners = hexCorners(hex.coord, HEX_SIZE);
          const pointsString = corners.map(c => `${c.x},${c.y}`).join(' ');

          const isRobberTarget = gameStateIsRobberMovePhase() && !hex.hasRobber;

          return (
            <g key={key} onClick={() => handleHexClick(key)} style={{ cursor: isRobberTarget ? 'pointer' : 'default' }}>
              <polygon
                points={pointsString}
                fill={getTerrainFill(hex.terrain)}
                stroke="#1f2937"
                strokeWidth="2"
                style={{ transition: 'var(--transition-smooth)' }}
                className={isRobberTarget ? 'pulse-glow' : ''}
              />
              
              {/* Number Tokens */}
              {hex.numberToken && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={center.x} cy={center.y} r="18" fill="var(--bg-secondary)" stroke="var(--glass-border)" strokeWidth="1" />
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={hex.numberToken === 6 || hex.numberToken === 8 ? '#f87171' : 'var(--text-primary)'}
                    fontSize="15"
                    fontFamily="Outfit, sans-serif"
                    fontWeight="800"
                  >
                    {hex.numberToken}
                  </text>
                </g>
              )}

              {/* Robber overlay */}
              {hex.hasRobber && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={center.x} cy={center.y + 16} r="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                  <text x={center.x} y={center.y + 16} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#fff">💀</text>
                </g>
              )}

              {/* Merchant overlay */}
              {state.merchant && state.merchant.hexKey === key && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={center.x - 16} cy={center.y - 16} r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                  <text x={center.x - 16} y={center.y - 16} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#000">💰</text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* 2. Ports Layer */}
      <g id="ports-layer">
        {board.ports.map((port, idx) => {
          // Find center between port's two endpoints
          const [v1Key, v2Key] = port.vertices;
          const v1 = board.vertices[v1Key];
          const v2 = board.vertices[v2Key];
          if (!v1 || !v2) return null;

          const p1 = vertexToPixel(v1.coord, HEX_SIZE);
          const p2 = vertexToPixel(v2.coord, HEX_SIZE);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`port-${idx}`} style={{ pointerEvents: 'none' }}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--accent-secondary)" strokeWidth="3" opacity="0.6" />
              <circle cx={midX} cy={midY} r="9" fill="var(--bg-tertiary)" stroke="var(--accent-secondary)" strokeWidth="1.5" />
              <text 
                x={midX} 
                y={midY} 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="9" 
                fill="var(--text-primary)"
                fontWeight="800"
              >
                {port.type === PortType.GENERAL_3_1 ? '3:1' : '2:1'}
              </text>
            </g>
          );
        })}
      </g>

      {/* 3. Edges (Roads) Layer */}
      <g id="edges-layer">
        {Object.entries(board.edges).map(([key, edge]) => {
          const [p1, p2] = edgeEndpoints(edge.coord, HEX_SIZE);
          const hasRoad = edge.road !== null;
          const mid = edgeToPixel(edge.coord, HEX_SIZE);

          const isClickable = buildMode === 'road';

          // Get player road color
          const getRoadColor = () => {
            if (!edge.road) return 'transparent';
            const player = state.players.find(p => p.id === edge.road?.playerId);
            return player ? `var(--color-player-${player.color})` : 'transparent';
          };

          return (
            <g key={key} onClick={() => isClickable && handleEdgeClick(key)}>
              {/* Invisible thick line for easier clicking */}
              <line 
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                stroke={isClickable ? 'rgba(0, 212, 170, 0.2)' : 'transparent'} 
                strokeWidth={isClickable ? '14' : '8'}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              />

              {hasRoad && (
                <line 
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                  stroke={getRoadColor()} 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {isClickable && !hasRoad && (
                <circle 
                  cx={mid.x} cy={mid.y} r="4" 
                  fill="var(--accent-primary)" 
                  style={{ pointerEvents: 'none', animation: 'fadeIn 0.5s ease-in-out' }}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* 4. Vertices (Settlements, Cities, Knights) Layer */}
      <g id="vertices-layer">
        {Object.entries(board.vertices).map(([key, vertex]) => {
          const pos = vertexToPixel(vertex.coord, HEX_SIZE);
          const hasBuilding = vertex.building !== null;
          const hasKnight = vertex.knight !== null;

          const isClickable = buildMode === 'settlement' || 
                              buildMode === 'city' || 
                              buildMode === 'knight' || 
                              buildMode === 'city_wall';

          const getPlayerColor = (pId: string) => {
            const player = state.players.find(p => p.id === pId);
            return player ? `var(--color-player-${player.color})` : 'var(--text-primary)';
          };

          return (
            <g 
              key={key} 
              onClick={() => (isClickable || hasKnight) && handleVertexClick(key)}
              style={{ cursor: (isClickable || hasKnight) ? 'pointer' : 'default' }}
            >
              {/* Click trigger area */}
              <circle 
                cx={pos.x} cy={pos.y} r={isClickable ? '16' : '10'} 
                fill="transparent" 
              />

              {/* Candidate placement highlight */}
              {isClickable && !hasBuilding && !hasKnight && (
                <circle 
                  cx={pos.x} cy={pos.y} r="6" 
                  fill="var(--accent-primary)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none', animation: 'fadeIn 0.3s ease-in-out' }}
                />
              )}

              {/* Settlements (House shape) */}
              {hasBuilding && vertex.building?.type === 'settlement' && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect 
                    x={pos.x - 7} y={pos.y - 4} width="14" height="10" 
                    fill={getPlayerColor(vertex.building.playerId)} 
                    stroke="#1e293b" strokeWidth="1"
                  />
                  <polygon 
                    points={`${pos.x - 9},${pos.y - 4} ${pos.x},${pos.y - 12} ${pos.x + 9},${pos.y - 4}`} 
                    fill={getPlayerColor(vertex.building.playerId)} 
                    stroke="#1e293b" strokeWidth="1"
                  />
                </g>
              )}

              {/* Cities (Double House or Tower shape) */}
              {hasBuilding && vertex.building?.type === 'city' && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect 
                    x={pos.x - 10} y={pos.y - 4} width="20" height="12" 
                    fill={getPlayerColor(vertex.building.playerId)} 
                    stroke="#1e293b" strokeWidth="1.5"
                  />
                  <polygon 
                    points={`${pos.x - 12},${pos.y - 4} ${pos.x - 5},${pos.y - 12} ${pos.x + 2},${pos.y - 4}`} 
                    fill={getPlayerColor(vertex.building.playerId)} 
                    stroke="#1e293b" strokeWidth="1.5"
                  />
                  <polygon 
                    points={`${pos.x - 2},${pos.y - 4} ${pos.x + 5},${pos.y - 14} ${pos.x + 12},${pos.y - 4}`} 
                    fill={getPlayerColor(vertex.building.playerId)} 
                    stroke="#1e293b" strokeWidth="1.5"
                  />
                  {/* City Wall indicator */}
                  {vertex.building.hasCityWall && (
                    <circle cx={pos.x} cy={pos.y + 4} r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                  )}
                  {/* Metropolis indicator */}
                  {vertex.building.hasMetropolis && (
                    <polygon 
                      points={`${pos.x - 4},${pos.y - 18} ${pos.x},${pos.y - 25} ${pos.x + 4},${pos.y - 18}`} 
                      fill="#fbbf24" stroke="#d97706" strokeWidth="1" 
                    />
                  )}
                </g>
              )}

              {/* Knights (Shield shape) */}
              {hasKnight && vertex.knight && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle 
                    cx={pos.x} cy={pos.y} r="10" 
                    fill={vertex.knight.isActive ? getPlayerColor(vertex.knight.playerId) : 'var(--bg-secondary)'} 
                    stroke={getPlayerColor(vertex.knight.playerId)} 
                    strokeWidth="2.5" 
                  />
                  {/* Knight level label */}
                  <text 
                    x={pos.x} y={pos.y} 
                    textAnchor="middle" dominantBaseline="central" 
                    fontSize="9" 
                    fill={vertex.knight.isActive ? '#000' : 'var(--text-primary)'}
                    fontWeight="bold"
                  >
                    ⚔️{vertex.knight.level}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default BoardRenderer;
