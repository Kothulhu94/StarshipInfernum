import { Character, Trait } from './characterTypes';

/**
 * Exhausts a trait by name. Returns true if successful, false if already exhausted or busted.
 */
export function exhaustTrait(character: Character, traitName: string): boolean {
  const trait = character.traits.find(t => t.name === traitName);
  if (trait && !trait.exhausted && !trait.busted) {
    trait.exhausted = true;
    return true;
  }
  return false;
}

/**
 * Recovers an exhausted trait by name. Busted traits cannot be recovered.
 */
export function recoverTrait(character: Character, traitName: string): boolean {
  const trait = character.traits.find(t => t.name === traitName);
  if (trait && trait.exhausted && !trait.busted) {
    trait.exhausted = false;
    return true;
  }
  return false;
}

/**
 * Recovers a single random exhausted (non-busted) trait, if any exist.
 * Returns the name of the recovered trait, or null.
 */
export function recoverRandomTrait(character: Character): string | null {
  const exhausted = character.traits.filter(t => t.exhausted && !t.busted);
  if (exhausted.length > 0) {
    const randomTrait = exhausted[Math.floor(Math.random() * exhausted.length)];
    randomTrait.exhausted = false;
    return randomTrait.name;
  }
  return null;
}

/**
 * Recovers all exhausted (non-busted) traits.
 */
export function recoverAllTraits(character: Character): void {
  for (const trait of character.traits) {
    if (!trait.busted) {
      trait.exhausted = false;
    }
  }
}

/**
 * Applies permanent damage to a trait, marking it as busted.
 * If traitName is specified, damages that specific trait.
 * Otherwise, damages the first available non-busted trait.
 * If no non-busted traits remain, marks the character as dead.
 * Returns the name of the damaged trait, or null.
 */
export function damageTrait(character: Character, traitName?: string): string | null {
  if (character.isDead) return null;

  let targetTrait: Trait | undefined;

  if (traitName) {
    targetTrait = character.traits.find(t => t.name === traitName && !t.busted);
  } else {
    // Find first non-busted trait
    targetTrait = character.traits.find(t => !t.busted);
  }

  if (targetTrait) {
    targetTrait.busted = true;
    targetTrait.exhausted = true; // Exhaust it as well
    
    // Check if any traits remain non-busted
    const hasRemainingTraits = character.traits.some(t => !t.busted);
    if (!hasRemainingTraits) {
      character.isDead = true;
    }

    return targetTrait.name;
  }

  // If no traits were found to damage, character is dead
  character.isDead = true;
  return null;
}
