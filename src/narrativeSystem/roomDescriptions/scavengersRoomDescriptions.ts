import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const scavengersRoomVoice: ScenarioRoomVoice = {
  id: 'scavengers',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The derelict does not feel abandoned; it feels patient. Dust, resin, and old alien corrosion coat the ${room.fixtures}, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} feels rearranged by something that did not use hands. Around the ${room.fixtures}, the air carries a wet mineral scent and the uneasy feeling of being measured.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `You have made ${room.canonicalName} passable, not safe. The alien ship accepts the cleared path in silence while deeper structures creak like a throat swallowing.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `${obstacleName} has rooted itself in ${room.canonicalName}, tangled with the alien ship's old systems until salvage work becomes survival work.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} is here. The ${room.fixtures} frame only pieces of it at a time, enough to prove the missing crew were not alone.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis gives ${room.canonicalName} a terrible importance; somewhere beyond the walls, the predator keeps pace.`;
  },
};
