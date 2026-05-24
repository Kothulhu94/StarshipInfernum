/**
 * roomNodeGraph.ts
 *
 * Implements the RoomNodeGraph data structure representing rooms and corridors,
 * with utility queries for neighbor mapping and BFS pathfinding.
 */

import { RoomNode, Corridor, WorldDoor } from './mapLayoutTypes';

export class RoomNodeGraph {
  public rooms = new Map<string, RoomNode>();
  public corridors = new Map<string, Corridor>();

  /**
   * Adds an instantiated room node to the graph
   */
  public addRoom(room: RoomNode): void {
    this.rooms.set(room.id, room);
  }

  /**
   * Fetches a room node by its unique ID
   */
  public getRoom(id: string): RoomNode | undefined {
    return this.rooms.get(id);
  }

  /**
   * Adds a corridor to the graph, linking the corresponding door objects
   */
  public addCorridor(corridor: Corridor): void {
    this.corridors.set(corridor.id, corridor);

    const roomA = this.rooms.get(corridor.roomAId);
    const roomB = this.rooms.get(corridor.roomBId);

    if (roomA && roomB) {
      const doorA = roomA.doors.find((d) => d.id === corridor.doorAId);
      const doorB = roomB.doors.find((d) => d.id === corridor.doorBId);

      if (doorA && doorB) {
        doorA.connectedDoorId = doorB.id;
        doorB.connectedDoorId = doorA.id;
      }
    }
  }

  /**
   * Checks if two rooms are directly connected via a door connection
   */
  public areConnected(roomAId: string, roomBId: string): boolean {
    const roomA = this.rooms.get(roomAId);
    if (!roomA) return false;

    return roomA.doors.some((door) => {
      if (!door.connectedDoorId) return false;
      const neighborId = door.connectedDoorId.split(':')[0];
      return neighborId === roomBId;
    });
  }

  /**
   * Returns a list of direct neighbors for a given room
   */
  public getNeighbors(
    roomId: string
  ): { neighborId: string; doorId: string; neighborDoorId: string }[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const neighbors: { neighborId: string; doorId: string; neighborDoorId: string }[] = [];
    for (const door of room.doors) {
      if (door.connectedDoorId) {
        const neighborId = door.connectedDoorId.split(':')[0];
        neighbors.push({
          neighborId,
          doorId: door.id,
          neighborDoorId: door.connectedDoorId,
        });
      }
    }
    return neighbors;
  }

  /**
   * Performs BFS to find the shortest path of room IDs from start to end
   */
  public findPath(startRoomId: string, endRoomId: string): string[] | null {
    if (!this.rooms.has(startRoomId) || !this.rooms.has(endRoomId)) return null;
    if (startRoomId === endRoomId) return [startRoomId];

    const queue: string[][] = [[startRoomId]];
    const visited = new Set<string>([startRoomId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === endRoomId) {
        return path;
      }

      const neighbors = this.getNeighbors(current);
      for (const n of neighbors) {
        if (!visited.has(n.neighborId)) {
          visited.add(n.neighborId);
          queue.push([...path, n.neighborId]);
        }
      }
    }

    return null;
  }

  /**
   * Returns the RoomNode covering the given tile coordinate, or null
   */
  public getRoomAtTile(x: number, y: number, z: number): RoomNode | null {
    for (const room of this.rooms.values()) {
      if (
        room.z === z &&
        x >= room.x &&
        x < room.x + room.width &&
        y >= room.y &&
        y < room.y + room.height
      ) {
        return room;
      }
    }
    return null;
  }

  /**
   * Returns all room nodes placed on a specific deck
   */
  public getRoomsOnDeck(z: number): RoomNode[] {
    return Array.from(this.rooms.values()).filter((r) => r.z === z);
  }
}
