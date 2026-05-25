export const CrisisAdvanceFlavor: Record<string, string> = {
  'ALIEN_HORROR': 'You successfully barricade a ventilation shaft, restricting the Horror\'s movement and buying the crew some time.',
  'COLLISION_COURSE': 'You manage to manually override a thruster relay, slightly correcting the ship\'s fatal trajectory.',
  'CONTAMINATED': 'You synthesize a temporary suppressant, slowing the pathogen\'s spread through the crew.',
  'DEAD_SHIP': 'You successfully bypass a blown conduit, restoring a flicker of power to an essential sub-system.',
  'DIMENSIONAL_RIFT': 'You realign a localized gravity plating sector, temporarily stabilizing reality in this section.',
  'INVASION': 'You secure a heavy blast door, cutting off one of the invaders\' primary assault routes.',
  'MUTINY': 'You slice into the internal comms and lock out the mutineers, disrupting their coordination.'
};

export const CrisisResolvedFlavor: Record<string, string> = {
  'ALIEN_HORROR': 'The Alien Horror is finally cornered and flushed out the airlock. The nightmare is over.',
  'COLLISION_COURSE': 'The primary engines roar back to life, tearing the ship away from the star\'s deadly pull just in time!',
  'CONTAMINATED': 'The cure is successfully distributed through the life support system. The crew will survive.',
  'DEAD_SHIP': 'The main reactor ignites with a hum, and the ship\'s systems power up one by one. You are saved.',
  'DIMENSIONAL_RIFT': 'The dimensional drive is fully calibrated, snapping the ship back into your home reality.',
  'INVASION': 'The invaders are repelled and their boarding craft destroyed. The ship is yours once again.',
  'MUTINY': 'The mutiny is crushed, and the ringleaders are secured in the brig. Order is restored.'
};

export function getCrisisAdvanceText(crisisId: string, isMajor: boolean): string {
  if (isMajor && CrisisAdvanceFlavor[crisisId]) {
    return CrisisAdvanceFlavor[crisisId];
  }
  return 'You successfully resolve a step of the crisis, bringing the situation slightly more under control.';
}

export function getCrisisResolvedText(crisisId: string, isMajor: boolean): string {
  if (isMajor && CrisisResolvedFlavor[crisisId]) {
    return CrisisResolvedFlavor[crisisId];
  }
  return 'The crisis has been completely resolved. The ship breathes a sigh of relief.';
}
