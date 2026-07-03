import React from 'react';
import { useGame } from '../../context/GameContext';
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
  parseHexKey
} from '@catan/shared/hex/coords';
import './BoardRenderer.css';

interface BoardRendererProps {
  state: ClientGameState;
  playerId: string;
}

const HEX_SIZE = 65; // Slightly larger for better detail resolution

const BoardRenderer: React.FC<BoardRendererProps> = ({ state, playerId }) => {
  const { 
    buildMode, 
    selectedVertex, 
    setSelectedVertex,
    selectedEdge, 
    setSelectedEdge,
    selectedHex, 
    setSelectedHex,
    dispatch 
  } = useGame();

  const board = state.board;

  // Compute layout limits to correctly size our SVG viewport
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  Object.values(board.hexes).forEach(hex => {
    const center = hexToPixel(hex.coord, HEX_SIZE);
    minX = Math.min(minX, center.x - HEX_SIZE * 2.2);
    maxX = Math.max(maxX, center.x + HEX_SIZE * 2.2);
    minY = Math.min(minY, center.y - HEX_SIZE * 2.2);
    maxY = Math.max(maxY, center.y + HEX_SIZE * 2.2);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  const handleHexClick = (key: string) => {
    setSelectedHex(key);
    if (state.turnPhase === TurnPhase.ROBBER_MOVE) {
      dispatch({ type: 'MOVE_ROBBER', hexKey: key });
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
      // General click actions for knights: activate/upgrade/move
      const vertex = board.vertices[key];
      if (vertex.knight && vertex.knight.playerId === playerId) {
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

  const getTerrainFill = (terrain: TerrainType) => {
    switch (terrain) {
      case TerrainType.FOREST: return 'url(#forest-pattern)';
      case TerrainType.PASTURE: return 'url(#pasture-pattern)';
      case TerrainType.FIELDS: return 'url(#fields-pattern)';
      case TerrainType.HILLS: return 'url(#hills-pattern)';
      case TerrainType.MOUNTAINS: return 'url(#mountains-pattern)';
      case TerrainType.DESERT: return 'url(#desert-pattern)';
      default: return '#111827';
    }
  };

  const getPlayerColor = (pId: string) => {
    const player = state.players.find(p => p.id === pId);
    return player ? `var(--color-player-${player.color})` : 'var(--text-primary)';
  };

  // Helper to render the probability dots for Catan number tokens
  const getProbabilityDots = (token: number) => {
    switch (token) {
      case 2: case 12: return '•';
      case 3: case 11: return '••';
      case 4: case 10: return '•••';
      case 5: case 9: return '••••';
      case 6: case 8: return '•••••';
      default: return '';
    }
  };

  return (
    <svg 
      className="catan-board-svg" 
      viewBox={`${minX} ${minY} ${width} ${height}`}
      style={{ width: '100%', height: '100%', outline: 'none' }}
    >
      <defs>
        {/* Subtle drop shadow filters for settlements/cities/tokens */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* 1. Forest Pattern (Pine Trees) */}
        <pattern id="forest-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#0f3d1b" />
          {/* Subtle wood grains */}
          <path d="M 0,5 Q 15,10 30,5 M 0,20 Q 15,15 30,20" stroke="#0b2e14" strokeWidth="1" fill="none" opacity="0.3" />
          {/* Tree vectors */}
          <polygon points="15,2 10,12 13,12 8,22 22,22 17,12 20,12" fill="#156e2e" opacity="0.8" />
          <rect x="14" y="22" width="2" height="4" fill="#5c3f15" />
          <polygon points="5,7 2,14 4,14 1,21 9,21 6,14 8,14" fill="#0d5c23" opacity="0.4" />
          <polygon points="25,10 22,17 24,17 21,24 29,24 26,17 28,17" fill="#0d5c23" opacity="0.4" />
        </pattern>

        {/* 2. Pasture Pattern (Rolling Meadows & Sheep) */}
        <pattern id="pasture-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#2d7a29" />
          <path d="M-10,25 Q10,10 30,25 T70,25" fill="none" stroke="#225c1e" strokeWidth="2" opacity="0.3" />
          <path d="M10,35 Q25,25 40,35 T70,35" fill="none" stroke="#225c1e" strokeWidth="1.5" opacity="0.3" />
          {/* Cute sheep shape */}
          <g transform="translate(18,12) scale(0.65)" opacity="0.85">
            <ellipse cx="10" cy="10" rx="8" ry="6" fill="#f8fafc" />
            <circle cx="16" cy="7" r="3" fill="#1e293b" /> {/* Head */}
            <rect x="6" y="14" width="1.8" height="5" fill="#1e293b" rx="0.5" />
            <rect x="12" y="14" width="1.8" height="5" fill="#1e293b" rx="0.5" />
            <rect x="4" y="13" width="1.8" height="5" fill="#1e293b" rx="0.5" />
            <rect x="14" y="13" width="1.8" height="5" fill="#1e293b" rx="0.5" />
          </g>
          {/* Flower details */}
          <circle cx="8" cy="8" r="1.5" fill="#fbbf24" opacity="0.6" />
          <circle cx="32" cy="28" r="1.5" fill="#fbbf24" opacity="0.6" />
        </pattern>

        {/* 3. Fields Pattern (Wheat Rows) */}
        <pattern id="fields-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#ca8a04" />
          {/* Parallel farming lines */}
          <line x1="0" y1="0" x2="30" y2="30" stroke="#a16207" strokeWidth="2" opacity="0.5" />
          <line x1="-15" y1="15" x2="15" y2="45" stroke="#a16207" strokeWidth="2" opacity="0.5" />
          <line x1="15" y1="-15" x2="45" y2="15" stroke="#a16207" strokeWidth="2" opacity="0.5" />
          {/* Wheat stalk symbols */}
          <g transform="translate(10,5) scale(0.4)" stroke="#eab308" strokeWidth="2" fill="none" opacity="0.8">
            <path d="M10,25 L10,5" />
            <path d="M10,8 C7,6 7,2 10,0 C13,2 13,6 10,8 Z" fill="#eab308" />
            <path d="M10,14 C5,12 5,8 10,6 C15,8 15,12 10,14 Z" fill="#eab308" />
            <path d="M10,20 C5,18 5,14 10,12 C15,14 15,18 10,20 Z" fill="#eab308" />
          </g>
        </pattern>

        {/* 4. Hills Pattern (Clay/Bricks) */}
        <pattern id="hills-pattern" width="40" height="30" patternUnits="userSpaceOnUse">
          <rect width="40" height="30" fill="#b91c1c" />
          {/* Brick wall outline textures */}
          <path d="M 0,0 L 40,0 M 0,15 L 40,15 M 0,30 L 40,30 M 10,0 L 10,15 M 30,0 L 30,15 M 0,15 L 0,30 M 20,15 L 20,30 M 40,15 L 40,30" 
                stroke="#7f1d1d" strokeWidth="2.5" fill="none" opacity="0.6" />
          {/* Clay pits details */}
          <ellipse cx="25" cy="8" rx="8" ry="4" fill="#991b1b" opacity="0.4" />
          <ellipse cx="10" cy="23" rx="6" ry="3" fill="#991b1b" opacity="0.4" />
        </pattern>

        {/* 5. Mountains Pattern (Rocky peaks) */}
        <pattern id="mountains-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="#475569" />
          {/* Large rocky peaks with snowcaps */}
          <g transform="translate(5,5)">
            {/* Mountain 1 */}
            <polygon points="20,5 5,40 35,40" fill="#334155" />
            <polygon points="20,5 15,16 25,16" fill="#f8fafc" /> {/* Snow cap */}
            <line x1="20" y1="5" x2="20" y2="40" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
          </g>
          <g transform="translate(22,18) scale(0.75)">
            {/* Mountain 2 */}
            <polygon points="20,5 5,40 35,40" fill="#1e293b" opacity="0.7" />
            <polygon points="20,5 15,16 25,16" fill="#e2e8f0" />
            <line x1="20" y1="5" x2="20" y2="40" stroke="#0f172a" strokeWidth="1" opacity="0.4" />
          </g>
        </pattern>

        {/* 6. Desert Pattern (Sand Dunes) */}
        <pattern id="desert-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#d97706" />
          {/* Wind-swept sand ridges */}
          <path d="M0,15 C10,5 20,25 40,15 T80,15" fill="none" stroke="#b45309" strokeWidth="2.5" opacity="0.5" />
          <path d="M0,35 C15,25 25,45 40,35 T80,35" fill="none" stroke="#b45309" strokeWidth="2" opacity="0.4" />
          {/* Small cactus */}
          <g transform="translate(10,22) scale(0.6)" stroke="#854d0e" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7">
            <path d="M 5,20 L 5,5" />
            <path d="M 1,11 L 4,11 L 4,7" />
            <path d="M 9,14 L 6,14 L 6,9" />
          </g>
        </pattern>

        {/* Wooden Ring Border Frame definition */}
        <radialGradient id="wood-border" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#292524" stopOpacity="0" />
          <stop offset="90%" stopColor="#44403c" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1c1917" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* Decorative Outer Sea Ring Background */}
      <circle cx="0" cy="0" r={HEX_SIZE * 5.2} fill="url(#wood-border)" style={{ pointerEvents: 'none' }} />
      <circle cx="0" cy="0" r={HEX_SIZE * 5.1} fill="none" stroke="#292524" strokeWidth="4" opacity="0.3" style={{ pointerEvents: 'none' }} />
      {/* Decorative Ocean wave lines */}
      <circle className="water-wave" cx="0" cy="0" r={HEX_SIZE * 4.6} />
      <circle className="water-wave" cx="0" cy="0" r={HEX_SIZE * 4.2} style={{ animationDelay: '-4s' }} />
      <circle className="water-wave" cx="0" cy="0" r={HEX_SIZE * 3.8} style={{ animationDelay: '-8s' }} />

      {/* 1. Hexes Layer */}
      <g id="hexes-layer">
        {Object.entries(board.hexes).map(([key, hex]) => {
          const center = hexToPixel(hex.coord, HEX_SIZE);
          const corners = hexCorners(hex.coord, HEX_SIZE);
          const pointsString = corners.map(c => `${c.x},${c.y}`).join(' ');

          const isRobberMovePhase = state.turnPhase === TurnPhase.ROBBER_MOVE;
          const isRobberTarget = isRobberMovePhase && !hex.hasRobber;

          return (
            <g 
              key={key} 
              className={`board-hex-group ${isRobberTarget ? 'robber-target' : ''}`}
              onClick={() => handleHexClick(key)}
            >
              <polygon
                points={pointsString}
                fill={getTerrainFill(hex.terrain)}
                stroke="#0f172a"
                strokeWidth="2.5"
                className="board-hex-polygon"
                filter="url(#shadow)"
              />
              
              {/* Number Tokens - Clay styling with gold outline */}
              {hex.numberToken && (
                <g className="number-token-group" transform={`translate(${center.x}, ${center.y})`} style={{ pointerEvents: 'none' }}>
                  <circle cx="0" cy="0" r="18" className="number-token-bg" />
                  
                  {/* Probability dots representation */}
                  <text
                    x="0"
                    y="10"
                    textAnchor="middle"
                    className={`number-token-dots ${hex.numberToken === 6 || hex.numberToken === 8 ? 'red-token' : ''}`}
                  >
                    {getProbabilityDots(hex.numberToken)}
                  </text>
                  
                  {/* Main Roll Number */}
                  <text
                    x="0"
                    y="-1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`number-token-text ${hex.numberToken === 6 || hex.numberToken === 8 ? 'red-token' : ''}`}
                    fontSize="16"
                  >
                    {hex.numberToken}
                  </text>
                </g>
              )}

              {/* Robber overlay - Detailed Bandit Silhouette */}
              {hex.hasRobber && (
                <g className="robber-figure" transform={`translate(${center.x}, ${center.y})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  <circle cx="0" cy="2" r="13" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                  <path d="M-6,7 Q-12,5 -9,-4 Q-6,-11 0,-11 Q6,-11 9,-4 Q12,5 6,7 Z" fill="#ef4444" opacity="0.35" />
                  <path d="M-4,4 Q-8,2 -6,-4 Q-4,-8 0,-8 Q4,-8 6,-4 Q8,2 4,4 Z" fill="#0f172a" />
                  {/* Glowing skull/eyes */}
                  <circle cx="-2.5" cy="-2" r="1.2" fill="#ef4444" />
                  <circle cx="2.5" cy="-2" r="1.2" fill="#ef4444" />
                  <path d="M-3,1 L3,1" stroke="#ef4444" strokeWidth="1" />
                </g>
              )}

              {/* Merchant overlay - Beautiful 3D Gold Sack */}
              {state.merchant && state.merchant.hexKey === key && (
                <g transform={`translate(${center.x - 20}, ${center.y - 20})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  <ellipse cx="0" cy="4" rx="9" ry="6" fill="#d97706" />
                  <path d="M-5,4 C-8,4 -10,-2 -7,-4 C-4,-6 -2,-1 0,-1 C2,-1 4,-6 7,-4 C10,-2 8,4 5,4 Z" fill="#f59e0b" />
                  <circle cx="0" cy="-4" r="5" fill="#d97706" />
                  <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#78350f" strokeWidth="1.8" />
                  {/* Currency sign */}
                  <text x="0" y="3" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#78350f" fontWeight="bold">💰</text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* 2. Ports Layer - Connectors & Anchor badges */}
      <g id="ports-layer">
        {board.ports.map((port, idx) => {
          const [v1Key, v2Key] = port.vertices;
          const v1 = board.vertices[v1Key];
          const v2 = board.vertices[v2Key];
          if (!v1 || !v2) return null;

          const p1 = vertexToPixel(v1.coord, HEX_SIZE);
          const p2 = vertexToPixel(v2.coord, HEX_SIZE);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          // Project the port badge slightly outward from the island center
          const angle = Math.atan2(midY, midX);
          const offsetDist = 18;
          const badgeX = midX + Math.cos(angle) * offsetDist;
          const badgeY = midY + Math.sin(angle) * offsetDist;

          return (
            <g key={`port-${idx}`}>
              {/* Dashed connector line to harbor vertices */}
              <line x1={p1.x} y1={p1.y} x2={badgeX} y2={badgeY} className="port-dashed-connector" />
              <line x1={p2.x} y1={p2.y} x2={badgeX} y2={badgeY} className="port-dashed-connector" />
              
              {/* Detailed Port Badge */}
              <g transform={`translate(${badgeX}, ${badgeY})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                <circle cx="0" cy="0" r="12" className="port-circle" />
                {/* Harbor Anchor Graphic */}
                <path d="M0,-6 L0,6 M-4,2 L4,2 M-5,-2 C-5,5 5,5 5,-2" fill="none" stroke="var(--accent-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="0" cy="-6" r="2.5" fill="none" stroke="var(--accent-secondary)" strokeWidth="1.5" />
                
                {/* Overlay Text for ratios */}
                <g transform="translate(0, 15)" filter="url(#soft-glow)">
                  <rect x="-14" y="-7" width="28" height="13" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <text 
                    x="0" 
                    y="-1" 
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    fontSize="9" 
                    fill="var(--accent-secondary)"
                    fontWeight="800"
                    fontFamily="Outfit, sans-serif"
                  >
                    {port.type === PortType.GENERAL_3_1 ? '3:1' : '2:1'}
                  </text>
                </g>
              </g>
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

          return (
            <g 
              key={key} 
              className={isClickable ? 'road-clickable' : ''}
              onClick={() => isClickable && handleEdgeClick(key)}
            >
              {/* Thick transparent touch trigger */}
              <line 
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                stroke="transparent" 
                strokeWidth="26"
              />

              {/* Built road - layered gradients for 3D raised road effect */}
              {hasRoad && edge.road && (
                <g style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  {/* Dark base/shadow line */}
                  <line 
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke="#000" 
                    strokeWidth="7" 
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                  {/* Main Road Body */}
                  <line 
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke={getPlayerColor(edge.road.playerId)} 
                    strokeWidth="5" 
                    strokeLinecap="round"
                  />
                  {/* Top highlight for 3D rounded look */}
                  <line 
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                </g>
              )}

              {/* Glowing candidate preview indicator */}
              {isClickable && !hasRoad && (
                <g style={{ pointerEvents: 'none' }}>
                  <line 
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
                    stroke="var(--accent-primary)" 
                    strokeWidth="7" 
                    opacity="0.85"
                    className="road-preview"
                    filter="url(#soft-glow)"
                  />
                  <circle 
                    cx={mid.x} cy={mid.y} r="8" 
                    fill="#ffffff" 
                    stroke="var(--accent-primary)" 
                    strokeWidth="2.5"
                    filter="url(#soft-glow)"
                  />
                </g>
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

          return (
            <g 
              key={key} 
              className={isClickable ? 'vertex-clickable' : ''}
              onClick={() => (isClickable || hasKnight) && handleVertexClick(key)}
            >
              {/* Touch hit box */}
              <circle 
                cx={pos.x} cy={pos.y} r="18" 
                fill="transparent" 
              />

              {/* Glowing candidate placement dot */}
              {isClickable && !hasBuilding && !hasKnight && (
                <circle 
                  cx={pos.x} cy={pos.y} r="11" 
                  fill="var(--accent-primary)"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="vertex-preview pulse-glow"
                  filter="url(#soft-glow)"
                />
              )}

              {/* Settlements - Beautiful 3D Cottage with roof details */}
              {hasBuilding && vertex.building?.type === 'settlement' && (
                <g className="catan-structure" transform={`translate(${pos.x}, ${pos.y})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  {/* Left Side wall */}
                  <polygon points="-8,4 -2,7 -2,-1 -8,-4" fill={getPlayerColor(vertex.building.playerId)} filter="brightness(0.85)" />
                  {/* Front wall */}
                  <polygon points="-2,7 8,3 8,-5 -2,-1" fill={getPlayerColor(vertex.building.playerId)} />
                  {/* Roof Left */}
                  <polygon points="-9,-3 -3,-7 -3,-1 -9,3" fill="#ef4444" />
                  {/* Roof Right */}
                  <polygon points="-3,-7 9,-11 9,-5 -3,-1" fill="#dc2626" />
                  {/* Door */}
                  <rect x="2" y="0" width="3" height="3" fill="#1e293b" />
                  {/* Chimney */}
                  <rect x="-6" y="-8" width="1.5" height="3.5" fill="#475569" />
                </g>
              )}

              {/* Cities - Medieval Keep with high towers, battlements, and flags */}
              {hasBuilding && vertex.building?.type === 'city' && (
                <g className="catan-structure" transform={`translate(${pos.x}, ${pos.y})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  {/* City Wall (if built) - Stone ring around keep base */}
                  {vertex.building.hasCityWall && (
                    <circle cx="0" cy="1" r="13" fill="none" stroke="#64748b" strokeWidth="3" opacity="0.9" />
                  )}

                  {/* Main Castle Keep walls */}
                  <rect x="-10" y="-3" width="20" height="10" fill={getPlayerColor(vertex.building.playerId)} rx="1" />
                  
                  {/* Left Tower */}
                  <rect x="-11" y="-10" width="6" height="15" fill={getPlayerColor(vertex.building.playerId)} filter="brightness(0.9)" />
                  <polygon points="-12,-10 -8,-15 -4,-10" fill="#dc2626" /> {/* Roof */}
                  
                  {/* Right Tower */}
                  <rect x="5" y="-12" width="6" height="17" fill={getPlayerColor(vertex.building.playerId)} filter="brightness(1.1)" />
                  <polygon points="4,-12 8,-18 12,-12" fill="#ef4444" /> {/* Roof */}
                  
                  {/* Main Gate */}
                  <path d="M-2,7 L-2,3 C-2,1 2,1 2,3 L2,7 Z" fill="#1e293b" />

                  {/* Metropolis - Golden Crown Spire */}
                  {vertex.building.hasMetropolis && (
                    <g transform="translate(0, -18)">
                      <line x1="0" y1="5" x2="0" y2="-8" stroke="#fbbf24" strokeWidth="2.5" />
                      <polygon points="0,-8 -3,-3 3,-3" fill="#fbbf24" />
                      <circle cx="0" cy="-8" r="2.2" fill="#f59e0b" />
                    </g>
                  )}
                </g>
              )}

              {/* Knights - Metal Shield with swords & star-level indicator */}
              {hasKnight && vertex.knight && (
                <g className="catan-structure" transform={`translate(${pos.x}, ${pos.y})`} style={{ pointerEvents: 'none' }} filter="url(#shadow)">
                  {/* Back Active Glow */}
                  {vertex.knight.isActive && (
                    <circle cx="0" cy="0" r="14" fill="none" stroke="var(--accent-primary)" strokeWidth="3.5" opacity="0.8" className="pulse-glow" />
                  )}
                  {/* Shield Frame */}
                  <path d="M-9,-9 L9,-9 C9,-9 9,3 0,11 C-9,3 -9,-9 -9,-9 Z" 
                        fill={vertex.knight.isActive ? getPlayerColor(vertex.knight.playerId) : '#1e293b'} 
                        stroke={getPlayerColor(vertex.knight.playerId)} 
                        strokeWidth="2.5" />
                  
                  {/* Crossed Swords logo in the background */}
                  <path d="M-6,5 L6,-7 M6,5 L-6,-7" stroke={vertex.knight.isActive ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" />
                  
                  {/* Level text */}
                  <text 
                    x="0" 
                    y="1" 
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    fontSize="11" 
                    fill={vertex.knight.isActive ? '#fff' : 'var(--text-secondary)'}
                    fontWeight="900"
                    fontFamily="Outfit, sans-serif"
                  >
                    {vertex.knight.level}
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
