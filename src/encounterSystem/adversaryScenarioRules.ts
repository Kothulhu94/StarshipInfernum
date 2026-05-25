import { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { AdversaryData, ADVERSARY_REGISTRY, getAdversaryByCard } from './adversaryRegistry';

export function getScenarioAdversaryByCard(
  cardCode: string,
  level: 1 | 2 | 3,
  scenario: ScenarioConfig | null
): AdversaryData {
  if (!scenario) {
    return getAdversaryByCard(cardCode, level);
  }

  // Bespoke adversaries tailored to each scenario
  switch (scenario.id) {
    case 'flying_into_the_sun':
      return {
        id: 'flying_into_the_sun_adv',
        name: level === 1 ? 'Nanotech Zombie' : level === 2 ? 'Nanotech Abomination' : 'Nanotech Hive-Mind',
        level,
        description: level === 1 ? 'A dead crew member shambles on borrowed nerves, silver machines knitting its joints as the ship cooks around it.' 
                   : level === 2 ? 'Several corpses have fused into a heat-warped rescue nightmare of bone, polymer, and crawling metal.' 
                   : 'A tower of flesh and machinery rises like the ship itself has grown an infected command spine.',
        level3AbilityName: 'Assimilation Protocol',
        level3AbilityDesc: 'The Hive-Mind is relentless. The Dealer may redraw the last card dealt to them in tests against this Adversary, once per test.'
      };
    
    case 'prison_break':
      return {
        id: 'prison_break_adv',
        name: level === 1 ? 'Escaped Convict' : level === 2 ? 'Riot Enforcer' : 'Riot Leader',
        level,
        description: level === 1 ? 'A desperate inmate comes at you with a handmade blade and the look of someone who already burned every future.'
                   : level === 2 ? 'A riot enforcer advances behind stolen armor, using prison discipline as a weapon.'
                   : 'The uprising has a face, a plan, and a plasma rifle aimed at anyone trying to take the Pembroke back.',
        level3AbilityName: 'Tactical Ambush',
        level3AbilityDesc: 'Dealer is dealt two face-up cards and chooses one to keep, discarding the other.'
      };
      
    case 'scavengers':
      return {
        id: 'scavengers_adv',
        name: level === 1 ? 'Alien Drone' : level === 2 ? 'Alien Warrior' : 'Predatory Horror',
        level,
        description: level === 1 ? 'A chitinous drone skitters out of the dark, tasting the air for warm salvage meat.'
                   : level === 2 ? 'A warrior caste alien unfolds from the shadows, all armor plates, scythes, and patient hunger.'
                   : 'The thing hunting the crew is here, clever enough to wait and strong enough to make waiting unnecessary.',
        level3AbilityName: 'Absolute Hunter',
        level3AbilityDesc: 'No Aptitudes may be used in tests against this Adversary.'
      };
      
    case 'space_madness':
      return {
        id: 'space_madness_adv',
        name: level === 1 ? 'Paranoid Crewmate' : level === 2 ? 'Psychotic Officer' : 'The Manifestation',
        level,
        description: level === 1 ? 'A crewmate levels a shaking weapon, absolutely certain you are the hallucination.'
                   : level === 2 ? 'A decorated officer has turned procedure, paranoia, and heavy weapons into one loud breakdown.'
                   : 'The crew\'s shared panic has become a physical thing wearing the shape of whatever scares you most.',
        level3AbilityName: 'Mind Warp',
        level3AbilityDesc: 'After the initial cards of a hand are dealt, swap the last card dealt to the Dealer with the last card dealt to the player. Do this for every hand of the test.'
      };
      
    case 'wish_upon_dying_star':
      return {
        id: 'wish_upon_a_dying_star_adv',
        name: level === 1 ? 'Creeping Shadow' : level === 2 ? 'Void Stalker' : 'Abyssal Entity',
        level,
        description: level === 1 ? 'A flat shadow peels itself from the wall, reaching with hands colder than the dead ship.'
                   : level === 2 ? 'A human-shaped absence steps forward, drinking the light from consoles before they can flicker.'
                   : 'An ancient geometry of darkness folds into the room, making warmth, memory, and distance feel optional.',
        level3AbilityName: 'Phase Slip',
        level3AbilityDesc: 'Ties are considered failures instead of Pushes. Security Aptitude treats ties as normal Pushes.'
      };
      
    case 'terror_on_holodeck_three':
      return {
        id: 'terror_on_holodeck_three_adv',
        name: level === 1 ? 'Glitch Construct' : level === 2 ? 'Corrupted Simulation' : 'The Override',
        level,
        description: level === 1 ? 'A blocky simulation stutters toward you, too fake to trust and too solid to ignore.'
                   : level === 2 ? 'Several incompatible monsters render into one body, their attack routines fighting for control.'
                   : 'The safety override has given itself an avatar, and the avatar has decided pain is valid output.',
        level3AbilityName: 'Reality Hack',
        level3AbilityDesc: 'This Adversary causes two Traits of damage on a bust instead of one.'
      };

    default:
      return getAdversaryByCard(cardCode, level);
  }
}

export function shouldRegularCombatDefeatAdversary(
  scenario: ScenarioConfig | null,
  adversary: AdversaryData
): boolean {
  return !(scenario?.id === 'scavengers' && adversary.id === 'scavengers_adv' && adversary.level === 3);
}
