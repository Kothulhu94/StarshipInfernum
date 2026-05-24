import { Card } from '@cardEngine/cardDefinitions';
import { Character } from './characterTypes';
import { canShapeshifterSwap, canSmugglerSwap } from './aptitudeExecutor';
import { hasGear } from './gearInventory';

export type GearAction =
  | { type: 'GEAR'; gear: 'ranged_weapon' | 'melee_weapon'; action: 'REDRAW_LAST_CARD' };

export type PlayerAction =
  | 'HIT'
  | 'STAND'
  | { type: 'TRAIT'; traitName: string }
  | { type: 'SHAPESHIFTER_SWAP' }
  | { type: 'SMUGGLER_SWAP' }
  | GearAction
  | { type: 'FLEE' }
  | { type: 'BYPASS' }
  | { type: 'ASSIST'; targetId: string };

export interface PlayerActionPromptContext {
  hasUsedShapeshifterSwap?: boolean;
  hasUsedSmugglerSwap?: boolean;
  canUseWeaponRedraw?: boolean;
}

export interface PlayerActionAvailability {
  canUseTrait: boolean;
  canUseShapeshifterSwap: boolean;
  canUseSmugglerSwap: boolean;
  canUseWeaponRedraw: boolean;
  weaponForRedraw: 'ranged_weapon' | 'melee_weapon' | null;
}

export function canUseTraitModifier(character: Character, canUseTrait: boolean): boolean {
  return canUseTrait && character.gear !== 'spacesuit';
}

export function getPlayerActionAvailability(
  character: Character,
  hand: Card[],
  canUseTrait: boolean,
  context: PlayerActionPromptContext = {}
): PlayerActionAvailability {
  const weaponForRedraw = hasGear(character, 'ranged_weapon')
    ? 'ranged_weapon'
    : hasGear(character, 'melee_weapon')
      ? 'melee_weapon'
      : null;

  return {
    canUseTrait: canUseTraitModifier(character, canUseTrait),
    canUseShapeshifterSwap: hand.length > 0 && canShapeshifterSwap(character, !!context.hasUsedShapeshifterSwap),
    canUseSmugglerSwap: hand.length > 0 && canSmugglerSwap(character, !!context.hasUsedSmugglerSwap),
    canUseWeaponRedraw: hand.length > 0 && !!context.canUseWeaponRedraw && weaponForRedraw !== null,
    weaponForRedraw
  };
}
