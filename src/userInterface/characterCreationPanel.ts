import { showScreen } from '../starshipInfernum';
import { getSelectedScenario } from './scenarioSelectionPanel';
import { PREGEN_ROSTER } from '@characterSystem/pregenRoster';
import { createCharacter, createPregenCharacter } from '@characterSystem/characterFactory';
import { Character, AptitudeType, Gear } from '@characterSystem/characterTypes';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { koboldClient } from '@narrativeSystem/koboldCppClient';
import { renderCharacterCreationSlots } from './characterCreationSlotRenderer';
import { CrewSlotConfig } from './characterCreationSlotTypes';
import '@userInterface/tooltipManager'; // Import side-effects to initialize global tooltip listener

let slotConfigs: CrewSlotConfig[] = [createBlankCrewSlot()];

export function resetSlots(): void {
  slotConfigs = [createBlankCrewSlot()];
  renderSlots();
}

export function initCharacterCreationPanel(): void {
  const backBtn = document.getElementById('btn-char-back');
  const startBtn = document.getElementById('btn-start-game') as HTMLButtonElement | null;

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showScreen('scenario-selection-screen');
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const scenario = getSelectedScenario();
      if (!scenario) return;

      const crew: Character[] = [];
      for (const config of slotConfigs) {
        if (!config.pregenName) {
          console.warn('Cannot start: a character slot is unassigned.');
          return;
        }

        if (config.pregenName !== 'custom') {
          crew.push(createPregenCharacter(config.pregenName, config.isAI));
          continue;
        }

        crew.push(createCharacter({
          name: config.customName || 'Astronaut',
          concept: config.customConcept || 'Surveyor',
          aptitude: config.customAptitude,
          gear: config.customGear,
          traits: [
            createTrait(config.customTrait1Name || 'Resourceful', config.customTrait1Sign, 3),
            createTrait(config.customTrait2Name || 'Determined', config.customTrait2Sign, 2),
            createTrait(config.customTrait3Name || 'Quick Reflexes', config.customTrait3Sign, 1),
          ],
          isAI: config.isAI,
        }));
      }

      gameStateStore.initializeNewGame(scenario, crew);
      showScreen('game-screen');
    });
  }

  renderSlots();
}

function createBlankCrewSlot(): CrewSlotConfig {
  return {
    isAI: false,
    pregenName: '',
    customName: '',
    customConcept: '',
    customAptitude: 'Commander',
    customGear: null,
    customTrait1Name: 'Resourceful',
    customTrait1Sign: '+',
    customTrait2Name: 'Determined',
    customTrait2Sign: '+',
    customTrait3Name: 'Quick Reflexes',
    customTrait3Sign: '+',
  };
}

function createTrait(name: string, sign: '+' | '-', magnitude: number) {
  return {
    name,
    modifier: sign === '+' ? magnitude : -magnitude,
    exhausted: false,
    busted: false,
  };
}

function randomizeSlotConfig(slot: CrewSlotConfig): void {
  const firstSyllables = ['Ves', 'Dak', 'Kor', 'Nim', 'Zal', 'Tev', 'Brek', 'Ral', 'Cen', 'Mor', 'Jax', 'Quin', 'Yor', 'Zan'];
  const secondSyllables = ['rin', 'tar', 'las', 'na', 'to', 'vek', 'lis', 'dor', 'ka', 'th', 'on', 'us'];
  const lastNames = ['Obal', 'Kesh', 'Tarn', 'Riker', 'Drax', 'Surn', 'Voss', 'Bane', 'Cort', 'Rey', 'Jin'];
  const concepts = ['Rookie Pilot', 'Cynical Officer', 'Resourceful Scavenger', 'Hotshot Gunner', 'Absent-minded Tech', 'Stoic Guard', 'Paranoid Medic', 'Veteran Explorer', 'Systems Specialist', 'Quartermaster', 'Deckhand', 'Security Officer'];
  const aptitudes: AptitudeType[] = [
    'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
    'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
    'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee',
  ];
  const gearOptions: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];
  const traitPool1 = ['Lead by Example', 'Adrenaline Rush', 'Robotic Fortitude', 'Analytical Mind', 'Dumb Luck', 'Percussive Maintenance', 'Relentless Fury', 'Emotional Anchor', 'Steady Hands', 'Resourceful'];
  const traitPool2 = ['Determined', 'Observant', 'Inspiring Presence', 'Cool Under Pressure', 'Eager to Please', 'Seen it All Before', 'Thick Skinned', 'Deep Insight', 'Calculated Pessimism', 'Triage Prioritization'];
  const traitPool3 = ['Quick Reflexes', 'Agile', 'Refuse to Fail', 'Emotionless Logic', 'Clumsy but Quick', 'Stubborn as a Mule', 'Brawler', 'Calming Voice', 'Sacrificial Protocols', 'Clinical Detachment'];

  slot.pregenName = 'custom';
  slot.customName = `${pickRandom(firstSyllables)}${pickRandom(secondSyllables)} ${pickRandom(lastNames)}`;
  slot.customConcept = pickRandom(concepts);
  slot.customAptitude = pickRandom(aptitudes);
  slot.customGear = pickRandom(gearOptions);
  slot.customTrait1Name = pickRandom(traitPool1);
  slot.customTrait1Sign = Math.random() > 0.15 ? '+' : '-';
  slot.customTrait2Name = pickRandom(traitPool2);
  slot.customTrait2Sign = Math.random() > 0.15 ? '+' : '-';
  slot.customTrait3Name = pickRandom(traitPool3);
  slot.customTrait3Sign = Math.random() > 0.15 ? '+' : '-';
}

function pickRandom<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

async function generateNPCOnSlot(index: number): Promise<void> {
  const slot = slotConfigs[index];
  slot.isGenerating = true;
  renderSlots();

  const scenario = getSelectedScenario();
  const scenarioInfo = scenario
    ? `Scenario: "${scenario.name}". Backstory: "${scenario.backstory}"`
    : 'Setting: Doomed spaceship adrift in the void.';
  const existingCrewStr = describeOtherCrewForPrompt(index);
  let success = false;

  try {
    const connected = await koboldClient.checkHealth();
    if (connected) {
      const data = await requestGeneratedCrewMember(scenarioInfo, existingCrewStr);
      success = applyGeneratedCrewMember(slot, data);
    }
  } catch (err) {
    console.error('Failed to generate NPC using AI:', err);
  }

  if (!success) {
    console.log('Falling back to local random generator for NPC Slot', index + 1);
    randomizeSlotConfig(slot);
  }

  slot.isGenerating = false;
  renderSlots();
}

function describeOtherCrewForPrompt(index: number): string {
  const otherCrewList = slotConfigs
    .filter((_, idx) => idx !== index)
    .map((slot) => {
      if (slot.pregenName !== 'custom') {
        const template = PREGEN_ROSTER.find((p) => p.name === slot.pregenName);
        return template ? `${template.name} (${template.concept}, Aptitude: ${template.aptitude})` : '';
      }

      return `${slot.customName || 'Unknown'} (${slot.customConcept || 'Unknown'}, Aptitude: ${slot.customAptitude})`;
    })
    .filter(Boolean);

  return otherCrewList.length > 0
    ? otherCrewList.join(', ')
    : 'None yet (this is the first crew member).';
}

async function requestGeneratedCrewMember(scenarioInfo: string, existingCrewStr: string): Promise<any> {
  const prompt = `<|im_start|>system
You are a creative writer generating a unique crew member NPC co-pilot for the sci-fi survival game 'Starship Infernum'.
The current setting/scenario is: ${scenarioInfo}
The existing crew members are: ${existingCrewStr}

Generate a new, unique crew member that fits the scenario and complements the existing crew. Do not duplicate the concepts or names of existing crew members.
Do not use cliché AI-generated names (like Vance, Nova, Orion, Elara, Lyra). Invent unique, gritty sci-fi names.
Select a unique Aptitude from: Android, Armored, Commander, Counselor, Engineer, Medic, Militant, Psychic, Sanitation, Security, Shapeshifter, Science, Smuggler, Survivor, Trainee.
Select Starting Gear from: spacesuit, medkit, ranged_weapon, melee_weapon, explosives, or null.
Create 3 Traits: Trait 1 (modifier 3), Trait 2 (modifier 2), Trait 3 (modifier 1). Assign a positive or negative sign to each modifier based on the trait's nature.

You MUST respond ONLY with a raw JSON object matching this schema (do NOT wrap it in markdown code blocks, do NOT write any introduction or conclusion text):
{
  "name": "Full Name",
  "concept": "Short concept (e.g. Cynical Officer, Veteran Medic)",
  "aptitude": "Medic",
  "gear": "medkit",
  "traits": [
    {"name": "Steady Hands", "modifier": 3},
    {"name": "Clinical Detachment", "modifier": -2},
    {"name": "Cautious", "modifier": 1}
  ]
}
<|im_end|>
<|im_start|>user
Generate the crew member now.<|im_end|>
<|im_start|>assistant
`;

  const responseText = await koboldClient.generate(prompt, 300);
  console.log('AI Response for NPC generation:', responseText);
  return JSON.parse(extractJsonObject(responseText));
}

function extractJsonObject(responseText: string): string {
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines[0].startsWith('```')) lines.shift();
    if (lines[lines.length - 1].startsWith('```')) lines.pop();
    cleaned = lines.join('\n').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function applyGeneratedCrewMember(slot: CrewSlotConfig, data: any): boolean {
  if (!data.name || !data.concept || !data.aptitude || !Array.isArray(data.traits) || data.traits.length < 3) {
    return false;
  }

  const validAptitudes: AptitudeType[] = [
    'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
    'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
    'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee',
  ];
  const validGear: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];

  slot.pregenName = 'custom';
  slot.customName = data.name;
  slot.customConcept = data.concept;
  slot.customAptitude = validAptitudes.includes(data.aptitude) ? data.aptitude : 'Commander';
  slot.customGear = validGear.includes(data.gear) ? data.gear : null;
  slot.customTrait1Name = data.traits[0].name || 'Resourceful';
  slot.customTrait1Sign = data.traits[0].modifier < 0 ? '-' : '+';
  slot.customTrait2Name = data.traits[1].name || 'Determined';
  slot.customTrait2Sign = data.traits[1].modifier < 0 ? '-' : '+';
  slot.customTrait3Name = data.traits[2].name || 'Quick Reflexes';
  slot.customTrait3Sign = data.traits[2].modifier < 0 ? '-' : '+';
  return true;
}

function renderSlots(): void {
  renderCharacterCreationSlots(slotConfigs, generateNPCOnSlot);
}
