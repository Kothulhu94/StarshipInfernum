import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const terrorOnHolodeckThreeRoomVoice: ScenarioRoomVoice = {
  id: 'terror_on_holodeck_three',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The holodeck has skinned the room with the wrong genre: textures crawl across the ${room.fixtures}, perspective stutters, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} reloads badly as you return. Props, walls, and ${room.fixtures} occupy almost the same places, but the simulation has changed enough to prove it is watching.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `${room.canonicalName} has been stabilized for the moment. The illusion still glitches at the edges, but the fatal routine that owned the room has lost priority.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `${obstacleName} compiles inside ${room.canonicalName}, dragging real danger through fake scenery until the ${room.fixtures} cannot be trusted as props or cover.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} renders in with a flicker of broken frames, occupying the ${room.canonicalName} as if the room were built for its entrance.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis bleeds through ${room.canonicalName}; the simulation is no longer content to stay inside its walls.`;
  },
};
