import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const spaceMadnessRoomVoice: ScenarioRoomVoice = {
  id: 'space_madness',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. Space Force One presents the crisis with full ceremonial nonsense: the ${room.fixtures} are mislabeled, overdecorated, or arguing through the speakers, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} has committed to a new bit since you left. The ${room.fixtures} now look staged for an audience, though the danger underneath the joke has not softened.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `For now, ${room.canonicalName} has been bullied back into usefulness. The absurd details remain, but they no longer have complete tactical control of the room.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `${obstacleName} erupts through ${room.canonicalName} with the lurid confidence of bad science and worse judgment, turning the ${room.fixtures} into props with consequences.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} lurches into view as if entering on cue, ridiculous at first glance and immediately lethal at second glance.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis bends ${room.canonicalName} toward slapstick disaster, but every punchline still has blood behind it.`;
  },
};
