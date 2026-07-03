// ============================================================
// Board Generator
// ============================================================

import { GameSettings } from '@catan/shared/types/game.js';
import { Board, HexCoord, HexTile, TerrainType, PortType, Port, EdgeCoord, VertexCoord, Vertex, Edge } from '@catan/shared/types/board.js';
import { getBoardConfig } from '@catan/shared/constants/board-layouts.js';
import { hexKey, vertexKey, edgeKey } from '@catan/shared/hex/coords.js';
import { buildAdjacencyMaps, hexVertices, hexEdges, edgeVertices } from '@catan/shared/hex/topology.js';

/**
 * Randomize array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateBoard(settings: GameSettings): Board {
  const config = getBoardConfig(settings.playerCount);
  
  // 1. Assign Terrains
  const shuffledTerrains = shuffle(config.terrainDistribution);
  
  // 2. Assign Number Tokens
  // We want to assign numbers to non-desert hexes.
  // Standard rule: Follow spiral pattern.
  // Wait, the prompt says: "Place number tokens with no-adjacent-6/8 constraint (retry/swap on violation)"
  // Let's implement a robust randomizer that avoids adjacent 6/8s.
  // First, map terrains to coords.
  const hexes: Record<string, HexTile> = {};
  
  const terrainAssignments = config.hexCoords.map((coord, i) => ({
    coord,
    terrain: shuffledTerrains[i]
  }));
  
  const nonDesertAssignments = terrainAssignments.filter(a => a.terrain !== TerrainType.DESERT);
  
  // Try to place numbers without adjacent 6/8s
  let validPlacement = false;
  let finalNumbers: number[] = [];
  
  let attempts = 0;
  while (!validPlacement && attempts < 1000) {
    attempts++;
    finalNumbers = shuffle(config.numberTokens);
    
    // Check for adjacent 6/8s
    validPlacement = true;
    const numberMap = new Map<string, number>();
    for (let i = 0; i < nonDesertAssignments.length; i++) {
      numberMap.set(hexKey(nonDesertAssignments[i].coord), finalNumbers[i]);
    }
    
    for (let i = 0; i < nonDesertAssignments.length; i++) {
      const coord = nonDesertAssignments[i].coord;
      const num = finalNumbers[i];
      if (num === 6 || num === 8) {
        // check neighbors
        // neighbors of coord:
        const neighbors = [
          { q: coord.q + 1, r: coord.r },
          { q: coord.q + 1, r: coord.r - 1 },
          { q: coord.q, r: coord.r - 1 },
          { q: coord.q - 1, r: coord.r },
          { q: coord.q - 1, r: coord.r + 1 },
          { q: coord.q, r: coord.r + 1 },
        ];
        
        for (const n of neighbors) {
          const neighborNum = numberMap.get(hexKey(n));
          if (neighborNum === 6 || neighborNum === 8) {
            validPlacement = false;
            break;
          }
        }
      }
      if (!validPlacement) break;
    }
  }
  
  if (!validPlacement) {
    console.warn("Failed to find number token placement without adjacent 6/8s after 1000 attempts. Proceeding with last attempt.");
  }
  
  let numberIndex = 0;
  
  let robberHex: HexCoord | null = null;

  for (const assignment of terrainAssignments) {
    const isDesert = assignment.terrain === TerrainType.DESERT;
    const num = isDesert ? null : finalNumbers[numberIndex++];
    const hasRobber = isDesert && robberHex === null; // Place robber on the first desert
    if (hasRobber) {
      robberHex = assignment.coord;
    }
    hexes[hexKey(assignment.coord)] = {
      coord: assignment.coord,
      terrain: assignment.terrain,
      numberToken: num,
      hasRobber
    };
  }

  // 3. Adjacency Maps
  const adjacency = buildAdjacencyMaps(config.hexCoords);
  
  // 4. Create Vertices and Edges
  const vertices: Record<string, Vertex> = {};
  for (const vk of adjacency.allVertexKeys) {
    const parts = vk.split(',');
    vertices[vk] = {
      coord: { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as 'N'|'S' },
      building: null,
      knight: null
    };
  }
  
  const edges: Record<string, Edge> = {};
  for (const ek of adjacency.allEdgeKeys) {
    const parts = ek.split(',');
    edges[ek] = {
      coord: { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as 'NE'|'E'|'SE' },
      road: null
    };
  }
  
  // 5. Place Ports
  const ports: Port[] = [];
  const shuffledPortTypes = shuffle(config.portTypes);
  
  for (let i = 0; i < config.portPositions.length; i++) {
    const pos = config.portPositions[i];
    const edgeCoord: EdgeCoord = { q: pos.q, r: pos.r, dir: pos.dir };
    const [v1, v2] = edgeVertices(edgeCoord);
    ports.push({
      type: shuffledPortTypes[i],
      vertices: [vertexKey(v1), vertexKey(v2)] as [string, string],
      facingHex: { q: pos.q, r: pos.r }
    });
  }

  return {
    hexes,
    vertices,
    edges,
    ports,
    vertexToHexes: adjacency.vertexToHexes,
    vertexToVertices: adjacency.vertexToVertices,
    vertexToEdges: adjacency.vertexToEdges,
    edgeToVertices: adjacency.edgeToVertices,
    edgeToEdges: adjacency.edgeToEdges,
    hexToVertices: adjacency.hexToVertices,
    hexToEdges: adjacency.hexToEdges,
  };
}
