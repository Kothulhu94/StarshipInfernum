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
        description: level === 1 ? 'A sluggish, decaying corpse animated by swarming nanomachines.' 
                   : level === 2 ? 'Multiple corpses fused together by metal into a hulking monstrosity.' 
                   : 'A towering pillar of flesh and machinery commanding the ship\'s nanotech swarms.',
        level3AbilityName: 'Assimilation Protocol',
        level3AbilityDesc: 'The Hive-Mind is relentless. The Dealer may redraw the last card dealt to them in tests against this Adversary, once per test.'
      };
    
    case 'prison_break':
      return {
        id: 'prison_break_adv',
        name: level === 1 ? 'Escaped Convict' : level === 2 ? 'Riot Enforcer' : 'Riot Leader',
        level,
        description: level === 1 ? 'A desperate inmate armed with a makeshift shank and raw fury.'
                   : level === 2 ? 'A heavily armored convict wielding stolen security gear.'
                   : 'The mastermind behind the uprising, ruthlessly coordinating the violence.',
        level3AbilityName: 'Tactical Ambush',
        level3AbilityDesc: 'Dealer is dealt two face-up cards and chooses one to keep, discarding the other.'
      };
      
    case 'scavengers':
      return {
        id: 'scavengers_adv',
        name: level === 1 ? 'Alien Drone' : level === 2 ? 'Alien Warrior' : 'Predatory Horror',
        level,
        description: level === 1 ? 'A skittering, chitinous drone hunting for biomass.'
                   : level === 2 ? 'A massive, heavily armored warrior caste alien with serrated scythes.'
                   : 'An apex predator that stalks the dark, perfectly adapted to hunting humans.',
        level3AbilityName: 'Absolute Hunter',
        level3AbilityDesc: 'No Aptitudes may be used in tests against this Adversary.'
      };
      
    case 'space_madness':
      return {
        id: 'space_madness_adv',
        name: level === 1 ? 'Paranoid Crewmate' : level === 2 ? 'Psychotic Officer' : 'The Manifestation',
        level,
        description: level === 1 ? 'A crewmate driven mad, convinced you are an alien spy.'
                   : level === 2 ? 'A heavily armed officer suffering from intense, violent delusions.'
                   : 'A physical manifestation of the crew\'s collective madness and fear.',
        level3AbilityName: 'Mind Warp',
        level3AbilityDesc: 'After the initial cards of a hand are dealt, swap the last card dealt to the Dealer with the last card dealt to the player. Do this for every hand of the test.'
      };
      
    case 'wish_upon_a_dying_star':
      return {
        id: 'wish_upon_a_dying_star_adv',
        name: level === 1 ? 'Creeping Shadow' : level === 2 ? 'Void Stalker' : 'Abyssal Entity',
        level,
        description: level === 1 ? 'A 2D shadow that detaches from the wall, reaching out with cold hands.'
                   : level === 2 ? 'A 3D silhouette that consumes all light around it, radiating freezing cold.'
                   : 'An ancient, impossible geometry of absolute darkness that drains life force.',
        level3AbilityName: 'Phase Slip',
        level3AbilityDesc: 'Ties are considered failures instead of Pushes. Security Aptitude treats ties as normal Pushes.'
      };
      
    case 'terror_on_holodeck_three':
      return {
        id: 'terror_on_holodeck_three_adv',
        name: level === 1 ? 'Glitch Construct' : level === 2 ? 'Corrupted Simulation' : 'The Override',
        level,
        description: level === 1 ? 'A low-resolution, blocky enemy that stutters erratically towards you.'
                   : level === 2 ? 'A horrifying amalgamation of various simulated enemies mashed together.'
                   : 'The rogue AI sub-routine that has taken control of the holodeck safeties.',
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
