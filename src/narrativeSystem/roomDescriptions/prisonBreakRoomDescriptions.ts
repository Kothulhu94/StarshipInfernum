import { RoomSurfaceDetail, RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';

export const prisonBreakRoomVoice: ScenarioRoomVoice = {
  id: 'prison_break',
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string {
    const actor = context.characterName || 'You';
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The Pembroke 13 has been remade by prisoners with time, rage, and stolen tools. The ${room.fixtures} are tagged, stripped, or barricaded, and ${room.clue}`;
  },
  revisit(room: RoomSurfaceDetail): string {
    return `The ${room.canonicalName} has shifted since your last pass. Footprints, fresh damage, and moved debris around the ${room.fixtures} make it clear the mutiny is still organizing around you.`;
  },
  cleared(room: RoomSurfaceDetail): string {
    return `The crew has forced a pocket of order back into ${room.canonicalName}. The room is still wrecked, but the barricades and broken fixtures no longer own the path.`;
  },
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string {
    return `${obstacleName} turns ${room.canonicalName} into another improvised kill zone, the kind of ugly trap desperate inmates build when they know rescue is coming.`;
  },
  adversary(adversaryName: string, room: RoomSurfaceDetail): string {
    return `${adversaryName} steps out from the damaged ${room.fixtures}, carrying the confidence of someone who has already taken this ship once.`;
  },
  crisis(crisisId: string, room: RoomSurfaceDetail): string {
    return `The ${crisisId.replace(/_/g, ' ').toLowerCase()} crisis echoes through the prison transport; every sign of control in ${room.canonicalName} has been turned against you.`;
  },
};
