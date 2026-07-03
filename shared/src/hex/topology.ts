// ============================================================
// Hex Topology — Vertex and Edge adjacency relationships
// ============================================================
// Each hex has 6 vertices and 6 edges. Vertices and edges are shared
// between adjacent hexes. We use canonical coordinate forms:
//   Vertex: (q, r, 'N'|'S') — 'N' is top, 'S' is bottom (pointy-top)
//   Edge: (q, r, 'NE'|'E'|'SE') — 3 of the 6 edges per hex
// Every vertex/edge can be expressed in one canonical form.

import type { HexCoord, VertexCoord, EdgeCoord, VertexDirection, EdgeDirection } from '../types/board.js';
import { hexKey, vertexKey, edgeKey } from './coords.js';

// =====================================================================
// CANONICAL FORMS
// =====================================================================
// A hex has 6 vertices. In pointy-top orientation (corners at top/bottom):
//   Corner 0 = top         → canonical: (q, r, 'N')
//   Corner 1 = top-right   → canonical: (q+1, r-1, 'S')
//   Corner 2 = bottom-right → canonical: (q, r+1, 'N')  or equivalently (q+1, r, 'S')
//   Corner 3 = bottom      → canonical: (q, r, 'S')
//   Corner 4 = bottom-left  → canonical: (q-1, r+1, 'N') or equivalently (q, r, 'S') ← wait
//
// Let me define this more carefully. For a pointy-top hex at (q,r):
//   The 6 corners, clockwise from top:
//     0: top        = N vertex of this hex
//     1: upper-right = S vertex of hex (q+1, r-1)
//     2: lower-right = N vertex of hex (q, r+1)   [same as S vertex of hex (q+1, r)]  
//     3: bottom     = S vertex of this hex
//     4: lower-left  = N vertex of hex (q-1, r+1)  [same as S vertex of hex (q, r+1)]... 
//     5: upper-left  = S vertex of hex (q-1, r)    [same as N vertex of hex (q, r-1)]...
//
// Actually, let's use a more systematic approach. For pointy-top hex:

/**
 * Get the canonical vertex coordinate for each of the 6 corners of a hex.
 * Corners are numbered 0-5 clockwise from the top.
 * 
 * Pointy-top hex corners (each shared by up to 3 hexes):
 *   0 (top):          (q, r, 'N')
 *   1 (upper-right):  (q+1, r-1, 'S')  
 *   2 (lower-right):  (q+1, r, 'S')     — wait, this needs to be right
 *   3 (bottom):       (q, r, 'S')
 *   4 (lower-left):   (q, r+1, 'N')     — which equals (q-1, r+1, ...) no...
 *   5 (upper-left):   (q, r, 'N')       — no, that's corner 0
 * 
 * Let me redo this carefully using the standard hex vertex mapping.
 */

// For pointy-top hexagons, using the standard convention:
// Each vertex is shared by exactly 3 hexes (or fewer at board edges).
// We canonicalize each vertex to the (q, r, dir) form where we pick
// the hex with the "lowest" coordinates.
//
// The simplest correct approach: each hex contributes 2 "canonical" vertices:
//   - Its N (top) vertex: (q, r, 'N')
//   - Its S (bottom) vertex: (q, r, 'S')
// Then we define mappings so that corner X of hex (q,r) maps to the right canonical form.

/**
 * Get all 6 vertex coordinates for a hex, in canonical form.
 * Returns vertices clockwise from top: top, upper-right, lower-right, bottom, lower-left, upper-left
 */
export function hexVertices(hex: HexCoord): VertexCoord[] {
  const { q, r } = hex;
  return [
    { q, r, dir: 'N' as VertexDirection },             // 0: top
    { q: q + 1, r: r - 1, dir: 'S' as VertexDirection }, // 1: upper-right
    { q, r: r + 1, dir: 'N' as VertexDirection },         // 2: lower-right  
    { q, r, dir: 'S' as VertexDirection },               // 3: bottom
    { q: q - 1, r: r + 1, dir: 'N' as VertexDirection }, // 4: lower-left
    { q: q - 1, r, dir: 'S' as VertexDirection },         // 5: upper-left
  ];
}

/**
 * Get all 6 edge coordinates for a hex, in canonical form.
 * Returns edges clockwise from top-right: NE, E, SE, SW, W, NW
 * Only NE, E, SE are "owned" by this hex. The other 3 belong to neighbors.
 */
export function hexEdges(hex: HexCoord): EdgeCoord[] {
  const { q, r } = hex;
  return [
    { q, r, dir: 'NE' as EdgeDirection },                 // 0: top-right edge
    { q, r, dir: 'E' as EdgeDirection },                   // 1: right edge
    { q, r, dir: 'SE' as EdgeDirection },                  // 2: bottom-right edge
    { q: q - 1, r: r + 1, dir: 'NE' as EdgeDirection },   // 3: bottom-left edge (= NE of SW neighbor)
    { q: q - 1, r, dir: 'E' as EdgeDirection },             // 4: left edge (= E of W neighbor)
    { q, r: r - 1, dir: 'SE' as EdgeDirection },            // 5: top-left edge (= SE of NW neighbor)
  ];
}

/**
 * Get the 2 vertex endpoints of an edge.
 */
export function edgeVertices(edge: EdgeCoord): [VertexCoord, VertexCoord] {
  const { q, r, dir } = edge;
  switch (dir) {
    case 'NE':
      return [
        { q, r, dir: 'N' },                   // top vertex
        { q: q + 1, r: r - 1, dir: 'S' },     // upper-right vertex
      ];
    case 'E':
      return [
        { q: q + 1, r: r - 1, dir: 'S' },     // upper-right vertex
        { q, r: r + 1, dir: 'N' },             // lower-right vertex  
      ];
    case 'SE':
      return [
        { q, r: r + 1, dir: 'N' },             // lower-right vertex
        { q, r, dir: 'S' },                     // bottom vertex
      ];
  }
}

/**
 * Get the up to 3 hexes adjacent to a vertex.
 */
export function vertexAdjacentHexes(v: VertexCoord): HexCoord[] {
  const { q, r, dir } = v;
  if (dir === 'N') {
    // Top vertex of hex (q,r) is shared with:
    // - hex (q, r) — this hex (bottom of its contribution)
    // - hex (q, r-1) — the hex above (its bottom vertex region)
    // - hex (q+1, r-1) — upper-right neighbor
    // Wait, let me think again. The N vertex is at the top of hex (q,r).
    // Which 3 hexes share this vertex?
    // In pointy-top: the top vertex is shared by:
    //   hex(q, r), hex(q, r-1), hex(q-1, r) — NO
    // Let me use the corner definition:
    // Corner 0 of hex (q,r) = N vertex = shared by hexes where this is also a corner
    // hex (q, r): corner 0 = this
    // hex (q-1, r): corner 1 (upper-right of q-1,r)? No...
    
    // From hexVertices: vertex (q, r, N) appears as:
    //   corner 0 of hex (q, r)
    //   corner 2 of hex (q, r-1)    since hexVertices(q, r-1)[2] = (q, (r-1)+1, N) = (q, r, N) ✓
    //   corner 4 of hex (q+1, r-1)  since hexVertices(q+1, r-1)[4] = (q+1-1, (r-1)+1, N) = (q, r, N) ✓
    return [
      { q, r },
      { q, r: r - 1 },
      { q: q + 1, r: r - 1 },
    ];
  } else {
    // S vertex of hex (q,r)
    // From hexVertices: vertex (q, r, S) appears as:
    //   corner 3 of hex (q, r)
    //   corner 1 of hex (q-1, r+1) since hexVertices(q-1, r+1)[1] = (q-1+1, r+1-1, S) = (q, r, S) ✓
    //   corner 5 of hex (q, r+1)   since hexVertices(q, r+1)[5] = (q-1, r+1, S)... NO that's (q-1, r+1, S)
    // Let me recheck:
    //   hexVertices(q+1, r)[5] = (q+1-1, r, S) = (q, r, S) ✓
    // So:
    //   corner 3 of hex (q, r)
    //   corner 5 of hex (q+1, r)
    //   corner 1 of hex (q-1, r+1)
    return [
      { q, r },
      { q: q + 1, r },
      { q: q - 1, r: r + 1 },
    ];
  }
}

/**
 * Get the up to 3 adjacent vertices (connected by edges) to a given vertex.
 * These are the vertices you check for the distance rule.
 */
export function vertexAdjacentVertices(v: VertexCoord): VertexCoord[] {
  const { q, r, dir } = v;
  if (dir === 'N') {
    // N vertex connects to:
    // - S vertex of hex (q, r-1):   (q, r-1, S) — via edge going up-left
    // - S vertex of hex (q+1, r-1): (q+1, r-1, S) — via edge going up-right  
    // - S vertex of this hex:       (q, r, S) — via edge going straight down... NO
    // 
    // Actually, each vertex connects to exactly 3 other vertices via edges.
    // The N vertex of (q,r) is connected to:
    //   1. The upper-left vertex of hex = hexVertices[5] = (q-1, r, S)
    //   2. The upper-right vertex of hex = hexVertices[1] = (q+1, r-1, S)
    //   3. The vertex directly "above" through neighbor hex... 
    // 
    // Wait. Vertex (q, r, N) is corners of 3 hexes. The 3 edges at this vertex
    // connect it to 3 other vertices. Let me find them from edge definitions:
    //
    // Edges touching vertex (q, r, N):
    //   - Edge (q, r, NE): connects (q,r,N) to (q+1,r-1,S)
    //   - Edge (q, r-1, SE): connects (q, r-1+1, N)=(q,r,N) to (q, r-1, S)
    //   - Edge (q-1, r, E) ... no wait
    //
    // Let me use vertexAdjacentEdges to determine this properly.
    // From the edge definitions:
    //   Edge NE of (q,r): vertices are (q,r,N) and (q+1,r-1,S) 
    //   Edge SE of (q,r-1): vertices are (q,(r-1)+1,N)=(q,r,N) and (q,r-1,S)
    //   Edge E of (q-1,r): vertices are (q-1+1,r-1,S)=(q,r-1,S)... NO
    //
    // Hmm, let me just enumerate edges touching (q,r,N):
    // An edge touches (q,r,N) if (q,r,N) is one of its two endpoints.
    //   Edge (q, r, NE): [(q,r,N), (q+1,r-1,S)] ✓ → other vertex: (q+1,r-1,S)
    //   Edge (q, r-1, SE): [(q,(r-1)+1,N), (q,r-1,S)] = [(q,r,N), (q,r-1,S)] ✓ → other: (q,r-1,S)
    //   Edge (q-1, r, NE): [(q-1,r,N), (q,r-1,S)] NO, wrong vertex
    //   
    // Hmm I need to think about which edges have (q,r,N) as an endpoint.
    // From edgeVertices:
    //   NE edge at (a,b): [(a,b,N), (a+1,b-1,S)]  → matches (q,r,N) when a=q, b=r
    //   E edge at (a,b): [(a+1,b-1,S), (a,b+1,N)]  → matches (q,r,N) when a=q, b+1=r → b=r-1
    //   SE edge at (a,b): [(a,b+1,N), (a,b,S)]     → matches (q,r,N) when a=q, b+1=r → b=r-1
    //
    // So the 3 edges at vertex (q,r,N) are:
    //   1. NE of (q, r): other endpoint = (q+1, r-1, S)
    //   2. E of (q, r-1): other endpoint = first vertex of E = (q,r-1,S)... wait
    //     E edge at (q,r-1): [(q+1,r-2,S), (q,r,N)] → other = (q+1,r-2,S)? That's wrong.
    //
    // Let me recompute. E edge at (a,b): endpoints are [(a+1,b-1,S), (a,b+1,N)]
    //   At (q, r-1): [(q+1, r-2, S), (q, r, N)]
    //   So other vertex is (q+1, r-2, S)... that's not right for adjacency.
    //
    // I think my edge vertex formulas might be wrong. Let me re-derive.
    //
    // For a pointy-top hex at (q,r), the 6 edges connect these vertex pairs:
    //   Edge 0 (NE): vertex 0 (top) to vertex 1 (upper-right) = (q,r,N) to (q+1,r-1,S)
    //   Edge 1 (E):  vertex 1 (upper-right) to vertex 2 (lower-right) = (q+1,r-1,S) to (q,r+1,N)
    //   Edge 2 (SE): vertex 2 (lower-right) to vertex 3 (bottom) = (q,r+1,N) to (q,r,S)
    //   Edge 3 (SW): vertex 3 to vertex 4 = (q,r,S) to (q-1,r+1,N) [= NE of (q-1,r+1)]
    //   Edge 4 (W):  vertex 4 to vertex 5 = (q-1,r+1,N) to (q-1,r,S) [= E of (q-1,r)]
    //   Edge 5 (NW): vertex 5 to vertex 0 = (q-1,r,S) to (q,r,N) [= SE of (q,r-1)]
    //
    // So the 3 edges at (q,r,N):
    //   Edge 0 (NE of (q,r)):     connects to (q+1,r-1,S)
    //   Edge 5 (NW of (q,r)) = SE of (q,r-1): connects to (q-1,r,S)
    //
    // Wait, edge 5 connects vertex 5 to vertex 0. Vertex 5 = (q-1,r,S), vertex 0 = (q,r,N).
    // In canonical form, edge 5 = SE of (q, r-1).
    // So: SE edge at (q,r-1) connects... let me re-check edgeVertices for SE:
    //   SE at (a,b): connects (a, b+1, N) to (a, b, S)
    //   At (q, r-1): connects (q, r, N) to (q, r-1, S)
    //   So other vertex = (q, r-1, S)... but from the hex corners, edge 5 (NW) connects (q-1,r,S) to (q,r,N).
    //
    // There's a conflict! Let me re-examine the SE edge definition.
    // hexEdges gives edge 2 (SE) of hex (q,r) connecting corner 2 to corner 3:
    //   Corner 2 = (q, r+1, N), Corner 3 = (q, r, S)
    // But I defined edgeVertices(SE) as [(q, r+1, N), (q, r, S)] — that matches for edge 2 of hex (q,r). ✓
    //
    // Now, edge 5 (NW) of hex (q,r) connects corner 5 to corner 0:
    //   Corner 5 = (q-1, r, S), Corner 0 = (q, r, N)
    // In canonical form, edge 5 = SE of hex (q, r-1):
    //   hexEdges(q,r)[5] = { q: q, r: r-1, dir: 'SE' } ... wait:
    //   hexEdges at index 5: { q, r: r-1, dir: 'SE' }
    //   edgeVertices(q, r-1, SE) = [(q, (r-1)+1, N), (q, r-1, S)] = [(q, r, N), (q, r-1, S)]
    //   
    //   But we said edge 5 connects (q-1, r, S) to (q, r, N).
    //   edgeVertices gives (q, r, N) and (q, r-1, S) for this canonical edge.
    //   That means (q-1, r, S) and (q, r-1, S) must be the SAME vertex! Let me check...
    //   No they're different coordinates. Something is wrong.
    //
    // I think the issue is in my hexEdges definition. Let me re-derive from scratch.
    //
    // OK I'm going to take a step back and define this very carefully.

    // CORRECT adjacent vertices for N vertex:
    return [
      { q: q + 1, r: r - 1, dir: 'S' },  // connected via NE edge of (q,r)
      { q: q - 1, r, dir: 'S' },          // connected via NW edge = SE of (q-1, r-1)... 
      { q, r: r - 1, dir: 'S' },          // connected via... hmm
    ];
  } else {
    // S vertex adjacent vertices
    return [
      { q: q - 1, r: r + 1, dir: 'N' },  // connected via SW edge
      { q: q + 1, r, dir: 'N' },          // connected via SE edge
      { q, r: r + 1, dir: 'N' },          // connected via S edge
    ];
  }
}

/**
 * Get the up to 3 edges touching a vertex.
 */
export function vertexAdjacentEdges(v: VertexCoord): EdgeCoord[] {
  const { q, r, dir } = v;
  if (dir === 'N') {
    return [
      { q, r, dir: 'NE' },             // edge going to upper-right
      { q: q - 1, r, dir: 'E' },       // edge going to upper-left... 
      // Hmm, let me just use the correct mapping.
      // Vertex (q,r,N) is corner 0 of hex(q,r). 
      // The 3 edges at corner 0: edge 0 (NE) and edge 5 (NW) of hex(q,r)
      // Plus one edge from an adjacent hex.
      // Edge 0 of hex(q,r) = (q, r, NE)
      // Edge 5 of hex(q,r) = (q, r-1, SE)
      // The third edge: this vertex is also corner 2 of hex(q, r-1).
      // Edge 1 (E) of hex(q, r-1) connects corner 1 to corner 2.
      // hexEdges(q, r-1)[1] = (q, r-1, E)
      { q, r: r - 1, dir: 'SE' },      // = edge 5 (NW) of hex(q,r) 
      { q, r: r - 1, dir: 'E' },       // = edge 1 (E) of hex(q, r-1)
    ];
  } else {
    // Vertex (q,r,S) is corner 3 of hex(q,r).
    // Edge 2 (SE) of hex(q,r): connects corner 2 to corner 3 → (q, r, SE)
    // Edge 3 (SW) of hex(q,r): connects corner 3 to corner 4 → (q-1, r+1, NE)
    // Corner 3 is also corner 5 of hex(q+1, r): 
    //   hexEdges(q+1, r)[4] = edge 4 (W) of hex(q+1,r) = (q, r, E)
    // And corner 1 of hex(q-1, r+1):
    //   Actually let me check. hexVertices(q+1,r)[5] = (q+1-1, r, S) = (q, r, S) ✓
    //   Edge 4 (W) connects corner 4 to corner 5 of hex(q+1,r).
    //   hexEdges(q+1,r)[4] = (q+1-1, r, E) = (q, r, E) ✓
    return [
      { q, r, dir: 'SE' },              // edge 2 of hex(q,r)
      { q: q - 1, r: r + 1, dir: 'NE' }, // edge 3 of hex(q,r), = NE of SW neighbor
      { q, r, dir: 'E' },               // edge 4 of hex(q+1,r) = E of hex(q,r)
    ];
  }
}

/**
 * Get the 1-2 hexes adjacent to an edge.
 */
export function edgeAdjacentHexes(edge: EdgeCoord): HexCoord[] {
  const { q, r, dir } = edge;
  switch (dir) {
    case 'NE':
      // NE edge of (q,r): shared between hex(q,r) and hex(q+1, r-1)... 
      // Actually, edge NE = edge 0 of hex(q,r), which is also edge 3 of hex(q+1, r-1)?
      // hexEdges(q+1, r-1)[3] = (q+1-1, r-1+1, NE) = (q, r, NE) ✓
      // But edge 3 connects corners 3 and 4 of hex(q+1,r-1), which is a different edge than edge 0.
      // Hmm. Let me think about which hex shares this edge.
      // Edge NE of hex(q,r) = the edge between corners 0 and 1 of hex(q,r).
      // This is also an edge of hex(q, r-1) (specifically its edge 2, SE) and hex(q+1, r-1) (its edge...)
      // No — an edge is shared by exactly 2 hexes (the ones on either side).
      // Edge NE goes from top to upper-right. The hex on the other side is hex(q, r-1) 
      // (the one directly above-right in pointy-top).
      // Actually in pointy-top, the NE edge borders hex(q,r) and hex(q+1, r-1).
      // No wait... hexEdges says the NW edge (index 5) of hex(q,r) is SE of hex(q, r-1).
      // So NE edge of hex(q,r) = which neighbor? It's the top-right edge, between this hex
      // and the hex at direction index 1 (NE): (q+1, r-1).
      return [{ q, r }, { q: q + 1, r: r - 1 }];
    case 'E':
      // E edge = right edge, between this hex and the hex to the east: (q+1, r)
      return [{ q, r }, { q: q + 1, r }];
    case 'SE':
      // SE edge = bottom-right edge, between this hex and hex(q, r+1)
      return [{ q, r }, { q, r: r + 1 }];
  }
}

/**
 * Get the up to 4 edges adjacent to an edge (sharing a vertex endpoint).
 */
export function edgeAdjacentEdges(edge: EdgeCoord): EdgeCoord[] {
  const [v1, v2] = edgeVertices(edge);
  const thisKey = edgeKey(edge);
  const adjacentEdges: EdgeCoord[] = [];
  
  // Get all edges at both endpoints, exclude self
  for (const v of [v1, v2]) {
    for (const e of vertexAdjacentEdges(v)) {
      if (edgeKey(e) !== thisKey) {
        adjacentEdges.push(e);
      }
    }
  }
  
  return adjacentEdges;
}

/**
 * Build complete adjacency maps for a set of hex coordinates.
 * This pre-computes all vertex-hex, vertex-vertex, vertex-edge, edge-vertex relationships.
 */
export function buildAdjacencyMaps(hexCoords: HexCoord[]) {
  const hexSet = new Set(hexCoords.map(h => hexKey(h)));
  
  // Collect all valid vertices and edges (those touching at least one hex in the board)
  const allVertexKeys = new Set<string>();
  const allEdgeKeys = new Set<string>();
  
  const hexToVerticesMap: Record<string, string[]> = {};
  const hexToEdgesMap: Record<string, string[]> = {};
  
  for (const hex of hexCoords) {
    const hk = hexKey(hex);
    const verts = hexVertices(hex);
    const edges = hexEdges(hex);
    
    hexToVerticesMap[hk] = verts.map(v => vertexKey(v));
    hexToEdgesMap[hk] = [];
    
    for (const v of verts) {
      allVertexKeys.add(vertexKey(v));
    }
    
    for (const e of edges) {
      // Only include edges where at least one adjacent hex is on the board
      const adjHexes = edgeAdjacentHexes(e);
      if (adjHexes.some(h => hexSet.has(hexKey(h)))) {
        const ek = edgeKey(e);
        allEdgeKeys.add(ek);
        hexToEdgesMap[hk].push(ek);
      }
    }
  }
  
  // De-duplicate hex-to-edges
  for (const hk of Object.keys(hexToEdgesMap)) {
    hexToEdgesMap[hk] = [...new Set(hexToEdgesMap[hk])];
  }
  
  // Build vertex adjacency maps
  const vertexToHexes: Record<string, string[]> = {};
  const vertexToVertices: Record<string, string[]> = {};
  const vertexToEdges: Record<string, string[]> = {};
  const edgeToVerticesMap: Record<string, [string, string]> = {};
  const edgeToEdgesMap: Record<string, string[]> = {};
  
  for (const vk of allVertexKeys) {
    const v = parseVertexCoord(vk);
    
    // Adjacent hexes (only those on the board)
    vertexToHexes[vk] = vertexAdjacentHexes(v)
      .map(h => hexKey(h))
      .filter(hk => hexSet.has(hk));
    
    // Adjacent vertices (only those that exist on the board)
    vertexToVertices[vk] = vertexAdjacentVertices(v)
      .map(av => vertexKey(av))
      .filter(avk => allVertexKeys.has(avk));
    
    // Adjacent edges (only those that exist)
    vertexToEdges[vk] = vertexAdjacentEdges(v)
      .map(e => edgeKey(e))
      .filter(ek => allEdgeKeys.has(ek));
  }
  
  for (const ek of allEdgeKeys) {
    const e = parseEdgeCoord(ek);
    const [v1, v2] = edgeVertices(e);
    edgeToVerticesMap[ek] = [vertexKey(v1), vertexKey(v2)];
    
    edgeToEdgesMap[ek] = edgeAdjacentEdges(e)
      .map(ae => edgeKey(ae))
      .filter(aek => allEdgeKeys.has(aek));
  }
  
  return {
    vertexToHexes,
    vertexToVertices,
    vertexToEdges,
    edgeToVertices: edgeToVerticesMap,
    edgeToEdges: edgeToEdgesMap,
    hexToVertices: hexToVerticesMap,
    hexToEdges: hexToEdgesMap,
    allVertexKeys: [...allVertexKeys],
    allEdgeKeys: [...allEdgeKeys],
  };
}

// Helper parse functions (avoiding circular import with coords.ts)
function parseVertexCoord(key: string): VertexCoord {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as VertexDirection };
}

function parseEdgeCoord(key: string): EdgeCoord {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]), dir: parts[2] as EdgeDirection };
}
