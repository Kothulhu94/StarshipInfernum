/**
 * corridorPlanner.ts
 *
 * Implements A* pathfinding on a 2D integer coordinate grid to route corridors
 * between room doors while avoiding room colliders.
 */

import { RoomNode, DoorDirection } from './mapLayoutTypes';

interface PathNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic cost to end
  parent: PathNode | null;
}

/**
 * Returns the Manhattan distance between two points
 */
function getManhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Checks if a tile is occupied by any room (excluding the start and end door coordinates themselves)
 */
function isTileOccupiedByRooms(
  x: number,
  y: number,
  z: number,
  rooms: RoomNode[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  for (const room of rooms) {
    if (room.z !== z) continue;
    
    // Check if within room boundary
    if (
      x >= room.x &&
      x < room.x + room.width &&
      y >= room.y &&
      y < room.y + room.height
    ) {
      // Exclude starting and ending doors from being blocked
      if ((x === startX && y === startY) || (x === endX && y === endY)) {
        continue;
      }
      return true;
    }
  }
  return false;
}

/**
 * Pathfinds a corridor route from a starting door to an ending door.
 * Returns a list of coordinates or null if no path could be found.
 */
export function planCorridor(
  rooms: RoomNode[],
  z: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number; z: number }[] | null {
  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: getManhattanDistance(startX, startY, endX, endY),
    parent: null,
  };

  openSet.push(startNode);

  // Define bounding box limits to keep pathfinding search bounded
  const minX = Math.min(startX, endX) - 15;
  const maxX = Math.max(startX, endX) + 15;
  const minY = Math.min(startY, endY) - 15;
  const maxY = Math.max(startY, endY) + 15;

  let iterations = 0;
  const maxIterations = 2000;

  while (openSet.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      break; // Safeguard against excessive calculation
    }

    // Sort openSet by f-score (g + h)
    openSet.sort((a, b) => a.g + a.h - (b.g + b.h));
    const currentNode = openSet.shift()!;

    // Check if reached destination
    if (currentNode.x === endX && currentNode.y === endY) {
      const path: { x: number; y: number; z: number }[] = [];
      let temp: PathNode | null = currentNode;
      while (temp !== null) {
        path.push({ x: temp.x, y: temp.y, z });
        temp = temp.parent;
      }
      return path.reverse(); // Start to End
    }

    const currentKey = `${currentNode.x},${currentNode.y}`;
    closedSet.add(currentKey);

    // 4-directional search
    const directions = [
      { dx: 0, dy: -1 }, // N
      { dx: 0, dy: 1 },  // S
      { dx: 1, dy: 0 },  // E
      { dx: -1, dy: 0 }, // W
    ];

    for (const dir of directions) {
      const nextX = currentNode.x + dir.dx;
      const nextY = currentNode.y + dir.dy;

      // Keep within search bounds
      if (nextX < minX || nextX > maxX || nextY < minY || nextY > maxY) {
        continue;
      }

      const nextKey = `${nextX},${nextY}`;
      if (closedSet.has(nextKey)) {
        continue;
      }

      // Check collision
      if (isTileOccupiedByRooms(nextX, nextY, z, rooms, startX, startY, endX, endY)) {
        continue;
      }

      const gScore = currentNode.g + 1;
      const hScore = getManhattanDistance(nextX, nextY, endX, endY);

      // Check if already in open set with better g-score
      const existing = openSet.find((node) => node.x === nextX && node.y === nextY);
      if (existing) {
        if (gScore < existing.g) {
          existing.g = gScore;
          existing.parent = currentNode;
        }
      } else {
        openSet.push({
          x: nextX,
          y: nextY,
          g: gScore,
          h: hScore,
          parent: currentNode,
        });
      }
    }
  }

  // Failed to find a path
  return null;
}
