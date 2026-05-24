/**
 * mapLayoutTypes.ts
 *
 * Defines the core types and interfaces for the procedural ship layout generator.
 * This file is purely data-centric and does not contain Phaser or rendering dependencies.
 */

export type TileType =
  | 'VOID'
  | 'FLOOR'
  | 'WALL'
  | 'DOOR'
  | 'CONSOLE'
  | 'BED'
  | 'CRATE'
  | 'HAZARD'
  | 'HATCH'
  | 'POD'
  | 'SCREEN'
  | 'VENTS';

export type DoorDirection = 'N' | 'S' | 'E' | 'W';

export interface DoorSlot {
  x: number; // Local room coordinates (0-indexed)
  y: number;
  direction: DoorDirection;
}

export interface FeatureMarker {
  type: 'weapons' | 'medkit' | 'explosives' | 'eva_hatch' | 'special';
  x: number; // Local room coordinates
  y: number;
}

export interface RoomTemplate {
  templateId: string;
  width: number; // Dimension in tiles
  height: number; // Dimension in tiles
  interiorLayout: TileType[][]; // 2D grid [y][x]
  doorSlots: DoorSlot[];
  featureMarkers: FeatureMarker[];
}

export interface WorldDoor {
  id: string; // Unique door ID format: "room_id:direction"
  x: number; // World x position on the tile grid
  y: number; // World y position on the tile grid
  direction: DoorDirection;
  connectedDoorId?: string; // ID of the door it connects to, if any
  isLocked: boolean;
}

export interface RoomNode {
  id: string; // Unique room ID (usually roomName + index or unique token)
  name: string; // Display name
  cardCode?: string; // The R&O card code that spawned this room
  roomType: string;
  x: number; // Top-left world coordinate X on tile grid
  y: number; // Top-left world coordinate Y on tile grid
  z: number; // Deck level (0 = main deck, -1 = lower, 1 = upper, etc.)
  width: number;
  height: number;
  templateId: string;
  doors: WorldDoor[];
  features: {
    weapons?: boolean;
    medkit?: boolean;
    explosives?: boolean;
    eva?: boolean;
    special?: boolean;
  };
  isDiscovered: boolean;
}

export interface Corridor {
  id: string; // Unique corridor ID: "roomAId:doorDirA->roomBId:doorDirB"
  roomAId: string;
  roomBId: string;
  doorAId: string;
  doorBId: string;
  tiles: { x: number; y: number; z: number }[]; // List of tile coordinates in the path
}

export interface MapLayoutState {
  rooms: Map<string, RoomNode>;
  corridors: Map<string, Corridor>;
  activeRoomId: string;
  currentDeck: number;
}
