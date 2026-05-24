import { Character } from './characterTypes';

export const PREGEN_ROSTER: Omit<Character, 'id' | 'isDead' | 'isAI'>[] = [
  {
    name: 'Alexis Vance',
    concept: 'Heroic Captain',
    aptitude: 'Commander',
    gear: 'ranged_weapon',
    traits: [
      { name: 'Lead by Example', modifier: 3, exhausted: false, busted: false },
      { name: 'Inspiring Presence', modifier: 2, exhausted: false, busted: false },
      { name: 'Refuse to Fail', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Zarek Tor',
    concept: 'Logical First Mate',
    aptitude: 'Science',
    gear: 'spacesuit',
    traits: [
      { name: 'Analytical Mind', modifier: 3, exhausted: false, busted: false },
      { name: 'Cool Under Pressure', modifier: 2, exhausted: false, busted: false },
      { name: 'Emotionless Logic', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Billy Cooper',
    concept: 'Plucky Cadet',
    aptitude: 'Trainee',
    gear: null,
    traits: [
      { name: 'Dumb Luck', modifier: 3, exhausted: false, busted: false },
      { name: 'Eager to Please', modifier: 2, exhausted: false, busted: false },
      { name: 'Clumsy but Quick', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Mac McConnely',
    concept: 'Grumpy Engineer',
    aptitude: 'Engineer',
    gear: 'melee_weapon',
    traits: [
      { name: 'Percussive Maintenance', modifier: 3, exhausted: false, busted: false },
      { name: 'Seen it All Before', modifier: 2, exhausted: false, busted: false },
      { name: 'Stubborn as a Mule', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Jax Thorne',
    concept: 'Bloodthirsty Warrior',
    aptitude: 'Militant',
    gear: 'melee_weapon',
    traits: [
      { name: 'Relentless Fury', modifier: 3, exhausted: false, busted: false },
      { name: 'Thick Skinned', modifier: 2, exhausted: false, busted: false },
      { name: 'Brawler', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Celeste Aurelia',
    concept: 'Empathetic Counselor',
    aptitude: 'Counselor',
    gear: 'medkit',
    traits: [
      { name: 'Emotional Anchor', modifier: 3, exhausted: false, busted: false },
      { name: 'Deep Insight', modifier: 2, exhausted: false, busted: false },
      { name: 'Calming Voice', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'M.E.L.V.I.N.',
    concept: 'Depressed Android',
    aptitude: 'Android',
    gear: null,
    traits: [
      { name: 'Robotic Fortitude', modifier: 3, exhausted: false, busted: false },
      { name: 'Calculated Pessimism', modifier: 2, exhausted: false, busted: false },
      { name: 'Sacrificial Protocols', modifier: 1, exhausted: false, busted: false }
    ]
  },
  {
    name: 'Angela Mercer',
    concept: 'Matter of Fact Medic',
    aptitude: 'Medic',
    gear: 'medkit',
    traits: [
      { name: 'Steady Hands', modifier: 3, exhausted: false, busted: false },
      { name: 'Triage Prioritization', modifier: 2, exhausted: false, busted: false },
      { name: 'Clinical Detachment', modifier: 1, exhausted: false, busted: false }
    ]
  }
];
