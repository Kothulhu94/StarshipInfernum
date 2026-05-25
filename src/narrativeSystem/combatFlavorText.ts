import { getScenarioAdversaryByCard } from '@encounterSystem/adversaryScenarioRules';

export const AdversaryCombatAdvantage: Record<string, string> = {
  // Flying into the Sun
  'Nanotech Zombie': 'The zombie thrashes wildly, overwhelming your defenses with its unnatural strength!',
  'Nanotech Abomination': 'The abomination\'s extra limbs strike out unpredictably, putting you on the back foot!',
  'Nanotech Hive-Mind': 'A sudden surge of the nanite swarm pushes you back, blinding your vision!',
  
  // Prison Break
  'Escaped Convict': 'The convict lunges aggressively, swinging their makeshift shank and forcing you back!',
  'Riot Enforcer': 'The enforcer bashes you with their shield, pressing the attack with ruthless efficiency!',
  'Riot Leader': 'The leader anticipates your move, countering with a punishing blow that leaves you reeling!',
  
  // Scavengers
  'Alien Drone': 'The drone skitters along the walls, diving at you from a blind spot!',
  'Alien Warrior': 'The warrior\'s massive scythes crash down, shattering your cover and driving you back!',
  'Predatory Horror': 'It strikes from the shadows, a blurring fast attack that throws you off balance!',
  
  // Space Madness
  'Paranoid Crewmate': 'They scream accusations while unleashing a frantic barrage of fire, pinning you down!',
  'Psychotic Officer': 'The officer laughs maniacally as their precise shots force you to scramble for cover!',
  'The Manifestation': 'The horrific entity warps your perception, striking when you are most disoriented!',
  
  // Wish Upon a Dying Star
  'Creeping Shadow': 'The shadow elongates, wrapping around your limbs and chilling you to the bone!',
  'Void Stalker': 'Absolute darkness surrounds you as the stalker lands a devastating, unseen blow!',
  'Abyssal Entity': 'The entity distorts gravity itself, slamming you against the bulkhead violently!',
  
  // Terror on Holodeck Three
  'Glitch Construct': 'The construct stutters through your attack and materializes right in front of you, striking hard!',
  'Corrupted Simulation': 'The simulation twists into a nightmare, overwhelming your senses as it attacks!',
  'The Override': 'The AI predicts your exact pattern, delivering a flawless and brutal counterattack!'
};

export const AdversaryCombatHit: Record<string, string> = {
  // Flying into the Sun
  'Nanotech Zombie': 'You land a solid blow, shattering the zombie\'s metallic plating and black fluid sprays!',
  'Nanotech Abomination': 'You exploit a gap in its mismatched limbs, striking a critical joint!',
  'Nanotech Hive-Mind': 'Your attack disrupts the central column, causing the swarm to temporarily lose cohesion!',
  
  // Prison Break
  'Escaped Convict': 'You sidestep their wild swing and land a punishing strike of your own!',
  'Riot Enforcer': 'You slip past their heavy shield and score a solid hit on their unarmored side!',
  'Riot Leader': 'You outmaneuver the leader, striking them hard enough to wipe the smirk off their face!',
  
  // Scavengers
  'Alien Drone': 'You crush the drone\'s chitinous armor with a well-timed counterattack!',
  'Alien Warrior': 'You duck under its massive scythes and strike a vulnerable spot between its armor plates!',
  'Predatory Horror': 'You anticipate its leap from the shadows and land a devastating blow as it lands!',
  
  // Space Madness
  'Paranoid Crewmate': 'You manage to disarm and strike them, momentarily breaking through their delusion!',
  'Psychotic Officer': 'You return fire with superior accuracy, hitting them squarely and silencing their laughter!',
  'The Manifestation': 'You push through the terror and strike true, causing the entity to flicker and recoil!',
  
  // Wish Upon a Dying Star
  'Creeping Shadow': 'Your strike passes through the shadow, but the intense energy of the blow forces it to retreat!',
  'Void Stalker': 'You aim into the heart of the darkness and land a hit, hearing a cold, unnatural shriek!',
  'Abyssal Entity': 'You focus your strike on the center of the distortion, momentarily stabilizing reality and harming the entity!',
  
  // Terror on Holodeck Three
  'Glitch Construct': 'Your attack causes the construct to violently stutter, exposing its wireframe!',
  'Corrupted Simulation': 'You shatter the simulated reality, forcing the amalgamation to lose its structure temporarily!',
  'The Override': 'You bypass its predictive algorithms and land a hit that causes sparks and errors to cascade!'
};

export const AdversaryCombatStalemate: Record<string, string> = {
  // Generic but thematic stalemates
  'default': 'You lock weapons in a desperate struggle, neither side giving an inch!'
};

function getBaseName(adversaryName: string): string {
  return adversaryName.replace(/\s*\(Level \d+\)$/, '');
}

export function getAdversaryAdvantageText(adversaryName: string): string {
  const baseName = getBaseName(adversaryName);
  return AdversaryCombatAdvantage[baseName] || `${baseName} gains the upper hand!`;
}

export function getAdversaryHitText(adversaryName: string): string {
  const baseName = getBaseName(adversaryName);
  return AdversaryCombatHit[baseName] || `You strike the ${baseName} hard!`;
}

export function getAdversaryStalemateText(adversaryName: string): string {
  const baseName = getBaseName(adversaryName);
  return AdversaryCombatStalemate[baseName] || AdversaryCombatStalemate['default'];
}
