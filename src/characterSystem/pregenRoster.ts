import { Character } from './characterTypes';

export const PREGEN_ROSTER: Omit<Character, 'id' | 'isDead' | 'isAI' | 'roomId'>[] = [
  {
    name: 'Daklis Surn',
    concept: 'Heroic Captain',
    aptitude: 'Commander',
    gear: 'ranged_weapon',
    traits: [
      { name: 'Lead by Example', modifier: 3, exhausted: false, busted: false },
      { name: 'Inspiring Presence', modifier: 2, exhausted: false, busted: false },
      { name: 'Refuse to Fail', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.8,
      explorationDrive: 0.5,
      riskTolerance: 'balanced',
      gearPreferences: { medkit: 'altruistic', weapon: 'aggressive', explosive: 'cautious', spacesuit: 'altruistic' }
    }
  },
  {
    name: 'Morrin Kesh',
    concept: 'Logical First Mate',
    aptitude: 'Science',
    gear: 'spacesuit',
    traits: [
      { name: 'Analytical Mind', modifier: 3, exhausted: false, busted: false },
      { name: 'Cool Under Pressure', modifier: 2, exhausted: false, busted: false },
      { name: 'Emotionless Logic', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.5,
      explorationDrive: 0.8,
      riskTolerance: 'cautious',
      gearPreferences: { medkit: 'tactical', weapon: 'defensive', explosive: 'cautious', spacesuit: 'selfish' }
    }
  },
  {
    name: 'Brekon Cort',
    concept: 'Plucky Cadet',
    aptitude: 'Trainee',
    gear: null,
    traits: [
      { name: 'Dumb Luck', modifier: 3, exhausted: false, busted: false },
      { name: 'Eager to Please', modifier: 2, exhausted: false, busted: false },
      { name: 'Clumsy but Quick', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.2,
      explorationDrive: 0.9,
      riskTolerance: 'reckless',
      gearPreferences: { medkit: 'altruistic', weapon: 'aggressive', explosive: 'reckless', spacesuit: 'selfish' }
    }
  },
  {
    name: 'Rallas Riker',
    concept: 'Grumpy Engineer',
    aptitude: 'Engineer',
    gear: 'melee_weapon',
    traits: [
      { name: 'Percussive Maintenance', modifier: 3, exhausted: false, busted: false },
      { name: 'Seen it All Before', modifier: 2, exhausted: false, busted: false },
      { name: 'Stubborn as a Mule', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.7,
      explorationDrive: 0.3,
      riskTolerance: 'cautious',
      gearPreferences: { medkit: 'selfish', weapon: 'defensive', explosive: 'cautious', spacesuit: 'selfish' }
    }
  },
  {
    name: 'Cenvek Voss',
    concept: 'Bloodthirsty Warrior',
    aptitude: 'Militant',
    gear: 'melee_weapon',
    traits: [
      { name: 'Relentless Fury', modifier: 3, exhausted: false, busted: false },
      { name: 'Thick Skinned', modifier: 2, exhausted: false, busted: false },
      { name: 'Brawler', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.6,
      explorationDrive: 0.7,
      riskTolerance: 'reckless',
      gearPreferences: { medkit: 'selfish', weapon: 'aggressive', explosive: 'reckless', spacesuit: 'selfish' }
    }
  },
  {
    name: 'Yoron Jin',
    concept: 'Empathetic Counselor',
    aptitude: 'Counselor',
    gear: 'medkit',
    traits: [
      { name: 'Emotional Anchor', modifier: 3, exhausted: false, busted: false },
      { name: 'Deep Insight', modifier: 2, exhausted: false, busted: false },
      { name: 'Calming Voice', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.8,
      explorationDrive: 0.2,
      riskTolerance: 'cautious',
      gearPreferences: { medkit: 'altruistic', weapon: 'defensive', explosive: 'cautious', spacesuit: 'altruistic' }
    }
  },
  {
    name: 'X-R7 "Tevna"',
    concept: 'Depressed Android',
    aptitude: 'Android',
    gear: null,
    traits: [
      { name: 'Robotic Fortitude', modifier: 3, exhausted: false, busted: false },
      { name: 'Calculated Pessimism', modifier: 2, exhausted: false, busted: false },
      { name: 'Sacrificial Protocols', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.3,
      explorationDrive: 0.3,
      riskTolerance: 'balanced',
      gearPreferences: { medkit: 'altruistic', weapon: 'defensive', explosive: 'reckless', spacesuit: 'altruistic' }
    }
  },
  {
    name: 'Vespera Rey',
    concept: 'Matter of Fact Medic',
    aptitude: 'Medic',
    gear: 'medkit',
    traits: [
      { name: 'Steady Hands', modifier: 3, exhausted: false, busted: false },
      { name: 'Triage Prioritization', modifier: 2, exhausted: false, busted: false },
      { name: 'Clinical Detachment', modifier: 1, exhausted: false, busted: false }
    ],
    aiProfile: {
      crisisPropensity: 0.6,
      explorationDrive: 0.4,
      riskTolerance: 'cautious',
      gearPreferences: { medkit: 'tactical', weapon: 'defensive', explosive: 'cautious', spacesuit: 'altruistic' }
    }
  }
];
