/**
 * mapCameraController.ts
 *
 * Implements mouse drag-panning, scroll-wheeling zoom,
 * and programmatic smooth camera snapping functions.
 */

import Phaser from 'phaser';
import { TILE_SIZE } from './mapRenderTypes';

export class MapCameraController {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.camera = scene.cameras.main;

    this.setupZoom(scene);
    this.setupDragPan(scene);
  }

  /**
   * Sets up mouse wheel scrolling zoom
   */
  private setupZoom(scene: Phaser.Scene): void {
    scene.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: any[],
      _deltaX: number,
      deltaY: number
    ) => {
      // Calculate target zoom factor
      const zoomFactor = 0.1;
      let newZoom = this.camera.zoom + (deltaY > 0 ? -zoomFactor : zoomFactor);

      // Clamp zoom between 0.4 and 2.5
      newZoom = Phaser.Math.Clamp(newZoom, 0.4, 2.5);

      // Tween to zoom level smoothly
      scene.tweens.add({
        targets: this.camera,
        zoom: newZoom,
        duration: 150,
        ease: 'Cubic.easeOut',
      });
    });
  }

  /**
   * Sets up mouse pointer click and drag panning
   */
  private setupDragPan(scene: Phaser.Scene): void {
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      // Adjust camera scroll based on active pointer drag offset
      this.camera.scrollX -= pointer.prevPosition.x - pointer.position.x;
      this.camera.scrollY -= pointer.prevPosition.y - pointer.position.y;
    });
  }

  /**
   * Smoothly pans the camera to center on world coordinates
   */
  public panTo(x: number, y: number, duration = 800): void {
    this.camera.pan(x, y, duration, 'Cubic.easeInOut', true);
  }

  /**
   * Snaps the camera to center on a target room node
   */
  public centerOnRoom(roomX: number, roomY: number, roomWidth: number, roomHeight: number): void {
    const worldCenterX = roomX * TILE_SIZE + (roomWidth * TILE_SIZE) / 2;
    const worldCenterY = roomY * TILE_SIZE + (roomHeight * TILE_SIZE) / 2;
    this.panTo(worldCenterX, worldCenterY, 600);
  }

  /**
   * Smoothly tweens camera zoom level
   */
  public zoomTo(level: number, duration = 500): void {
    const clamped = Phaser.Math.Clamp(level, 0.4, 2.5);
    this.camera.zoomTo(clamped, duration, 'Cubic.easeOut', true);
  }
}
