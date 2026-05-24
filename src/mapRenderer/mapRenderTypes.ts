/**
 * mapRenderTypes.ts
 *
 * Defines constants, sizing, and color maps for the Phaser map renderer.
 */

export const TILE_SIZE = 32; // Sizing of each tile in pixels

// Hex values matching HSL variables from designTokens.css
export const COLOR_VOID_BLACK = 0x0c0e12;     // hsl(220, 20%, 6%)
export const COLOR_HULL_GUNMETAL = 0x1f232b;  // hsl(215, 15%, 14%)
export const COLOR_BULKHEAD_STEEL = 0x3a424d; // hsl(210, 10%, 25%)
export const COLOR_CONSOLE_CYAN = 0x30d5d5;   // hsl(185, 80%, 55%)
export const COLOR_ALERT_AMBER = 0xf29d27;    // hsl(38, 95%, 55%)
export const COLOR_DAMAGE_RED = 0xe02020;     // hsl(0, 75%, 50%)
export const COLOR_SUCCESS_GREEN = 0x2db865;  // hsl(145, 60%, 45%)
export const COLOR_GHOST_VIOLET = 0x9470c4;   // hsl(270, 40%, 60%)
export const COLOR_HOLOGRAM_BLUE = 0x66ccff;  // hsl(200, 100%, 70%)

export interface RenderPosition {
  x: number;
  y: number;
}
