// ============================================================
// Longest Road Algorithm
// ============================================================

import { GameState } from '@catan/shared/types/game.js';
import { MIN_LONGEST_ROAD } from '@catan/shared/constants/costs.js';
import { calculateVictoryPoints } from './game-state.js';

export function calculateLongestRoad(state: GameState, playerId: string): number {
  // 1. Find all edges belonging to the player
  const playerEdges = Object.keys(state.board.edges).filter(
    k => state.board.edges[k].road?.playerId === playerId
  );
  
  if (playerEdges.length === 0) return 0;

  // 2. Build adjacency list of player's edges
  // Two player edges are adjacent if they share a vertex, AND that vertex is NOT occupied by an opponent building/knight
  const adjList: Record<string, string[]> = {};
  for (const edge of playerEdges) {
    adjList[edge] = [];
  }

  for (let i = 0; i < playerEdges.length; i++) {
    for (let j = i + 1; j < playerEdges.length; j++) {
      const e1 = playerEdges[i];
      const e2 = playerEdges[j];
      
      const v1 = state.board.edgeToVertices[e1];
      const v2 = state.board.edgeToVertices[e2];
      
      // Find shared vertex
      const sharedVertex = v1.find((v: any) => v2.includes(v));
      if (sharedVertex) {
        // Check if shared vertex breaks the road
        const vertex = state.board.vertices[sharedVertex];
        let broken = false;
        
        if (vertex.building && vertex.building.playerId !== playerId) {
          broken = true;
        } else if (state.citiesAndKnights && vertex.knight && vertex.knight.playerId !== playerId) {
          broken = true;
        }

        if (!broken) {
          adjList[e1].push(e2);
          adjList[e2].push(e1);
        }
      }
    }
  }

  // 3. DFS to find longest path
  let maxLength = 0;
  
  // Backtracking DFS
  function dfs(currentEdge: string, visited: Set<string>, currentLength: number) {
    if (currentLength > maxLength) {
      maxLength = currentLength;
    }
    
    for (const neighbor of adjList[currentEdge]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs(neighbor, visited, currentLength + 1);
        visited.delete(neighbor);
      }
    }
  }

  for (const startEdge of playerEdges) {
    dfs(startEdge, new Set([startEdge]), 1);
  }

  return maxLength;
}

export function updateLongestRoad(state: GameState): GameState {
  let newState = { ...state };
  
  let currentHolder = newState.longestRoadPlayerId;
  let currentHolderLength = currentHolder ? calculateLongestRoad(newState, currentHolder) : 0;
  
  let newHolder = currentHolder;
  let newLength = currentHolderLength;
  
  // Recalculate for everyone
  for (const player of newState.players) {
    const length = calculateLongestRoad(newState, player.id);
    
    // Update player's cached length
    newState.players = newState.players.map((p: any) => 
      p.id === player.id ? { ...p, longestRoadLength: length } : p
    );

    if (length >= MIN_LONGEST_ROAD) {
      if (length > newLength) {
        newHolder = player.id;
        newLength = length;
      }
    }
  }
  
  // If the current holder's road was broken and someone else has a valid road
  if (currentHolder && currentHolderLength < MIN_LONGEST_ROAD && newHolder === currentHolder) {
    // Find the NEXT best player who meets the minimum
    let max = 0;
    let maxId = null;
    let tie = false;
    
    for (const player of newState.players) {
      const length = calculateLongestRoad(newState, player.id);
      if (length >= MIN_LONGEST_ROAD) {
        if (length > max) {
          max = length;
          maxId = player.id;
          tie = false;
        } else if (length === max) {
          tie = true;
        }
      }
    }
    
    if (maxId && !tie) {
      newHolder = maxId;
      newLength = max;
    } else {
      newHolder = null;
      newLength = 0;
    }
  }

  newState.longestRoadPlayerId = newHolder;
  newState.longestRoadLength = newHolder ? newLength : 0;

  // Recalculate VPs since longest road may have changed
  newState.players = newState.players.map((p: any) => ({
    ...p,
    victoryPoints: calculateVictoryPoints(newState, p.id)
  }));

  return newState;
}
