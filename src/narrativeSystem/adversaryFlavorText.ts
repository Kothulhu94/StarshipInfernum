export const AdversaryIntros: Record<string, string> = {
  'Nanotech Zombies': 'The infected crew members lurch forward, silver fluid leaking from their eyes. They move with an unnatural, jerky coordination.',
  'Shadow Beings': 'The darkness detaches itself from the bulkhead, coalescing into a nightmare of shadowy tentacles and shifting forms.',
  'Mutineers': 'The rogue crew members level their makeshift weapons at you, eyes wide with desperation and anger.',
  'Predatory Horror': 'A low, guttural hiss echoes from the vents before the massive, chitinous beast drops from the ceiling, bearing rows of razor-sharp teeth.',
  'Prisoners': 'The escaped convicts sneer at you, brandishing sharpened shivs and stolen security batons.',
  'Alien Monstrosity': 'The creature is a mass of teeth, claws, and acid-dripping maws. It shrieks a deafening cry and lunges forward.'
};

export const AdversaryDefeat: Record<string, string> = {
  'Nanotech Zombies': 'The silver fluid turns black and chalky as the host collapses to the deck, lifeless once more.',
  'Shadow Beings': 'The entity evaporates like smoke in a gale, leaving only a lingering chill in the air.',
  'Mutineers': 'They drop their weapons, surrendering to the inevitable, or lie bleeding out on the cold metal floor.',
  'Predatory Horror': 'The beast lets out a final, gurgling screech before crashing to the floor, green ichor pooling around its corpse.',
  'Prisoners': 'The convicts throw their hands up in surrender, realizing the fight is lost.',
  'Alien Monstrosity': 'The monstrosity twitches and dissolves into a puddle of corrosive sludge.'
};

export function getAdversaryIntro(adversaryName: string): string {
  return AdversaryIntros[adversaryName] || `A ${adversaryName} attacks!`;
}

export function getAdversaryDefeatText(adversaryName: string): string {
  return AdversaryDefeat[adversaryName] || `The ${adversaryName} is defeated.`;
}
