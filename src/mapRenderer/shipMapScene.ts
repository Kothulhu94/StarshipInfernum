/**
 * shipMapScene.ts
 *
 * Master Phaser scene coordinating room/corridor rendering, fog of war,
 * interactive clicks, and camera controls.
 */

import Phaser from 'phaser';
import { RoomNodeGraph } from '../mapGenerator/roomNodeGraph';
import { RoomNode, DoorDirection } from '../mapGenerator/mapLayoutTypes';
import { Character } from '../characterSystem/characterTypes';
import { MapCameraController } from './mapCameraController';
import { CharacterTokenRenderer } from './characterTokenRenderer';
import { MapInteractionHandler } from './mapInteractionHandler';
import { paintRoom } from './roomTilePainter';
import { paintCorridor } from './corridorTilePainter';
import { paintRoomIconOverlays } from './roomIconOverlays';
import { RestZoneIndicatorRenderer } from './restZoneIndicatorRenderer';

export class ShipMapScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private deckContainer!: Phaser.GameObjects.Container;

  private cameraController!: MapCameraController;
  private tokenRenderer!: CharacterTokenRenderer;
  private interactionHandler!: MapInteractionHandler;
  private restIndicatorRenderer!: RestZoneIndicatorRenderer;

  // Active Map State
  private graph?: RoomNodeGraph;
  private characterPositions = new Map<string, string>();
  private charactersList: Character[] = [];
  private activeRoomId = '';
  private activeCharacterId = '';
  private activeObstacleRoomIds = new Set<string>();
  private currentDeck = 0;

  // Initialization Safety
  private isCreated = false;
  private pendingStateUpdate?: {
    graph: RoomNodeGraph;
    characterPositions: Map<string, string>;
    characters: Character[];
    activeRoomId: string;
    activeCharacterId: string;
    activeObstacleRoomIds: Set<string>;
    deckLevel: number;
  };

  // Callbacks for engine integrations
  public onRoomClicked?: (roomId: string) => void;
  public onDoorClicked?: (roomId: string, direction: DoorDirection) => void;
  public onRoomHovered?: (room: RoomNode | null) => void;

  constructor() {
    super({ key: 'ShipMapScene' });
  }

  public create(): void {
    // Container that holds all deck elements to allow uniform clearing or transforms
    this.deckContainer = this.add.container(0, 0);

    // Vector graphics layer for painting rooms & corridors
    this.graphics = this.add.graphics();
    this.deckContainer.add(this.graphics);

    // Initialize sub-controllers
    this.cameraController = new MapCameraController(this);
    this.tokenRenderer = new CharacterTokenRenderer();
    this.interactionHandler = new MapInteractionHandler();
    this.restIndicatorRenderer = new RestZoneIndicatorRenderer();

    // Initial camera size adjustment
    this.cameras.main.setSize(this.scale.width, this.scale.height);

    // Resize listener to center camera or adjust size
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      if (this.graph && this.activeRoomId) {
        const activeRoom = this.graph.getRoom(this.activeRoomId);
        if (activeRoom && activeRoom.z === this.currentDeck) {
          this.cameraController.centerOnRoom(
            activeRoom.x,
            activeRoom.y,
            activeRoom.width,
            activeRoom.height
          );
        }
      }
    });

    this.isCreated = true;

    // Flush any state updates received before scene was created
    if (this.pendingStateUpdate) {
      this.updateState(
        this.pendingStateUpdate.graph,
        this.pendingStateUpdate.characterPositions,
        this.pendingStateUpdate.characters,
        this.pendingStateUpdate.activeRoomId,
        this.pendingStateUpdate.activeCharacterId,
        this.pendingStateUpdate.activeObstacleRoomIds,
        this.pendingStateUpdate.deckLevel
      );
      this.pendingStateUpdate = undefined;
    }

    console.log('Phaser ShipMapScene created');
  }

  /**
   * Primary entry point for updating map states from external modules.
   */
  public updateState(
    graph: RoomNodeGraph,
    characterPositions: Map<string, string>,
    characters: Character[],
    activeRoomId: string,
    activeCharacterId: string,
    activeObstacleRoomIds: Set<string>,
    deckLevel: number
  ): void {
    if (!this.isCreated) {
      this.pendingStateUpdate = {
        graph,
        characterPositions,
        characters,
        activeRoomId,
        activeCharacterId,
        activeObstacleRoomIds,
        deckLevel,
      };
      return;
    }

    const graphChanged = this.graph !== graph;
    const deckChanged = this.currentDeck !== deckLevel;
    const activeRoomChanged = this.activeRoomId !== activeRoomId;

    this.graph = graph;
    this.characterPositions = characterPositions;
    this.charactersList = characters;
    this.activeRoomId = activeRoomId;
    this.activeCharacterId = activeCharacterId;
    this.activeObstacleRoomIds = activeObstacleRoomIds;
    this.currentDeck = deckLevel;

    if (deckChanged || graphChanged) {
      // Clear current deck graphic tokens
      this.tokenRenderer.clear();
      this.interactionHandler.clear();
      this.restIndicatorRenderer.clear();
    }

    this.renderMap();

    // Snaps camera on initial render, active room change, or deck transits
    if (deckChanged || activeRoomChanged) {
      const activeRoom = graph.getRoom(activeRoomId);
      if (activeRoom && activeRoom.z === this.currentDeck) {
        this.cameraController.centerOnRoom(
          activeRoom.x,
          activeRoom.y,
          activeRoom.width,
          activeRoom.height
        );
      }
    }
  }

  /**
   * Redraws all corridor paths, rooms, tokens, and interactions.
   */
  private renderMap(): void {
    if (!this.graph) return;

    this.graphics.clear();

    const roomsOnDeck = this.graph.getRoomsOnDeck(this.currentDeck);
    const corridorsOnDeck = Array.from(this.graph.corridors.values()).filter(
      (c) => c.tiles[0]?.z === this.currentDeck
    );

    // 1. Paint corridors first so they render under room walls
    for (const corridor of corridorsOnDeck) {
      paintCorridor(this.graphics, corridor, roomsOnDeck, corridorsOnDeck);
    }

    // 2. Paint room interiors
    for (const room of roomsOnDeck) {
      paintRoom(this.graphics, room, this.activeRoomId);
    }

    // 3. Paint active hazards and item markers
    paintRoomIconOverlays(this.graphics, roomsOnDeck, this.activeObstacleRoomIds);

    // Paint rest indicators for Airlocks/Safety Rooms
    this.restIndicatorRenderer.updateIndicators(this, roomsOnDeck, this.deckContainer);

    // 4. Update Interactive Zones
    this.interactionHandler.setupInteractions(
      this,
      roomsOnDeck,
      this.activeRoomId,
      this.deckContainer,
      (roomId) => this.handleRoomClick(roomId),
      (roomId, dir) => this.handleDoorClick(roomId, dir),
      (room) => this.handleRoomHover(room)
    );

    // 5. Update Character Tokens
    const roomsMap = this.graph.rooms;
    this.tokenRenderer.updateTokens(
      this,
      this.charactersList,
      this.characterPositions,
      roomsMap,
      this.activeCharacterId,
      this.deckContainer
    );
  }

  private handleRoomClick(roomId: string): void {
    if (this.onRoomClicked) {
      this.onRoomClicked(roomId);
    }
  }

  private handleDoorClick(roomId: string, direction: DoorDirection): void {
    if (this.onDoorClicked) {
      this.onDoorClicked(roomId, direction);
    }
  }

  private handleRoomHover(room: RoomNode | null): void {
    if (this.onRoomHovered) {
      this.onRoomHovered(room);
    }
  }
}
