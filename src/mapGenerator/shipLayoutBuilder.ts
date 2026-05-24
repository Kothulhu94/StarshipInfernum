/**
 * shipLayoutBuilder.ts
 *
 * Orchestrates the procedural map generation.
 * Handles initial layout seeding, adjacent room placement, corridor routing,
 * and lift deck transition instantiation.
 */

import { RoomNode, WorldDoor, Corridor, DoorDirection, DoorSlot } from './mapLayoutTypes';
import { RoomNodeGraph } from './roomNodeGraph';
import { getRoomDefinitionForCard, getRoomTemplateForCard } from './deckToRoomMapper';
import { planCorridor } from './corridorPlanner';

/**
 * Returns the opposite door direction
 */
export function getOppositeDirection(direction: DoorDirection): DoorDirection {
  switch (direction) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
}

/**
 * Returns the step unit vector for a direction
 */
export function getDirectionVector(direction: DoorDirection): { dx: number; dy: number } {
  switch (direction) {
    case 'N': return { dx: 0, dy: -1 };
    case 'S': return { dx: 0, dy: 1 };
    case 'E': return { dx: 1, dy: 0 };
    case 'W': return { dx: -1, dy: 0 };
  }
}

/**
 * Helper to check if two bounding boxes overlap
 */
function doesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

/**
 * Instantiates a RoomNode at world coordinates
 */
function instantiateRoomNode(
  id: string,
  name: string,
  cardCode: string,
  roomType: string,
  width: number,
  height: number,
  templateId: string,
  doorSlots: DoorSlot[],
  features: any,
  x: number,
  y: number,
  z: number
): RoomNode {
  const doors: WorldDoor[] = doorSlots.map((slot) => ({
    id: `${id}:${slot.direction}`,
    x: x + slot.x,
    y: y + slot.y,
    direction: slot.direction,
    isLocked: false,
  }));

  return {
    id,
    name,
    cardCode,
    roomType,
    x,
    y,
    z,
    width,
    height,
    templateId,
    doors,
    features,
    isDiscovered: true,
  };
}

export class ShipLayoutBuilder {
  private roomCounter = 0;

  /**
   * Initializes a new graph and places a seed room at (0, 0, 0)
   */
  public createInitialLayout(seedCardCode: string): RoomNodeGraph {
    const graph = new RoomNodeGraph();
    const def = getRoomDefinitionForCard(seedCardCode);
    const template = getRoomTemplateForCard(seedCardCode);

    this.roomCounter = 0;
    const roomId = `room_${this.roomCounter++}`;

    const seedRoom = instantiateRoomNode(
      roomId,
      def.name,
      seedCardCode,
      def.name,
      template.width,
      template.height,
      template.templateId,
      template.doorSlots,
      def.features,
      -Math.floor(template.width / 2), // Center the seed room
      -Math.floor(template.height / 2),
      0
    );

    graph.addRoom(seedRoom);
    return graph;
  }

  /**
   * Attempts to grow a Lift room on a new deck level (z) at the exact same (x, y) coordinates
   * to connect multiple floors.
   */
  public transitLiftToDeck(
    graph: RoomNodeGraph,
    liftRoomId: string,
    targetDeck: number
  ): RoomNode | null {
    const existingLift = graph.getRoom(liftRoomId);
    if (!existingLift || !existingLift.roomType.toLowerCase().includes('lift')) {
      return null;
    }

    // Check if Lift already instantiated on the target deck
    const liftKeyOnTargetDeck = Array.from(graph.rooms.values()).find(
      (r) => r.roomType.toLowerCase().includes('lift') && r.x === existingLift.x && r.y === existingLift.y && r.z === targetDeck
    );

    if (liftKeyOnTargetDeck) {
      return liftKeyOnTargetDeck;
    }

    // Instantiate new node at same coords, new deck level
    const template = getRoomTemplateForCard(existingLift.cardCode || 'AH');
    const def = getRoomDefinitionForCard(existingLift.cardCode || 'AH');
    
    const newLiftRoomId = `room_${this.roomCounter++}`;
    const newLiftNode = instantiateRoomNode(
      newLiftRoomId,
      existingLift.name,
      existingLift.cardCode || 'AH',
      existingLift.roomType,
      existingLift.width,
      existingLift.height,
      existingLift.templateId,
      template.doorSlots,
      def.features,
      existingLift.x,
      existingLift.y,
      targetDeck
    );

    graph.addRoom(newLiftNode);
    return newLiftNode;
  }

  /**
   * Tries to place a room adjacent to a parent room's door, planning a corridor to it.
   */
  public discoverRoom(
    graph: RoomNodeGraph,
    parentRoomId: string,
    parentDoorDirection: DoorDirection,
    cardCode: string
  ): RoomNode | null {
    const parentRoom = graph.getRoom(parentRoomId);
    if (!parentRoom) return null;

    const parentDoor = parentRoom.doors.find((d) => d.direction === parentDoorDirection);
    if (!parentDoor) return null;
    if (parentDoor.connectedDoorId) {
      // Already connected
      const connId = parentDoor.connectedDoorId.split(':')[0];
      return graph.getRoom(connId) || null;
    }

    const def = getRoomDefinitionForCard(cardCode);
    const template = getRoomTemplateForCard(cardCode);
    const z = parentRoom.z;

    const dirVec = getDirectionVector(parentDoorDirection);
    const oppDir = getOppositeDirection(parentDoorDirection);

    // Try opposite door first, fallback to any available door slot
    const preferredSlots = template.doorSlots.filter((slot) => slot.direction === oppDir);
    const otherSlots = template.doorSlots.filter((slot) => slot.direction !== oppDir);
    const candidateSlots = [...preferredSlots, ...otherSlots];

    if (candidateSlots.length === 0) {
      return null; // No doors to connect to
    }

    const roomsList = Array.from(graph.rooms.values());

    // Try a few corridor lengths (distance in tiles between doors)
    const distChoices = [3, 4, 5, 6, 7];

    for (const slot of candidateSlots) {
      for (const dist of distChoices) {
        // Target world coordinate for the child's door
        const targetDoorX = parentDoor.x + dirVec.dx * dist;
        const targetDoorY = parentDoor.y + dirVec.dy * dist;

        // Parent door is on boundary, child door needs to step into the room
        // child top-left = targetDoor - slot coordinates
        const candidateX = targetDoorX - slot.x;
        const candidateY = targetDoorY - slot.y;

        // Check for overlaps with existing rooms on the same deck
        let overlaps = false;
        for (const room of roomsList) {
          if (room.z !== z) continue;
          if (
            doesOverlap(
              candidateX,
              candidateY,
              template.width,
              template.height,
              room.x,
              room.y,
              room.width,
              room.height
            )
          ) {
            overlaps = true;
            break;
          }
        }

        if (overlaps) {
          continue; // Try next distance or slot
        }

        // Try to pathfind a corridor from parent door to candidate door
        const corridorTiles = planCorridor(roomsList, z, parentDoor.x, parentDoor.y, targetDoorX, targetDoorY);
        if (corridorTiles) {
          // Success! Place the room
          const childRoomId = `room_${this.roomCounter++}`;
          const childRoom = instantiateRoomNode(
            childRoomId,
            def.name,
            cardCode,
            def.name,
            template.width,
            template.height,
            template.templateId,
            template.doorSlots,
            def.features,
            candidateX,
            candidateY,
            z
          );

          // Add to graph
          graph.addRoom(childRoom);

          // Add corridor
          const childDoorId = `${childRoomId}:${slot.direction}`;
          const corridorId = `${parentRoomId}:${parentDoorDirection}->${childRoomId}:${slot.direction}`;
          const corridor: Corridor = {
            id: corridorId,
            roomAId: parentRoomId,
            roomBId: childRoomId,
            doorAId: parentDoor.id,
            doorBId: childDoorId,
            tiles: corridorTiles,
          };

          graph.addCorridor(corridor);
          return childRoom;
        }
      }
    }

    // Try a direct door-to-door attachment (distance = 1, no corridor planner needed)
    for (const slot of candidateSlots) {
      const targetDoorX = parentDoor.x + dirVec.dx;
      const targetDoorY = parentDoor.y + dirVec.dy;

      const candidateX = targetDoorX - slot.x;
      const candidateY = targetDoorY - slot.y;

      let overlaps = false;
      for (const room of roomsList) {
        if (room.z !== z) continue;
        if (
          doesOverlap(
            candidateX,
            candidateY,
            template.width,
            template.height,
            room.x,
            room.y,
            room.width,
            room.height
          )
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        // Direct attachment works
        const childRoomId = `room_${this.roomCounter++}`;
        const childRoom = instantiateRoomNode(
          childRoomId,
          def.name,
          cardCode,
          def.name,
          template.width,
          template.height,
          template.templateId,
          template.doorSlots,
          def.features,
          candidateX,
          candidateY,
          z
        );

        graph.addRoom(childRoom);

        const childDoorId = `${childRoomId}:${slot.direction}`;
        const corridorId = `${parentRoomId}:${parentDoorDirection}->${childRoomId}:${slot.direction}`;
        const corridor: Corridor = {
          id: corridorId,
          roomAId: parentRoomId,
          roomBId: childRoomId,
          doorAId: parentDoor.id,
          doorBId: childDoorId,
          tiles: [
            { x: parentDoor.x, y: parentDoor.y, z },
            { x: targetDoorX, y: targetDoorY, z },
          ],
        };

        graph.addCorridor(corridor);
        return childRoom;
      }
    }

    return null; // Failed to place room adjacent to the doorway
  }
}
