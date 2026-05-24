/**
 * roomTemplateLibrary.ts
 *
 * Provides a dynamic library of room templates based on room sizes and features.
 * Generates structured tile grids with appropriate interior decorations.
 */

import { RoomTemplate, TileType, DoorSlot, FeatureMarker, DoorDirection } from './mapLayoutTypes';

/**
 * Helper to determine the dimension category and size of a room type
 */
function getRoomDimensions(roomType: string): { width: number; height: number } {
  const normalized = roomType.toLowerCase();

  if (normalized.includes('lift') || normalized.includes('elevator')) {
    return { width: 3, height: 3 };
  }
  if (normalized.includes('airlock')) {
    return { width: 4, height: 4 };
  }
  if (normalized.includes('hallway')) {
    return { width: 5, height: 5 };
  }
  if (
    normalized.includes('armory') ||
    normalized.includes('storage') ||
    normalized.includes('laundry') ||
    normalized.includes('officer quarters') ||
    normalized.includes('admin')
  ) {
    return { width: 6, height: 6 };
  }
  if (
    normalized.includes('crew quarters') ||
    normalized.includes('medbay') ||
    normalized.includes('science lab') ||
    normalized.includes('security hq') ||
    normalized.includes('communication') ||
    normalized.includes('navigation') ||
    normalized.includes('repair') ||
    normalized.includes('robotics') ||
    normalized.includes('waste') ||
    normalized.includes('classroom') ||
    normalized.includes('gym') ||
    normalized.includes('escape pods')
  ) {
    return { width: 8, height: 8 };
  }
  // Large rooms default
  return { width: 10, height: 8 };
}

/**
 * Creates potential door slots for a room template based on its size and type
 */
function getDoorSlots(width: number, height: number, roomType: string): DoorSlot[] {
  const normalized = roomType.toLowerCase();
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  // Lifts and airlocks connect strictly along N/S
  if (normalized.includes('lift') || normalized.includes('elevator')) {
    return [
      { x: midX, y: 0, direction: 'N' },
      { x: midX, y: height - 1, direction: 'S' },
    ];
  }
  if (normalized.includes('airlock')) {
    return [
      { x: midX, y: height - 1, direction: 'S' }, // entrance from ship
    ];
  }

  // Default: potential door slots in all 4 directions
  return [
    { x: midX, y: 0, direction: 'N' },
    { x: midX, y: height - 1, direction: 'S' },
    { x: width - 1, y: midY, direction: 'E' },
    { x: 0, y: midY, direction: 'W' },
  ];
}

/**
 * Decorate the interior layout with room-specific furniture tiles
 */
function decorateInterior(
  layout: TileType[][],
  width: number,
  height: number,
  roomType: string
): void {
  const normalized = roomType.toLowerCase();

  // Draw default walls around borders
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        layout[y][x] = 'WALL';
      }
    }
  }

  // Interior decoration (avoiding borders)
  if (normalized.includes('crew quarters') || normalized.includes('officer quarters')) {
    // Add beds along left/right walls
    for (let y = 2; y < height - 2; y += 2) {
      if (width > 4) {
        layout[y][1] = 'BED';
        layout[y][width - 2] = 'BED';
      }
    }
  } else if (normalized.includes('cryopods')) {
    for (let y = 2; y < height - 2; y += 2) {
      if (width > 4) {
        layout[y][1] = 'POD';
        layout[y][width - 2] = 'POD';
      }
    }
  } else if (
    normalized.includes('science lab') ||
    normalized.includes('server') ||
    normalized.includes('core') ||
    normalized.includes('bridge') ||
    normalized.includes('security hq') ||
    normalized.includes('control') ||
    normalized.includes('communication') ||
    normalized.includes('navigation')
  ) {
    // Add console desks and screens in the center/sides
    if (width > 5 && height > 5) {
      layout[2][2] = 'CONSOLE';
      layout[2][3] = 'SCREEN';
      layout[height - 3][width - 3] = 'CONSOLE';
    }
  } else if (normalized.includes('storage') || normalized.includes('cargo') || normalized.includes('vault')) {
    // Add crates
    if (width > 4 && height > 4) {
      layout[2][1] = 'CRATE';
      layout[1][2] = 'CRATE';
      layout[height - 2][width - 3] = 'CRATE';
      layout[height - 3][width - 2] = 'CRATE';
    }
  } else if (normalized.includes('life support') || normalized.includes('engineering')) {
    if (width > 4 && height > 4) {
      layout[1][1] = 'VENTS';
      layout[height - 2][width - 2] = 'VENTS';
      layout[Math.floor(height / 2)][Math.floor(width / 2)] = 'CONSOLE';
    }
  } else if (normalized.includes('garden') || normalized.includes('hydroponics')) {
    // Dynamic garden patches
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if ((x + y) % 2 === 0) {
          layout[y][x] = 'HAZARD'; // Treat hydroponics fluid/tanks as custom
        }
      }
    }
  }
}

/**
 * Main factory function to get or build a RoomTemplate
 */
export function getTemplateForRoom(
  roomType: string,
  features: {
    weapons?: boolean;
    medkit?: boolean;
    explosives?: boolean;
    eva?: boolean;
    special?: boolean;
  }
): RoomTemplate {
  const { width, height } = getRoomDimensions(roomType);
  
  // Initialize grid filled with FLOOR
  const interiorLayout: TileType[][] = Array.from({ length: height }, () =>
    Array(width).fill('FLOOR')
  );

  // Decorate walls and specific items
  decorateInterior(interiorLayout, width, height, roomType);

  // Mark door positions on layout
  const doorSlots = getDoorSlots(width, height, roomType);
  for (const slot of doorSlots) {
    interiorLayout[slot.y][slot.x] = 'DOOR';
  }

  // Create feature markers
  const featureMarkers: FeatureMarker[] = [];
  
  if (features.weapons && width > 4 && height > 4) {
    featureMarkers.push({ type: 'weapons', x: width - 2, y: height - 2 });
    interiorLayout[height - 2][width - 2] = 'CRATE';
  }
  if (features.medkit && width > 4 && height > 4) {
    featureMarkers.push({ type: 'medkit', x: 2, y: height - 2 });
    interiorLayout[height - 2][2] = 'CRATE';
  }
  if (features.explosives && width > 4 && height > 4) {
    featureMarkers.push({ type: 'explosives', x: width - 2, y: 2 });
    interiorLayout[2][width - 2] = 'CRATE';
  }
  if (features.eva) {
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    featureMarkers.push({ type: 'eva_hatch', x: midX, y: midY });
    interiorLayout[midY][midX] = 'HATCH';
  }
  if (features.special && width > 4 && height > 4) {
    featureMarkers.push({ type: 'special', x: Math.floor(width / 2), y: Math.floor(height / 2) });
  }

  const templateId = `${roomType.replace(/[^a-zA-Z0-9]/g, '_')}_${width}x${height}`;

  return {
    templateId,
    width,
    height,
    interiorLayout,
    doorSlots,
    featureMarkers,
  };
}
