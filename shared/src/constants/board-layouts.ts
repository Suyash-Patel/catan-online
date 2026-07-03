// ============================================================
// Board Layout Data — Hex positions, resource distributions, ports
// ============================================================

import type { HexCoord } from '../types/board.js';
import { TerrainType, PortType } from '../types/board.js';

// --- Standard Board (3-4 players): 19 hexes, 3-4-5-4-3 layout ---

/** All hex positions for the standard board (axial coords, centered at 0,0) */
export const STANDARD_HEX_COORDS: HexCoord[] = [
  // Row 0 (top): 3 hexes
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  // Row 1: 4 hexes
  { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  // Row 2 (middle): 5 hexes
  { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  // Row 3: 4 hexes
  { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
  // Row 4 (bottom): 3 hexes
  { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
];

/** Resource distribution for standard board (19 tiles) */
export const STANDARD_TERRAIN_DISTRIBUTION: TerrainType[] = [
  TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST,
  TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE,
  TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS,
  TerrainType.HILLS, TerrainType.HILLS, TerrainType.HILLS,
  TerrainType.MOUNTAINS, TerrainType.MOUNTAINS, TerrainType.MOUNTAINS,
  TerrainType.DESERT,
];

/** Number tokens for standard board (18 tokens, no 7) */
export const STANDARD_NUMBER_TOKENS: number[] = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
];

/** Spiral order for number token placement (A-R).
 *  Starting from top-left corner, spiraling counter-clockwise inward.
 *  Maps to official alphabetical token sequence: A=5, B=2, C=6, D=3, E=8, ...
 */
export const STANDARD_SPIRAL_ORDER: number[] = [
  // These are indices into STANDARD_HEX_COORDS for the spiral path
  0, 3, 7, 12, 16, 17, 18, 15, 11, 6, 2, 1,  // outer ring (12)
  4, 8, 13, 14, 10, 5,                          // inner ring (6)
  9,                                              // center (1)
];

/** Official number token sequence (A through R) */
export const STANDARD_TOKEN_SEQUENCE: number[] = [
  5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11,
];

// --- Extended Board (5-6 players): 30 hexes, 3-4-5-6-5-4-3 layout ---

export const EXTENDED_HEX_COORDS: HexCoord[] = [
  // Row 0 (top): 3 hexes
  { q: 0, r: -3 }, { q: 1, r: -3 }, { q: 2, r: -3 },
  // Row 1: 4 hexes
  { q: -1, r: -2 }, { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  // Row 2: 5 hexes
  { q: -2, r: -1 }, { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  // Row 3 (middle): 6 hexes
  { q: -3, r: 0 }, { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  // Row 4: 5 hexes
  { q: -3, r: 1 }, { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
  // Row 5: 4 hexes
  { q: -3, r: 2 }, { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 },
  // Row 6 (bottom): 3 hexes
  { q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 3 },
];

/** Resource distribution for extended board (30 tiles) */
export const EXTENDED_TERRAIN_DISTRIBUTION: TerrainType[] = [
  TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST,
  TerrainType.FOREST, TerrainType.FOREST, TerrainType.FOREST,
  TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE,
  TerrainType.PASTURE, TerrainType.PASTURE, TerrainType.PASTURE,
  TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS,
  TerrainType.FIELDS, TerrainType.FIELDS, TerrainType.FIELDS,
  TerrainType.HILLS, TerrainType.HILLS, TerrainType.HILLS,
  TerrainType.HILLS, TerrainType.HILLS,
  TerrainType.MOUNTAINS, TerrainType.MOUNTAINS, TerrainType.MOUNTAINS,
  TerrainType.MOUNTAINS, TerrainType.MOUNTAINS,
  TerrainType.DESERT, TerrainType.DESERT,
];

/** Number tokens for extended board (28 tokens) */
export const EXTENDED_NUMBER_TOKENS: number[] = [
  2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6,
  8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12,
];

// --- Port Definitions ---

/** Port locations for standard board. Each port has a position (edge of board) and the two coastal vertices it serves. */
export interface PortDefinition {
  type: PortType;
  // Hex coord that the port faces (a sea-adjacent land hex)
  facingHexQ: number;
  facingHexR: number;
  // Edge direction from the facing hex
  edgeDir: 'NE' | 'E' | 'SE';
}

/** Standard board port types (9 ports) - types will be randomized to positions */
export const STANDARD_PORT_TYPES: PortType[] = [
  PortType.GENERAL_3_1, PortType.GENERAL_3_1, PortType.GENERAL_3_1, PortType.GENERAL_3_1,
  PortType.BRICK_2_1, PortType.LUMBER_2_1, PortType.ORE_2_1, PortType.GRAIN_2_1, PortType.WOOL_2_1,
];

/** Extended board port types (11 ports) */
export const EXTENDED_PORT_TYPES: PortType[] = [
  PortType.GENERAL_3_1, PortType.GENERAL_3_1, PortType.GENERAL_3_1,
  PortType.GENERAL_3_1, PortType.GENERAL_3_1,
  PortType.BRICK_2_1, PortType.LUMBER_2_1, PortType.ORE_2_1,
  PortType.GRAIN_2_1, PortType.WOOL_2_1, PortType.WOOL_2_1,
];

/**
 * Port edge positions for the standard board.
 * Each entry is [hexQ, hexR, edgeDir] identifying a board-border edge
 * where a port should be placed. The port connects to the two vertices
 * of that edge.
 */
export const STANDARD_PORT_POSITIONS: Array<{ q: number; r: number; dir: 'NE' | 'E' | 'SE' }> = [
  { q: 0, r: -2, dir: 'NE' },    // Top edge ports
  { q: 2, r: -2, dir: 'E' },
  { q: 2, r: -1, dir: 'SE' },
  { q: 2, r: 0, dir: 'SE' },
  { q: 0, r: 2, dir: 'SE' },     // Bottom edge ports
  { q: -2, r: 2, dir: 'E' },
  { q: -2, r: 1, dir: 'NE' },
  { q: -2, r: 0, dir: 'NE' },
  { q: -1, r: -1, dir: 'NE' },
];

export const EXTENDED_PORT_POSITIONS: Array<{ q: number; r: number; dir: 'NE' | 'E' | 'SE' }> = [
  { q: 0, r: -3, dir: 'NE' },
  { q: 2, r: -3, dir: 'E' },
  { q: 2, r: -2, dir: 'SE' },
  { q: 2, r: -1, dir: 'SE' },
  { q: 2, r: 0, dir: 'SE' },
  { q: 0, r: 2, dir: 'SE' },      
  { q: -1, r: 3, dir: 'SE' },     
  { q: -3, r: 3, dir: 'E' },
  { q: -3, r: 2, dir: 'NE' },
  { q: -3, r: 1, dir: 'NE' },
  { q: -2, r: -1, dir: 'NE' },
];

/** Helper to get board config based on player count */
export function getBoardConfig(playerCount: number) {
  const isExtended = playerCount >= 5;
  return {
    hexCoords: isExtended ? EXTENDED_HEX_COORDS : STANDARD_HEX_COORDS,
    terrainDistribution: isExtended ? EXTENDED_TERRAIN_DISTRIBUTION : STANDARD_TERRAIN_DISTRIBUTION,
    numberTokens: isExtended ? EXTENDED_NUMBER_TOKENS : STANDARD_NUMBER_TOKENS,
    portTypes: isExtended ? EXTENDED_PORT_TYPES : STANDARD_PORT_TYPES,
    portPositions: isExtended ? EXTENDED_PORT_POSITIONS : STANDARD_PORT_POSITIONS,
    isExtended,
  };
}
