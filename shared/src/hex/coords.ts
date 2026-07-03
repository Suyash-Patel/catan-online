// ============================================================
// Hex Coordinate Functions
// ============================================================
// Axial coordinates (q, r) with cube derivation (s = -q - r)
// Pointy-top orientation throughout

import type { HexCoord, VertexCoord, EdgeCoord, VertexDirection, EdgeDirection } from '../types/board.js';

// --- Key serialization (deterministic string keys for Maps/Records) ---

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function vertexKey(coord: VertexCoord): string {
  return `${coord.q},${coord.r},${coord.dir}`;
}

export function edgeKey(coord: EdgeCoord): string {
  return `${coord.q},${coord.r},${coord.dir}`;
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function parseVertexKey(key: string): VertexCoord {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as VertexDirection };
}

export function parseEdgeKey(key: string): EdgeCoord {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as EdgeDirection };
}

// --- Cube coordinates ---

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export function cubeFromAxial(q: number, r: number): CubeCoord {
  return { q, r, s: -q - r };
}

// --- Distance ---

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = cubeFromAxial(a.q, a.r);
  const bc = cubeFromAxial(b.q, b.r);
  return Math.max(
    Math.abs(ac.q - bc.q),
    Math.abs(ac.r - bc.r),
    Math.abs(ac.s - bc.s)
  );
}

// --- Neighbors ---

/** The 6 axial direction offsets for hex neighbors (pointy-top) */
const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },   // E
  { q: 1, r: -1 },  // NE
  { q: 0, r: -1 },  // NW
  { q: -1, r: 0 },  // W
  { q: -1, r: 1 },  // SW
  { q: 0, r: 1 },   // SE
];

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexNeighborInDirection(coord: HexCoord, dirIndex: number): HexCoord {
  const d = HEX_DIRECTIONS[dirIndex];
  return { q: coord.q + d.q, r: coord.r + d.r };
}

// --- Pixel conversion (pointy-top) ---

const SQRT3 = Math.sqrt(3);

/**
 * Convert axial hex coordinate to pixel position (center of hex).
 * Pointy-top orientation.
 * @param coord Axial coordinate
 * @param size Hex size (distance from center to vertex)
 */
export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const x = size * SQRT3 * (coord.q + coord.r / 2);
  const y = size * 1.5 * coord.r;
  return { x, y };
}

/**
 * Convert pixel position to the nearest hex coordinate.
 * Uses cube rounding.
 */
export function pixelToHex(x: number, y: number, size: number): HexCoord {
  // Inverse of hexToPixel
  const q = (x * SQRT3 / 3 - y / 3) / size;
  const r = (y * 2 / 3) / size;
  return cubeRoundToAxial(q, r);
}

function cubeRoundToAxial(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  // else rs = -rq - rr (implicit)

  return { q: rq, r: rr };
}

// --- Vertex pixel positions ---

/**
 * Get the pixel position of a vertex.
 * A vertex is identified by (q, r, dir) where dir is 'N' or 'S'.
 * 'N' = top vertex (pointy-top), 'S' = bottom vertex.
 */
export function vertexToPixel(coord: VertexCoord, size: number): { x: number; y: number } {
  const hexCenter = hexToPixel({ q: coord.q, r: coord.r }, size);
  if (coord.dir === 'N') {
    return { x: hexCenter.x, y: hexCenter.y - size };
  } else {
    return { x: hexCenter.x, y: hexCenter.y + size };
  }
}

/**
 * Get the pixel position of the midpoint of an edge.
 * Edge directions: 'NE', 'E', 'SE'
 */
export function edgeToPixel(coord: EdgeCoord, size: number): { x: number; y: number } {
  const hexCenter = hexToPixel({ q: coord.q, r: coord.r }, size);
  switch (coord.dir) {
    case 'NE':
      return { x: hexCenter.x + SQRT3 / 2 * size, y: hexCenter.y - size / 2 };
    case 'E':
      return { x: hexCenter.x + SQRT3 * size, y: hexCenter.y };
    case 'SE':
      return { x: hexCenter.x + SQRT3 / 2 * size, y: hexCenter.y + size / 2 };
  }
}

/**
 * Get the two endpoint pixel positions of an edge (for rendering road lines).
 */
export function edgeEndpoints(coord: EdgeCoord, size: number): [{ x: number; y: number }, { x: number; y: number }] {
  const hexCenter = hexToPixel({ q: coord.q, r: coord.r }, size);
  const h = size; // height from center to vertex
  const w = SQRT3 / 2 * size; // half-width

  switch (coord.dir) {
    case 'NE':
      // Top vertex (N) to top-right vertex
      return [
        { x: hexCenter.x, y: hexCenter.y - h },
        { x: hexCenter.x + w, y: hexCenter.y - h / 2 },
      ];
    case 'E':
      // Top-right vertex to bottom-right vertex
      return [
        { x: hexCenter.x + w, y: hexCenter.y - h / 2 },
        { x: hexCenter.x + w, y: hexCenter.y + h / 2 },
      ];
    case 'SE':
      // Bottom-right vertex to bottom vertex
      return [
        { x: hexCenter.x + w, y: hexCenter.y + h / 2 },
        { x: hexCenter.x, y: hexCenter.y + h },
      ];
  }
}

/**
 * Get the 6 corner pixel positions of a hex (for rendering the hex polygon).
 * Returns corners in order starting from top, going clockwise (pointy-top).
 */
export function hexCorners(coord: HexCoord, size: number): Array<{ x: number; y: number }> {
  const center = hexToPixel(coord, size);
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first corner is at top (90°)
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  return corners;
}
