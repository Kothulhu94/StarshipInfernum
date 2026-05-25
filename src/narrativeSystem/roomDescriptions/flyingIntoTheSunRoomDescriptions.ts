import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const flyingIntoTheSunRoomVoice: ScenarioRoomVoice = {
  id: 'flying_into_the_sun',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. Solar glare bleeds through seams and screens until every surface looks feverish. The ${room.fixtures} tick and flex as the Welke falls closer to the star, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} is worse than before. Heat distortion crawls over the ${room.fixtures}, and the deck plates pop under your boots as the ship's fatal trajectory tightens.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `The immediate danger in ${room.canonicalName} is handled, but nothing here feels safe. The heat keeps rising, baking the ${room.fixtures} and turning every pause into lost time.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `The star has turned the room's failure into ${obstacleName}; it spreads through ${room.canonicalName} like another symptom of the ship burning from the outside in.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} waits among the warped fixtures, its ruined body animated by silver machines that seem almost grateful for the heat.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis is written into every alarm here; ${room.canonicalName} feels less like a room than one more countdown marker.`;
  },
};
