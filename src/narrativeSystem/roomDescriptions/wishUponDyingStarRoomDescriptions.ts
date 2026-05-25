import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const wishUponDyingStarRoomVoice: ScenarioRoomVoice = {
  id: 'wish_upon_dying_star',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The Phoenix is dead enough that silence has weight. Cold darkness lies over the ${room.fixtures}, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} remembers you. Shadows around the ${room.fixtures} fall at slightly wrong angles, and the dead ship seems to hold its breath until you move.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `The path through ${room.canonicalName} is open, but the room does not feel restored. The cold has simply learned to wait outside the cleared space.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `${obstacleName} manifests in ${room.canonicalName} like a symptom of the dying star's nightmare, spreading through the ${room.fixtures} with impossible patience.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} gathers where the light fails, its outline eating detail from the ${room.fixtures} as it turns toward you.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis makes ${room.canonicalName} feel like part of a ritual the ship began long before you arrived.`;
  },
};
