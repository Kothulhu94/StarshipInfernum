/**
 * corridorTilePainter.ts
 *
 * Procedurally draws corridors on the tile grid.
 * Renders continuous, wall-bounded visual pathways.
 */

import Phaser from 'phaser';
import { Corridor, RoomNode } from '../mapGenerator/mapLayoutTypes';
import { TILE_SIZE, COLOR_VOID_BLACK, COLOR_BULKHEAD_STEEL } from './mapRenderTypes';

/**
 * Procedurally paints all corridor tiles.
 * Draws floor tiles and borders on edges that do not connect to other rooms/corridors.
 */
export function paintCorridor(
  graphics: Phaser.GameObjects.Graphics,
  corridor: Corridor,
  allRooms: RoomNode[],
  allCorridors: Corridor[]
): void {
  const z = corridor.tiles[0]?.z ?? 0;
  
  // Set of occupied tiles (rooms and other corridors) on this deck
  const occupiedSet = new Set<string>();

  // Add all room tiles to the occupied set
  for (const room of allRooms) {
    if (room.z !== z) continue;
    for (let ry = 0; ry < room.height; ry++) {
      for (let rx = 0; rx < room.width; rx++) {
        occupiedSet.add(`${room.x + rx},${room.y + ry}`);
      }
    }
  }

  // Add all other corridor tiles to the occupied set
  for (const otherCorr of allCorridors) {
    const oZ = otherCorr.tiles[0]?.z ?? 0;
    if (oZ !== z) continue;
    for (const t of otherCorr.tiles) {
      occupiedSet.add(`${t.x},${t.y}`);
    }
  }

  // Draw floors and borders
  for (const tile of corridor.tiles) {
    const px = tile.x * TILE_SIZE;
    const py = tile.y * TILE_SIZE;

    // Paint corridor floor
    graphics.fillStyle(COLOR_VOID_BLACK, 1.0);
    graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Draw borders (walls) only where there are no adjacent rooms/corridors
    graphics.lineStyle(1.5, COLOR_BULKHEAD_STEEL, 1.0);

    const neighbors = [
      { dx: 0, dy: -1, startX: px, startY: py, endX: px + TILE_SIZE, endY: py }, // North edge
      { dx: 0, dy: 1, startX: px, startY: py + TILE_SIZE, endX: px + TILE_SIZE, endY: py + TILE_SIZE }, // South edge
      { dx: 1, dy: 0, startX: px + TILE_SIZE, startY: py, endX: px + TILE_SIZE, endY: py + TILE_SIZE }, // East edge
      { dx: -1, dy: 0, startX: px, startY: py, endX: px, endY: py + TILE_SIZE }, // West edge
    ];

    for (const edge of neighbors) {
      const nx = tile.x + edge.dx;
      const ny = tile.y + edge.dy;
      const neighborKey = `${nx},${ny}`;

      if (!occupiedSet.has(neighborKey)) {
        // Draw the wall border line
        graphics.beginPath();
        graphics.moveTo(edge.startX, edge.startY);
        graphics.lineTo(edge.endX, edge.endY);
        graphics.strokePath();
      }
    }
  }
}
