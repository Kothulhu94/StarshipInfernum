/**
 * fogOfWarController.ts
 *
 * Manages the dark fog of war overlays covering undiscovered rooms,
 * triggering smooth fade-out animations when a room is discovered.
 */

import Phaser from 'phaser';
import { RoomNode } from '../mapGenerator/mapLayoutTypes';
import { TILE_SIZE, COLOR_VOID_BLACK } from './mapRenderTypes';

export class FogOfWarController {
  private fogRects = new Map<string, Phaser.GameObjects.Rectangle>();
  private fogTexts = new Map<string, Phaser.GameObjects.Text>();

  /**
   * Resets and clears all fog objects (useful when switching decks)
   */
  public clear(): void {
    for (const rect of this.fogRects.values()) {
      rect.destroy();
    }
    for (const text of this.fogTexts.values()) {
      text.destroy();
    }
    this.fogRects.clear();
    this.fogTexts.clear();
  }

  /**
   * Syncs fog blocks with room discovery states
   */
  public updateFog(
    scene: Phaser.Scene,
    rooms: RoomNode[],
    deckContainer: Phaser.GameObjects.Container
  ): void {
    for (const room of rooms) {
      const isDiscovered = room.isDiscovered;

      if (!isDiscovered) {
        // If room is not discovered and doesn't have fog yet, draw it
        if (!this.fogRects.has(room.id)) {
          const w = room.width * TILE_SIZE;
          const h = room.height * TILE_SIZE;
          // Calculate center coords
          const px = room.x * TILE_SIZE + w / 2;
          const py = room.y * TILE_SIZE + h / 2;

          // Solid black rectangle
          const rect = scene.add.rectangle(px, py, w, h, COLOR_VOID_BLACK, 1.0);
          deckContainer.add(rect);
          this.fogRects.set(room.id, rect);

          // Add a subtle question mark text in the center
          const qText = scene.add.text(px, py, '?', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '18px',
            color: '#3a424d', // --bulkhead-steel
          }).setOrigin(0.5);
          deckContainer.add(qText);
          this.fogTexts.set(room.id, qText);
        }
      } else {
        // If room is discovered but still has a fog block, fade it out
        const rect = this.fogRects.get(room.id);
        const qText = this.fogTexts.get(room.id);

        if (rect) {
          scene.tweens.add({
            targets: rect,
            alpha: 0,
            duration: 600,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              rect.destroy();
            },
          });
          this.fogRects.delete(room.id);
        }

        if (qText) {
          scene.tweens.add({
            targets: qText,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              qText.destroy();
            },
          });
          this.fogTexts.delete(room.id);
        }
      }
    }
  }
}
