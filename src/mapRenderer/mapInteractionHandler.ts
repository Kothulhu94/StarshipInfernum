/**
 * mapInteractionHandler.ts
 *
 * Implements mouse hover/click hit zones on rooms and unconnected doors.
 * Fires callbacks to link visual clicks to game action sequences.
 */

import Phaser from 'phaser';
import { RoomNode, DoorDirection } from '../mapGenerator/mapLayoutTypes';
import { TILE_SIZE, COLOR_HOLOGRAM_BLUE, COLOR_ALERT_AMBER } from './mapRenderTypes';

export class MapInteractionHandler {
  private zones: Phaser.GameObjects.Zone[] = [];
  private interactiveDoors: Phaser.GameObjects.Arc[] = [];

  /**
   * Destroys existing interaction game objects
   */
  public clear(): void {
    this.zones.forEach((z) => z.destroy());
    this.interactiveDoors.forEach((d) => d.destroy());
    this.zones = [];
    this.interactiveDoors = [];
  }

  /**
   * Attaches interactive click zones to rooms and current room's door slots
   */
  public setupInteractions(
    scene: Phaser.Scene,
    rooms: RoomNode[],
    activeRoomId: string,
    deckContainer: Phaser.GameObjects.Container,
    onRoomClick: (roomId: string) => void,
    onDoorClick: (roomId: string, direction: DoorDirection) => void,
    onRoomHover: (room: RoomNode | null) => void
  ): void {
    this.clear();

    for (const room of rooms) {
      if (!room.isDiscovered) continue;

      const px = room.x * TILE_SIZE;
      const py = room.y * TILE_SIZE;
      const w = room.width * TILE_SIZE;
      const h = room.height * TILE_SIZE;

      // 1. Create a mouse hit zone for the room body
      const zone = scene.add.zone(px + w / 2, py + h / 2, w, h);
      zone.setOrigin(0.5);
      zone.setInteractive({ useHandCursor: true });
      deckContainer.add(zone);
      this.zones.push(zone);

      // Listen to click and hover actions
      zone.on('pointerdown', () => {
        onRoomClick(room.id);
      });

      zone.on('pointerover', () => {
        onRoomHover(room);
      });

      zone.on('pointerout', () => {
        onRoomHover(null);
      });

      // 2. If it is the active room, make unconnected doors interactive for exploration
      if (room.id === activeRoomId) {
        for (const door of room.doors) {
          if (!door.connectedDoorId) {
            // Unconnected door - render clickable exploration helper
            const dpx = door.x * TILE_SIZE + TILE_SIZE / 2;
            const dpy = door.y * TILE_SIZE + TILE_SIZE / 2;

            // Clicking this small circle triggers discovery
            const circle = scene.add.arc(dpx, dpy, 6, 0, 360, false, COLOR_HOLOGRAM_BLUE, 0.85);
            circle.setStrokeStyle(1.5, COLOR_ALERT_AMBER, 1.0);
            circle.setInteractive({ useHandCursor: true });
            deckContainer.add(circle);
            this.interactiveDoors.push(circle);

            // Bouncing/breathing effect
            scene.tweens.add({
              targets: circle,
              scaleX: 1.3,
              scaleY: 1.3,
              alpha: 0.4,
              duration: 800,
              yoyo: true,
              repeat: -1,
            });

            circle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              // Stop propagation to prevent triggering a room click at the same spot
              pointer.event.stopPropagation();
              onDoorClick(room.id, door.direction);
            });
          }
        }
      }
    }
  }
}
