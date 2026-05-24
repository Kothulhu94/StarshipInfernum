/**
 * characterTokenRenderer.ts
 *
 * Renders PC and NPC character tokens as circular icons with initials,
 * including pulsing active rings and smooth tweened movement between rooms.
 */

import Phaser from 'phaser';
import { RoomNode } from '../mapGenerator/mapLayoutTypes';
import { Character } from '../characterSystem/characterTypes';
import {
  TILE_SIZE,
  COLOR_CONSOLE_CYAN,
  COLOR_GHOST_VIOLET,
  COLOR_BULKHEAD_STEEL,
  COLOR_VOID_BLACK,
} from './mapRenderTypes';

export class CharacterTokenRenderer {
  private tokens = new Map<string, Phaser.GameObjects.Container>();
  private activeRings = new Map<string, Phaser.GameObjects.Arc>();

  /**
   * Clears all token game objects
   */
  public clear(): void {
    for (const container of this.tokens.values()) {
      container.destroy();
    }
    for (const ring of this.activeRings.values()) {
      ring.destroy();
    }
    this.tokens.clear();
    this.activeRings.clear();
  }

  /**
   * Helper to compute initials from character name
   */
  private getInitials(name: string): string {
    return name
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Renders and updates character tokens, animating movements between room centers.
   */
  public updateTokens(
    scene: Phaser.Scene,
    characters: Character[],
    characterPositions: Map<string, string>, // characterId -> roomId
    rooms: Map<string, RoomNode>,
    activeCharacterId: string,
    deckContainer: Phaser.GameObjects.Container
  ): void {
    // Keep track of characters we updated to clean up deleted ones
    const activeIds = new Set<string>();

    characters.forEach((char) => {
      const roomId = characterPositions.get(char.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      activeIds.add(char.id);

      // Compute center coordinates of target room
      const tx = room.x * TILE_SIZE + (room.width * TILE_SIZE) / 2;
      const ty = room.y * TILE_SIZE + (room.height * TILE_SIZE) / 2;

      // Determine color theme
      let fillColor = COLOR_CONSOLE_CYAN;
      if (char.isDead) {
        fillColor = COLOR_GHOST_VIOLET;
      } else if (char.isAI) {
        fillColor = COLOR_BULKHEAD_STEEL;
      }

      let container = this.tokens.get(char.id);

      if (!container) {
        // 1. Create new token container
        container = scene.add.container(tx, ty);
        deckContainer.add(container);
        this.tokens.set(char.id, container);

        // Solid background circle
        const circle = scene.add.arc(0, 0, 12, 0, 360, false, fillColor, 1.0);
        circle.setStrokeStyle(1.5, COLOR_VOID_BLACK, 1.0);
        container.add(circle);

        // Initials label
        const initials = this.getInitials(char.name);
        const text = scene.add.text(0, 0, initials, {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          fontStyle: 'bold',
          color: char.isAI ? '#9fb0c9' : '#0c0e12',
        }).setOrigin(0.5);
        container.add(text);

        // Add visual entry fade
        container.alpha = 0;
        scene.tweens.add({
          targets: container,
          alpha: 1,
          duration: 300,
        });
      } else {
        // 2. Update existing token position with tween animation if moved
        if (container.x !== tx || container.y !== ty) {
          scene.tweens.add({
            targets: container,
            x: tx,
            y: ty,
            duration: 500,
            ease: 'Cubic.easeInOut',
          });
        }
      }

      // 3. Manage active character pulsing selection ring
      const isActive = char.id === activeCharacterId;
      let ring = this.activeRings.get(char.id);

      if (isActive) {
        if (!ring) {
          ring = scene.add.arc(0, 0, 16, 0, 360, false, 0, 0);
          ring.setStrokeStyle(1.5, fillColor, 0.8);
          container.add(ring);
          this.activeRings.set(char.id, ring);

          // Pulse animation
          scene.tweens.add({
            targets: ring,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0.1,
            duration: 1200,
            repeat: -1,
            yoyo: false,
          });
        }
      } else {
        if (ring) {
          ring.destroy();
          this.activeRings.delete(char.id);
        }
      }
    });

    // Remove any tokens for characters no longer present
    for (const [id, container] of this.tokens.entries()) {
      if (!activeIds.has(id)) {
        container.destroy();
        this.tokens.delete(id);
        const ring = this.activeRings.get(id);
        if (ring) {
          ring.destroy();
          this.activeRings.delete(id);
        }
      }
    }
  }
}
