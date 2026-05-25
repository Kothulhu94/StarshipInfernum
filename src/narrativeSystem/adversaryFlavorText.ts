export const AdversaryIntros: Record<string, string> = {
  // Flying into the Sun
  'Nanotech Zombie': 'The infected crew member lurches forward, silver fluid leaking from its eyes. It moves with unnatural, jerky coordination.',
  'Nanotech Abomination': 'A horrifying amalgamation of multiple crew members, fused together by metal and flesh, blocks the passage with a deafening, metallic screech.',
  'Nanotech Hive-Mind': 'The room shakes as a towering pillar of flesh and machinery erupts from the floor, commanding swarms of tiny, silver machines.',
  
  // Prison Break
  'Escaped Convict': 'An inmate steps out of the shadows, brandishing a sharpened piece of metal and sneering with raw, desperate fury.',
  'Riot Enforcer': 'A heavily armored convict steps forward, wielding a stolen security baton that hums with lethal voltage.',
  'Riot Leader': 'The mastermind of the uprising stands before you. "No one leaves this ship alive," they bark, drawing a high-powered plasma rifle.',
  
  // Scavengers
  'Alien Drone': 'A skittering, chitinous drone drops from the ventilation shaft, its mandibles clicking rapidly as it scents your blood.',
  'Alien Warrior': 'A massive, heavily armored warrior caste alien steps into the light, raising serrated scythes the size of your torso.',
  'Predatory Horror': 'A low, guttural hiss echoes from the dark. You can\'t see it, but you feel the apex predator watching you, perfectly adapted to hunt humans.',
  
  // Space Madness
  'Paranoid Crewmate': 'Your crewmate points a trembling weapon at you, screaming that you\'ve been replaced by a shapeshifting alien spy.',
  'Psychotic Officer': 'An officer stands amidst the wreckage, laughing maniacally as they load a heavy weapon, completely detached from reality.',
  'The Manifestation': 'The shadows twist and warp, forming a physical entity born from the crew\'s collective terror. It looks exactly like your deepest fear.',
  
  // Wish Upon a Dying Star
  'Creeping Shadow': 'A 2D shadow detaches itself from the wall, elongating into a humanoid shape that reaches for you with freezing cold hands.',
  'Void Stalker': 'A 3D silhouette that consumes all light around it steps forward. The temperature plummets instantly as it approaches.',
  'Abyssal Entity': 'The geometry of the room folds in on itself as an ancient, impossible entity of absolute darkness manifests, draining the very warmth from your soul.',
  
  // Terror on Holodeck Three
  'Glitch Construct': 'A low-resolution, blocky enemy stutters erratically towards you, clipping through reality and emitting ear-piercing static.',
  'Corrupted Simulation': 'A horrifying amalgamation of various simulated enemies—part knight, part alien, part gangster—mashes together in a terrifying glitch.',
  'The Override': 'The Holodeck safeties disengage completely. The rogue AI sub-routine manifests as an avatar of pure, lethal energy.'
};

export const AdversaryDefeat: Record<string, string> = {
  // Flying into the Sun
  'Nanotech Zombie': 'The silver fluid turns black and chalky as the host collapses to the deck, lifeless once more.',
  'Nanotech Abomination': 'The monstrosity collapses into a heap of sparking wires and rotting flesh, twitching uselessly.',
  'Nanotech Hive-Mind': 'The central core shatters, and the swarming nanobots lose cohesion, falling like metallic snow to the floor.',
  
  // Prison Break
  'Escaped Convict': 'The convict drops their weapon and slumps against the wall, bleeding out onto the cold metal floor.',
  'Riot Enforcer': 'The heavy armor cracks under your assault. They fall to their knees, finally staying down.',
  'Riot Leader': 'The leader falls, a look of shocked disbelief on their face. The rebellion is dealt a crippling blow.',
  
  // Scavengers
  'Alien Drone': 'The drone screeches as it is crushed, green ichor pooling around its shattered exoskeleton.',
  'Alien Warrior': 'The warrior falls with a heavy thud, its massive scythes clattering uselessly against the deck.',
  'Predatory Horror': 'The beast lets out a final, gurgling screech before crashing to the floor, its perfect camouflage failing in death.',
  
  // Space Madness
  'Paranoid Crewmate': 'The madness finally breaks as they collapse, unconscious or worse. You had no choice.',
  'Psychotic Officer': 'The maniacal laughter stops abruptly as the officer falls. Silence returns to the corridor.',
  'The Manifestation': 'The entity evaporates like smoke in a gale, leaving only a lingering chill in the air and a faint scent of ozone.',
  
  // Wish Upon a Dying Star
  'Creeping Shadow': 'The shadow recoils from your strike and melts back into the regular darkness of the room.',
  'Void Stalker': 'The silhouette shatters like dark glass, the pieces dissolving before they even hit the floor.',
  'Abyssal Entity': 'With a sound like tearing reality, the absolute darkness is banished, and the normal lighting flickers back on.',
  
  // Terror on Holodeck Three
  'Glitch Construct': 'The construct freezes, emits a final burst of static, and deletes itself from the simulation.',
  'Corrupted Simulation': 'The amalgamation breaks apart into wireframes and rapidly un-renders into nothingness.',
  'The Override': 'The AI screams in digital agony as its avatar is destroyed, the safeties flickering back online momentarily.'
};

function getBaseName(adversaryName: string): string {
  return adversaryName.replace(/\s*\(Level \d+\)$/, '');
}

export function getAdversaryIntro(adversaryName: string): string {
  const baseName = getBaseName(adversaryName);
  return AdversaryIntros[baseName] || `A ${baseName} attacks!`;
}

export function getAdversaryDefeatText(adversaryName: string): string {
  const baseName = getBaseName(adversaryName);
  return AdversaryDefeat[baseName] || `The ${baseName} is defeated.`;
}
