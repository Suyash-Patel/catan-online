// ============================================================
// Board Geometry Types
// ============================================================

// --- Coordinates ---

/** Axial hex coordinate. s = -q - r (derived, not stored). */
export interface HexCoord {
  q: number;
  r: number;
}

/** Vertex at a hex corner. 'N' = top vertex, 'S' = bottom vertex (pointy-top orientation). */
export type VertexDirection = 'N' | 'S';
export interface VertexCoord {
  q: number;
  r: number;
  dir: VertexDirection;
}

/** Edge of a hex. 'NE' = top-right, 'E' = right, 'SE' = bottom-right (pointy-top). */
export type EdgeDirection = 'NE' | 'E' | 'SE';
export interface EdgeCoord {
  q: number;
  r: number;
  dir: EdgeDirection;
}

// --- Terrain ---

export enum TerrainType {
  FOREST = 'FOREST',       // produces Lumber (+ Paper from cities in C&K)
  PASTURE = 'PASTURE',     // produces Wool (+ Cloth from cities in C&K)
  FIELDS = 'FIELDS',       // produces Grain
  HILLS = 'HILLS',         // produces Brick
  MOUNTAINS = 'MOUNTAINS', // produces Ore (+ Coin from cities in C&K)
  DESERT = 'DESERT',       // no production
  SEA = 'SEA',             // board border
}

// --- Port ---

export enum PortType {
  GENERAL_3_1 = 'GENERAL_3_1',
  BRICK_2_1 = 'BRICK_2_1',
  LUMBER_2_1 = 'LUMBER_2_1',
  ORE_2_1 = 'ORE_2_1',
  GRAIN_2_1 = 'GRAIN_2_1',
  WOOL_2_1 = 'WOOL_2_1',
}

export interface Port {
  type: PortType;
  // The two coastal vertices this port connects to
  vertices: [string, string]; // vertex keys
  // Direction the port faces (for rendering the port icon)
  facingHex: HexCoord;
}

// --- Board Components ---

export interface HexTile {
  coord: HexCoord;
  terrain: TerrainType;
  numberToken: number | null; // 2-12, null for desert
  hasRobber: boolean;
}

export interface Building {
  playerId: string;
  type: 'settlement' | 'city';
  hasCityWall: boolean;
  hasMetropolis: boolean;
}

export interface KnightPiece {
  playerId: string;
  level: number; // 1 = basic, 2 = strong, 3 = mighty
  isActive: boolean;
  hasActedThisTurn: boolean;
}

export interface Vertex {
  coord: VertexCoord;
  building: Building | null;
  knight: KnightPiece | null;
}

export interface Edge {
  coord: EdgeCoord;
  road: { playerId: string } | null;
}

// --- Board ---

export interface Board {
  hexes: Record<string, HexTile>;       // key = hexKey(coord)
  vertices: Record<string, Vertex>;     // key = vertexKey(coord)
  edges: Record<string, Edge>;          // key = edgeKey(coord)
  ports: Port[];
  
  // Pre-computed adjacency maps for fast lookups
  vertexToHexes: Record<string, string[]>;    // vertexKey → hexKeys
  vertexToVertices: Record<string, string[]>; // vertexKey → adjacent vertexKeys
  vertexToEdges: Record<string, string[]>;    // vertexKey → adjacent edgeKeys
  edgeToVertices: Record<string, [string, string]>; // edgeKey → endpoint vertexKeys
  edgeToEdges: Record<string, string[]>;      // edgeKey → adjacent edgeKeys
  hexToVertices: Record<string, string[]>;    // hexKey → vertexKeys
  hexToEdges: Record<string, string[]>;       // hexKey → edgeKeys
}
