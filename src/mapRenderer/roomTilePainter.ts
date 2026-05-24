/**
 * roomTilePainter.ts
 *
 * Procedurally paints room interiors (floors, walls, consoles, beds, crates, etc.)
 * based on the RoomNode template layouts.
 */

import Phaser from 'phaser';
import { RoomNode, TileType } from '../mapGenerator/mapLayoutTypes';
import { getTemplateForRoom } from '../mapGenerator/roomTemplateLibrary';
import {
  TILE_SIZE,
  COLOR_VOID_BLACK,
  COLOR_HULL_GUNMETAL,
  COLOR_BULKHEAD_STEEL,
  COLOR_CONSOLE_CYAN,
  COLOR_ALERT_AMBER,
  COLOR_HOLOGRAM_BLUE,
  COLOR_GHOST_VIOLET,
  COLOR_SUCCESS_GREEN,
  COLOR_DAMAGE_RED,
} from './mapRenderTypes';

/**
 * Procedurally paints a single RoomNode onto the graphics object.
 */
export function paintRoom(
  graphics: Phaser.GameObjects.Graphics,
  room: RoomNode,
  activeRoomId = ''
): void {
  // Regenerate template structure to obtain interior tile layouts
  const template = getTemplateForRoom(room.roomType, room.features);

  for (let ty = 0; ty < room.height; ty++) {
    for (let tx = 0; tx < room.width; tx++) {
      const tileType: TileType = template.interiorLayout[ty][tx];
      const wx = room.x + tx;
      const wy = room.y + ty;
      const px = wx * TILE_SIZE;
      const py = wy * TILE_SIZE;

      // 1. Draw floor/wall base
      if (tileType === 'WALL') {
        graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
        graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        graphics.lineStyle(1.5, COLOR_BULKHEAD_STEEL, 1.0);
        graphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        continue;
      }

      // Draw standard floor for all non-wall tiles first
      graphics.fillStyle(COLOR_VOID_BLACK, 1.0);
      graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Subtle floor grid pattern
      graphics.lineStyle(0.5, COLOR_HULL_GUNMETAL, 0.3);
      graphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

      // 2. Draw decorations
      switch (tileType) {
        case 'CONSOLE':
          // Cyan console desk
          graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
          graphics.fillRect(px + 4, py + 8, TILE_SIZE - 8, TILE_SIZE - 12);
          graphics.lineStyle(1, COLOR_BULKHEAD_STEEL, 1.0);
          graphics.strokeRect(px + 4, py + 8, TILE_SIZE - 8, TILE_SIZE - 12);
          
          // Glowing screen
          graphics.fillStyle(COLOR_CONSOLE_CYAN, 0.95);
          graphics.fillRect(px + 8, py + 12, TILE_SIZE - 16, 4);
          break;

        case 'SCREEN':
          // Glowing monitor panel
          graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
          graphics.fillRect(px + 6, py + 4, TILE_SIZE - 12, TILE_SIZE - 8);
          graphics.lineStyle(1, COLOR_BULKHEAD_STEEL, 1.0);
          graphics.strokeRect(px + 6, py + 4, TILE_SIZE - 12, TILE_SIZE - 8);
          
          // Green glowing charts
          graphics.fillStyle(COLOR_SUCCESS_GREEN, 0.9);
          graphics.fillRect(px + 9, py + 8, TILE_SIZE - 18, 5);
          graphics.fillStyle(COLOR_CONSOLE_CYAN, 0.9);
          graphics.fillRect(px + 9, py + 16, TILE_SIZE - 18, 5);
          break;

        case 'BED':
          // Crew bunk bed
          graphics.fillStyle(COLOR_BULKHEAD_STEEL, 1.0);
          graphics.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 4);
          // Sheet/Blanket
          graphics.fillStyle(COLOR_HOLOGRAM_BLUE, 0.7);
          graphics.fillRect(px + 4, py + 8, TILE_SIZE - 8, TILE_SIZE - 10);
          // Pillow
          graphics.fillStyle(COLOR_VOID_BLACK, 0.8);
          graphics.fillRect(px + 6, py + 3, TILE_SIZE - 12, 4);
          break;

        case 'CRATE':
          // Cargo boxes
          graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
          graphics.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
          graphics.lineStyle(1.5, COLOR_ALERT_AMBER, 0.8);
          graphics.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
          // Cargo details (cross lines)
          graphics.lineBetween(px + 6, py + 6, px + TILE_SIZE - 6, py + TILE_SIZE - 6);
          graphics.lineBetween(px + TILE_SIZE - 6, py + 6, px + 6, py + TILE_SIZE - 6);
          break;

        case 'POD':
          // Cryopod capsule
          graphics.fillStyle(COLOR_BULKHEAD_STEEL, 1.0);
          graphics.fillRect(px + 6, py + 2, TILE_SIZE - 12, TILE_SIZE - 4);
          // Glass front with violet glow
          graphics.fillStyle(COLOR_GHOST_VIOLET, 0.5);
          graphics.fillRect(px + 9, py + 6, TILE_SIZE - 18, TILE_SIZE - 12);
          graphics.lineStyle(1, COLOR_GHOST_VIOLET, 0.9);
          graphics.strokeRect(px + 9, py + 6, TILE_SIZE - 18, TILE_SIZE - 12);
          break;

        case 'VENTS':
          // Air circulation grates
          graphics.lineStyle(1, COLOR_BULKHEAD_STEEL, 1.0);
          graphics.strokeCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 4);
          // Metal slits
          for (let i = -4; i <= 4; i += 2) {
            graphics.lineBetween(
              px + TILE_SIZE / 2 + i,
              py + 6,
              px + TILE_SIZE / 2 + i,
              py + TILE_SIZE - 6
            );
          }
          break;

        case 'HAZARD':
          // Hydroponics fluid / glowing pipes
          graphics.fillStyle(COLOR_SUCCESS_GREEN, 0.4); // Bio-luminescent green fluid
          graphics.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          graphics.lineStyle(1, COLOR_BULKHEAD_STEEL, 0.8);
          graphics.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          break;

        case 'HATCH':
          // Circular hatch wheel
          graphics.lineStyle(2, COLOR_BULKHEAD_STEEL, 1.0);
          graphics.strokeCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 6);
          graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
          graphics.fillCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 8);
          graphics.lineStyle(1.5, COLOR_ALERT_AMBER, 1.0);
          graphics.strokeCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 4);
          break;

        case 'DOOR':
          const localDoor = room.doors.find(
            (d) => d.x === wx && d.y === wy
          );

          if (!localDoor) break;

          if (!localDoor.connectedDoorId && room.id !== activeRoomId) {
            graphics.fillStyle(COLOR_HULL_GUNMETAL, 1.0);
            graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(1.5, COLOR_BULKHEAD_STEEL, 1.0);
            graphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            break;
          }

          graphics.lineStyle(3, COLOR_HOLOGRAM_BLUE, 0.9);
          if (localDoor.direction === 'N' || localDoor.direction === 'S') {
            graphics.lineBetween(px, py + TILE_SIZE / 2, px + TILE_SIZE, py + TILE_SIZE / 2);
          } else {
            graphics.lineBetween(px + TILE_SIZE / 2, py, px + TILE_SIZE / 2, py + TILE_SIZE);
          }
          break;

        default:
          break;
      }
    }
  }
}
