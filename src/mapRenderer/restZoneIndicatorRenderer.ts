/**
 * restZoneIndicatorRenderer.ts
 *
 * Renders glowing green health crosses next to (inside the corner of) Airlocks
 * and Safety Rooms on the map, with floating/bobbing animations and mouse-hover
 * tooltips explaining resting.
 */

import Phaser from 'phaser';
import { RoomNode } from '../mapGenerator/mapLayoutTypes';
import { TILE_SIZE, COLOR_SUCCESS_GREEN } from './mapRenderTypes';
import { tooltipManager } from '../userInterface/tooltipManager';

export class RestZoneIndicatorRenderer {
  private indicators = new Map<string, Phaser.GameObjects.Container>();

  /**
   * Clears all indicator container game objects and their active tweens.
   */
  public clear(): void {
    for (const container of this.indicators.values()) {
      container.destroy();
    }
    this.indicators.clear();
  }

  /**
   * Spawns or updates rest indicators for discovered Airlocks and Safety Rooms.
   */
  public updateIndicators(
    scene: Phaser.Scene,
    rooms: RoomNode[],
    deckContainer: Phaser.GameObjects.Container
  ): void {
    const activeRoomIds = new Set<string>();

    for (const room of rooms) {
      if (!room.isDiscovered) continue;

      const roomTypeLower = room.roomType.toLowerCase();
      const isRestRoom = roomTypeLower.includes('airlock') || roomTypeLower.includes('safety');

      if (!isRestRoom) continue;

      activeRoomIds.add(room.id);

      // Positioning: inside the top-right corner of the room node
      const tx = room.x * TILE_SIZE + room.width * TILE_SIZE - 16;
      const ty = room.y * TILE_SIZE + 16;

      let container = this.indicators.get(room.id);

      if (!container) {
        // Create container for the glowing green cross
        container = scene.add.container(tx, ty);
        deckContainer.add(container);
        this.indicators.set(room.id, container);

        // 1. Draw glowing green background circle (semi-transparent)
        const glowCircle = scene.add.arc(0, 0, 14, 0, 360, false, COLOR_SUCCESS_GREEN, 0.25);
        container.add(glowCircle);

        // Pulse the glow circle size and alpha
        scene.tweens.add({
          targets: glowCircle,
          scaleX: 1.4,
          scaleY: 1.4,
          alpha: 0.05,
          duration: 1500,
          repeat: -1,
        });

        // 2. Draw green cross shape using graphics
        const crossGraphics = scene.add.graphics();
        
        // Draw black outline cross (slightly larger to pop against dark backgrounds)
        crossGraphics.fillStyle(0x000000, 1.0);
        crossGraphics.fillRect(-3.5, -7.5, 7, 15);
        crossGraphics.fillRect(-7.5, -3.5, 15, 7);

        // Draw green cross on top
        crossGraphics.fillStyle(COLOR_SUCCESS_GREEN, 1.0);
        crossGraphics.fillRect(-2, -6, 4, 12);
        crossGraphics.fillRect(-6, -2, 12, 4);

        container.add(crossGraphics);

        // 3. Setup bobbing / floating animation (making it "movable")
        scene.tweens.add({
          targets: container,
          y: ty - 4,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // 4. Interaction & Tooltip
        container.setSize(24, 24);
        container.setInteractive({ useHandCursor: true });

        const tooltipText = `<strong>Rest Zone</strong><br/>Resting allows a crew member to recover an exhausted trait. If any crewmate has died, this requires passing a Simple Test with automatic Rising Tension.`;

        container.on('pointerover', (pointer: Phaser.Input.Pointer) => {
          const mouseEvent = pointer.event as MouseEvent;
          if (mouseEvent && typeof mouseEvent.clientX === 'number') {
            tooltipManager.showAbsolute(mouseEvent.clientX, mouseEvent.clientY, tooltipText);
          }
        });

        container.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          const mouseEvent = pointer.event as MouseEvent;
          if (mouseEvent && typeof mouseEvent.clientX === 'number') {
            tooltipManager.showAbsolute(mouseEvent.clientX, mouseEvent.clientY, tooltipText);
          }
        });

        container.on('pointerout', () => {
          tooltipManager.hideExternal();
        });
      }
    }

    // Clean up indicators for rooms no longer present on the current deck
    for (const [id, container] of this.indicators.entries()) {
      if (!activeRoomIds.has(id)) {
        container.destroy();
        this.indicators.delete(id);
      }
    }
  }
}
