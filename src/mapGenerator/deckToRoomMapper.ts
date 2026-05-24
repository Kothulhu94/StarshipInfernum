/**
 * deckToRoomMapper.ts
 *
 * Connects drawn R&O card codes to Room definitions and templates.
 */

import { ROOM_REGISTRY, RoomDefinition } from '../encounterSystem/obstacleRegistry';
import { RoomTemplate } from './mapLayoutTypes';
import { getTemplateForRoom } from './roomTemplateLibrary';

/**
 * Resolves a card code to its Room Definition (from ROOM_REGISTRY)
 */
export function getRoomDefinitionForCard(cardCode: string): RoomDefinition {
  const definition = ROOM_REGISTRY[cardCode];
  if (definition) {
    return definition;
  }

  // Safe fallback if cardCode is not in registry
  return {
    cardCode,
    name: `Unknown Room (${cardCode})`,
    features: {},
  };
}

/**
 * Maps a card code to its generated RoomTemplate
 */
export function getRoomTemplateForCard(cardCode: string): RoomTemplate {
  const def = getRoomDefinitionForCard(cardCode);
  return getTemplateForRoom(def.name, def.features);
}
