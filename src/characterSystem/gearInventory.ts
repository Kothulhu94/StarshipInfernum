import { Character, Gear } from './characterTypes';

/**
 * Checks if a character is allowed to pick up a piece of gear.
 * - Standard characters can hold at most 1 piece of gear.
 * - Spacesuit counts as gear and prevents carrying anything else.
 * - Militants can carry one ranged_weapon, one melee_weapon, and explosives simultaneously.
 */
export function canPickUpGear(character: Character, newGear: Gear): boolean {
  if (!newGear) return true;

  // Spacesuit prevents carrying anything else, and cannot be picked up if carrying something else.
  if (newGear === 'spacesuit') {
    return character.gear === null && (!character.militantGear || character.militantGear.length === 0);
  }

  if (character.gear === 'spacesuit') {
    return false;
  }

  // Militant special rules
  if (character.aptitude === 'Militant') {
    // Militants carry a list of weapons/explosives. Let's initialize if not present.
    const militantGear = character.militantGear || [];
    
    // Can only carry one of each type of weapon/explosive
    if (newGear === 'medkit') {
      // Medkit is not a weapon/explosive, so standard 1-item rules or custom rules apply.
      // Usually medkits are single use and they can hold it if they don't have another medkit.
      return character.gear !== 'medkit';
    }

    // Weapon/explosive: check if already has this specific gear type
    const hasThisType = militantGear.includes(newGear) || character.gear === newGear;
    return !hasThisType;
  }

  // Standard character: must have empty gear slot
  return character.gear === null;
}

/**
 * Adds gear to character inventory.
 */
export function pickUpGear(character: Character, newGear: Gear): boolean {
  if (!canPickUpGear(character, newGear)) return false;

  if (character.aptitude === 'Militant' && newGear && newGear !== 'spacesuit' && newGear !== 'medkit') {
    if (!character.militantGear) {
      character.militantGear = [];
    }
    
    // Add to militant arsenal
    character.militantGear.push(newGear);

    // Sync primary gear field to one of the weapons
    if (!character.gear) {
      character.gear = newGear;
    }
    return true;
  }

  // Standard pickup
  character.gear = newGear;
  return true;
}

/**
 * Checks if character has a specific gear type equipped or in arsenal.
 */
export function hasGear(character: Character, gear: Gear): boolean {
  if (character.gear === gear) return true;

  if (character.aptitude === 'Militant' && character.militantGear) {
    return character.militantGear.includes(gear);
  }

  return false;
}

/**
 * Removes and discards gear from character inventory.
 */
export function discardGear(character: Character, gearToRemove: Gear): void {
  if (character.gear === gearToRemove) {
    character.gear = null;
  }

  if (character.aptitude === 'Militant' && character.militantGear) {
    character.militantGear = character.militantGear.filter(g => g !== gearToRemove);
    // Sync primary gear field to next available weapon, if any
    if (character.gear === null && character.militantGear.length > 0) {
      character.gear = character.militantGear[0];
    }
  }
}

/**
 * Destroys a weapon used in a bust.
 */
export function destroyWeapon(character: Character, weaponUsed: 'ranged_weapon' | 'melee_weapon'): void {
  discardGear(character, weaponUsed);
}

/**
 * Declares character types augmentation to support militantGear array dynamically.
 */
declare module './characterTypes' {
  interface Character {
    militantGear?: Gear[];
  }
}
