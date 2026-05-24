/**
 * roomIconOverlays.ts
 *
 * Procedurally draws icons and overlays representing hazards, weapons,
 * medkits, and other feature indicators on top of rooms.
 */

import Phaser from 'phaser';
import { RoomNode } from '../mapGenerator/mapLayoutTypes';
import { getTemplateForRoom } from '../mapGenerator/roomTemplateLibrary';
import {
  TILE_SIZE,
  COLOR_ALERT_AMBER,
  COLOR_DAMAGE_RED,
  COLOR_SUCCESS_GREEN,
  COLOR_VOID_BLACK,
  COLOR_CONSOLE_CYAN,
} from './mapRenderTypes';

/**
 * Draws overlays and icons on top of rooms
 */
export function paintRoomIconOverlays(
  graphics: Phaser.GameObjects.Graphics,
  rooms: RoomNode[],
  activeObstacleRoomIds: Set<string>
): void {
  for (const room of rooms) {
    // 1. Draw dynamic item icons based on feature markers
    const template = getTemplateForRoom(room.roomType, room.features);
    for (const marker of template.featureMarkers) {
      const wx = room.x + marker.x;
      const wy = room.y + marker.y;
      const px = wx * TILE_SIZE;
      const py = wy * TILE_SIZE;

      // Draw item marker graphics
      if (marker.type === 'medkit') {
        // Green Cross
        graphics.fillStyle(COLOR_SUCCESS_GREEN, 1.0);
        graphics.fillRect(px + 12, py + 6, 8, 20);
        graphics.fillRect(px + 6, py + 12, 20, 8);
      } else if (marker.type === 'weapons') {
        // Red sword/dagger shape
        graphics.fillStyle(COLOR_DAMAGE_RED, 1.0);
        // Blade
        graphics.fillRect(px + 14, py + 6, 4, 16);
        // Guard
        graphics.fillRect(px + 10, py + 18, 12, 3);
        // Grip
        graphics.fillRect(px + 14, py + 21, 4, 5);
      } else if (marker.type === 'explosives') {
        // Amber dynamite stick
        graphics.fillStyle(COLOR_ALERT_AMBER, 1.0);
        graphics.fillRect(px + 11, py + 8, 10, 16);
        // Fuse
        graphics.lineStyle(1.5, COLOR_CONSOLE_CYAN, 1.0);
        graphics.lineBetween(px + 16, py + 8, px + 21, py + 4);
      }
    }

    // 2. Draw active hazard alert icon in the center of the room if it has a blocking obstacle
    if (activeObstacleRoomIds.has(room.id)) {
      const centerX = room.x * TILE_SIZE + (room.width * TILE_SIZE) / 2;
      const centerY = room.y * TILE_SIZE + (room.height * TILE_SIZE) / 2;

      // Draw glowing alert triangle
      graphics.fillStyle(COLOR_ALERT_AMBER, 1.0);
      graphics.beginPath();
      graphics.moveTo(centerX, centerY - 14);
      graphics.lineTo(centerX - 14, centerY + 10);
      graphics.lineTo(centerX + 14, centerY + 10);
      graphics.closePath();
      graphics.fill();

      // Exclamation point in triangle
      graphics.fillStyle(COLOR_VOID_BLACK, 1.0);
      graphics.fillRect(centerX - 2, centerY - 6, 4, 8);
      graphics.fillRect(centerX - 2, centerY + 4, 4, 4);
    }
  }
}
