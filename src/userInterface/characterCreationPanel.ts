import { showScreen } from '../starshipInfernum';
import { getSelectedScenario } from './scenarioSelectionPanel';
import { PREGEN_ROSTER } from '@characterSystem/pregenRoster';
import { createCharacter, createPregenCharacter } from '@characterSystem/characterFactory';
import { Character, AptitudeType, Gear, Trait } from '@characterSystem/characterTypes';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { koboldClient } from '@narrativeSystem/koboldCppClient';
import { escapeHtml, getAptitudeTooltipText, getTraitTooltipText, getGearTooltipText, TRAIT_REGISTRY } from '@characterSystem/traitRegistry';
import '@userInterface/tooltipManager'; // Import side-effects to initialize global tooltip listener

interface CrewSlotConfig {
  isAI: boolean;
  pregenName: string; // pregen name or 'custom'
  customName: string;
  customConcept: string;
  customAptitude: AptitudeType;
  customGear: Gear;
  customTrait1Name: string;
  customTrait1Sign: '+' | '-';
  customTrait2Name: string;
  customTrait2Sign: '+' | '-';
  customTrait3Name: string;
  customTrait3Sign: '+' | '-';
  isGenerating?: boolean;
}

let slotConfigs: CrewSlotConfig[] = [
  { 
    isAI: false, 
    pregenName: 'Alexis Vance', 
    customName: '', 
    customConcept: '', 
    customAptitude: 'Commander',
    customGear: null,
    customTrait1Name: 'Resourceful',
    customTrait1Sign: '+',
    customTrait2Name: 'Determined',
    customTrait2Sign: '+',
    customTrait3Name: 'Quick Reflexes',
    customTrait3Sign: '+'
  }
];

export function resetSlots(): void {
  slotConfigs = [
    { 
      isAI: false, 
      pregenName: 'Alexis Vance', 
      customName: '', 
      customConcept: '', 
      customAptitude: 'Commander',
      customGear: null,
      customTrait1Name: 'Resourceful',
      customTrait1Sign: '+',
      customTrait2Name: 'Determined',
      customTrait2Sign: '+',
      customTrait3Name: 'Quick Reflexes',
      customTrait3Sign: '+'
    }
  ];
  renderSlots();
}

export function initCharacterCreationPanel(): void {
  const container = document.getElementById('char-slots-container');
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
        if (config.pregenName !== 'custom') {
          crew.push(createPregenCharacter(config.pregenName, config.isAI));
        } else {
          // Custom character
          const trait1Mod = config.customTrait1Sign === '+' ? 3 : -3;
          const trait2Mod = config.customTrait2Sign === '+' ? 2 : -2;
          const trait3Mod = config.customTrait3Sign === '+' ? 1 : -1;

          const customChar = createCharacter({
            name: config.customName || 'Astronaut',
            concept: config.customConcept || 'Surveyor',
            aptitude: config.customAptitude,
            gear: config.customGear,
            traits: [
              { name: config.customTrait1Name || 'Resourceful', modifier: trait1Mod, exhausted: false, busted: false },
              { name: config.customTrait2Name || 'Determined', modifier: trait2Mod, exhausted: false, busted: false },
              { name: config.customTrait3Name || 'Quick Reflexes', modifier: trait3Mod, exhausted: false, busted: false }
            ],
            isAI: config.isAI
          });
          crew.push(customChar);
        }
      }

      gameStateStore.initializeNewGame(scenario, crew);
      showScreen('game-screen');
    });
  }

  renderSlots();
}

function randomizeSlotConfig(slot: CrewSlotConfig) {
  const firstNames = ['John', 'Sarah', 'Kaelen', 'Elena', 'Marcus', 'Li', 'Alistair', 'Nadia', 'Darius', 'Vesper', 'Aria', 'Kael', 'Lyra', 'Cassian', 'Nova', 'Zane', 'Talia', 'Jaxon', 'Kira', 'Valen'];
  const lastNames = ['Shepard', 'Riddick', 'Ripley', 'O\'Connor', 'Chen', 'Vance', 'Mercer', 'Cooper', 'Thorne', 'Aurelia', 'Stellar', 'Vortex', 'Quasar', 'Nebula', 'Nova', 'Void', 'Vega', 'Polaris', 'Orion', 'Sol'];
  const concepts = ['Rookie Pilot', 'Cynical Officer', 'Resourceful Scavenger', 'Hotshot Gunner', 'Absent-minded Tech', 'Stoic Guard', 'Paranoid Medic', 'Veteran Explorer', 'Systems Specialist', 'Quartermaster', 'Deckhand', 'Security Officer'];
  
  const aptitudes: AptitudeType[] = [
    'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
    'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
    'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee'
  ];

  const gearOptions: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];

  const traitPool1 = ['Lead by Example', 'Adrenaline Rush', 'Robotic Fortitude', 'Analytical Mind', 'Dumb Luck', 'Percussive Maintenance', 'Relentless Fury', 'Emotional Anchor', 'Steady Hands', 'Resourceful'];
  const traitPool2 = ['Determined', 'Observant', 'Inspiring Presence', 'Cool Under Pressure', 'Eager to Please', 'Seen it All Before', 'Thick Skinned', 'Deep Insight', 'Calculated Pessimism', 'Triage Prioritization'];
  const traitPool3 = ['Quick Reflexes', 'Agile', 'Refuse to Fail', 'Emotionless Logic', 'Clumsy but Quick', 'Stubborn as a Mule', 'Brawler', 'Calming Voice', 'Sacrificial Protocols', 'Clinical Detachment'];

  slot.pregenName = 'custom';
  slot.customName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  slot.customConcept = concepts[Math.floor(Math.random() * concepts.length)];
  slot.customAptitude = aptitudes[Math.floor(Math.random() * aptitudes.length)];
  slot.customGear = gearOptions[Math.floor(Math.random() * gearOptions.length)];
  slot.customTrait1Name = traitPool1[Math.floor(Math.random() * traitPool1.length)];
  slot.customTrait1Sign = Math.random() > 0.15 ? '+' : '-';
  slot.customTrait2Name = traitPool2[Math.floor(Math.random() * traitPool2.length)];
  slot.customTrait2Sign = Math.random() > 0.15 ? '+' : '-';
  slot.customTrait3Name = traitPool3[Math.floor(Math.random() * traitPool3.length)];
  slot.customTrait3Sign = Math.random() > 0.15 ? '+' : '-';
}

async function generateNPCOnSlot(index: number): Promise<void> {
  const slot = slotConfigs[index];
  slot.isGenerating = true;
  renderSlots();

  const scenario = getSelectedScenario();
  const scenarioInfo = scenario 
    ? `Scenario: "${scenario.name}". Backstory: "${scenario.backstory}"` 
    : 'Setting: Doomed spaceship adrift in the void.';

  // Gather details of other crew members for context
  const otherCrewList = slotConfigs
    .filter((_, idx) => idx !== index)
    .map(s => {
      if (s.pregenName !== 'custom') {
        const template = PREGEN_ROSTER.find(p => p.name === s.pregenName);
        return template ? `${template.name} (${template.concept}, Aptitude: ${template.aptitude})` : '';
      } else {
        return `${s.customName || 'Unknown'} (${s.customConcept || 'Unknown'}, Aptitude: ${s.customAptitude})`;
      }
    })
    .filter(Boolean);
  
  const existingCrewStr = otherCrewList.length > 0 
    ? otherCrewList.join(', ')
    : 'None yet (this is the first crew member).';

  let success = false;

  try {
    const connected = await koboldClient.checkHealth();
    if (connected) {
      const prompt = `<|im_start|>system
You are a creative writer generating a unique crew member NPC co-pilot for the sci-fi survival game 'Starship Infernum'.
The current setting/scenario is: ${scenarioInfo}
The existing crew members are: ${existingCrewStr}

Generate a new, unique crew member that fits the scenario and complements the existing crew. Do not duplicate the concepts or names of existing crew members.
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

      // Clean up markdown code blocks if any
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        cleaned = lines.join('\n').trim();
      }

      // Find first '{' and last '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const data = JSON.parse(cleaned);

      if (data.name && data.concept && data.aptitude && Array.isArray(data.traits) && data.traits.length >= 3) {
        slot.pregenName = 'custom';
        slot.customName = data.name;
        slot.customConcept = data.concept;
        
        // Validate Aptitude
        const validAptitudes: AptitudeType[] = [
          'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
          'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
          'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee'
        ];
        slot.customAptitude = validAptitudes.includes(data.aptitude) ? data.aptitude : 'Commander';

        // Validate Gear
        const validGear: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];
        slot.customGear = validGear.includes(data.gear) ? data.gear : null;

        // Populate traits
        slot.customTrait1Name = data.traits[0].name || 'Resourceful';
        slot.customTrait1Sign = data.traits[0].modifier < 0 ? '-' : '+';
        
        slot.customTrait2Name = data.traits[1].name || 'Determined';
        slot.customTrait2Sign = data.traits[1].modifier < 0 ? '-' : '+';

        slot.customTrait3Name = data.traits[2].name || 'Quick Reflexes';
        slot.customTrait3Sign = data.traits[2].modifier < 0 ? '-' : '+';

        success = true;
      }
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

function renderSlots(): void {
  const container = document.getElementById('char-slots-container');
  const startBtn = document.getElementById('btn-start-game') as HTMLButtonElement | null;
  if (!container) return;

  container.innerHTML = '';

  slotConfigs.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = `char-slot-card ${slot.isAI ? '' : 'char-slot-card--active'}`;

    // Options for pregen roster
    const pregenOptions = PREGEN_ROSTER.map(
      (p) => `<option value="${p.name}" ${slot.pregenName === p.name ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    // Option list for aptitudes
    const aptitudes: AptitudeType[] = [
      'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
      'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
      'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee'
    ];
    const aptitudeOptions = aptitudes.map(
      (a) => `<option value="${a}" ${slot.customAptitude === a ? 'selected' : ''}>${a}</option>`
    ).join('');

    // Option list for Gear
    const gearOptions = [
      { val: '', label: 'None' },
      { val: 'spacesuit', label: 'Spacesuit' },
      { val: 'medkit', label: 'MedKit' },
      { val: 'ranged_weapon', label: 'Ranged Weapon' },
      { val: 'melee_weapon', label: 'Melee Weapon' },
      { val: 'explosives', label: 'Explosives' }
    ].map(g => `<option value="${g.val}" ${slot.customGear === g.val ? 'selected' : ''}>${g.label}</option>`).join('');

    // Dynamic Traits Dropdown lists (excluding traits chosen in other dropdowns on the same slot)
    const knownTraits = Object.keys(TRAIT_REGISTRY);

    const t1Name = slot.customTrait1Name;
    const t2Name = slot.customTrait2Name;
    const t3Name = slot.customTrait3Name;

    const isT1Known = knownTraits.includes(t1Name);
    const isT2Known = knownTraits.includes(t2Name);
    const isT3Known = knownTraits.includes(t3Name);

    const selectedElsewhereForT1 = [
      isT2Known ? t2Name : null,
      isT3Known ? t3Name : null
    ].filter(Boolean) as string[];

    const selectedElsewhereForT2 = [
      isT1Known ? t1Name : null,
      isT3Known ? t3Name : null
    ].filter(Boolean) as string[];

    const selectedElsewhereForT3 = [
      isT1Known ? t1Name : null,
      isT2Known ? t2Name : null
    ].filter(Boolean) as string[];

    const trait1OptionsHtml = [
      ...knownTraits.filter(t => !selectedElsewhereForT1.includes(t)).map(t => 
        `<option value="${t}" ${t1Name === t ? 'selected' : ''}>${t}</option>`
      ),
      `<option value="custom" ${!isT1Known ? 'selected' : ''}>Custom...</option>`
    ].join('');

    const trait2OptionsHtml = [
      ...knownTraits.filter(t => !selectedElsewhereForT2.includes(t)).map(t => 
        `<option value="${t}" ${t2Name === t ? 'selected' : ''}>${t}</option>`
      ),
      `<option value="custom" ${!isT2Known ? 'selected' : ''}>Custom...</option>`
    ].join('');

    const trait3OptionsHtml = [
      ...knownTraits.filter(t => !selectedElsewhereForT3.includes(t)).map(t => 
        `<option value="${t}" ${t3Name === t ? 'selected' : ''}>${t}</option>`
      ),
      `<option value="custom" ${!isT3Known ? 'selected' : ''}>Custom...</option>`
    ].join('');

    // Build the preview area for pregens
    const conceptTooltip = `<strong>Concept</strong><br/>A short 2-3 word description defining your character's role and personality (e.g. 'Heroic Captain', 'Grumpy Engineer'). Used for flavor, roleplaying, and to provide context to the AI (Gemma 4) for generating custom narratives, dialogs, and flashbacks during gameplay.`;

    let pregenPreviewHtml = '';
    if (slot.pregenName !== 'custom') {
      const template = PREGEN_ROSTER.find(p => p.name === slot.pregenName);
      if (template) {
        const gearText = template.gear ? template.gear.replace('_', ' ') : 'None';
        const aptitudeTooltip = getAptitudeTooltipText(template.aptitude);
        const gearTooltip = getGearTooltipText(template.gear);
        const traitsBadges = template.traits.map(t => {
          const tooltip = getTraitTooltipText(t.name, t.modifier);
          return `<span class="pregen-preview__trait-badge" data-tooltip="${escapeHtml(tooltip)}">${t.name} (${t.modifier > 0 ? '+' : ''}${t.modifier})</span>`;
        }).join('');

        pregenPreviewHtml = `
          <div class="pregen-preview">
            <div class="pregen-preview__item">
              <span class="pregen-preview__label" style="cursor: help;" data-tooltip="${escapeHtml(conceptTooltip)}">Concept ⓘ</span>
              <span class="pregen-preview__val">${template.concept}</span>
            </div>
            <div class="pregen-preview__item">
              <span class="pregen-preview__label">Aptitude</span>
              <span class="pregen-preview__val" style="cursor: help; color: var(--color-alert-amber);" data-tooltip="${escapeHtml(aptitudeTooltip)}">${template.aptitude}</span>
            </div>
            <div class="pregen-preview__item">
              <span class="pregen-preview__label" style="cursor: help;" data-tooltip="${escapeHtml(gearTooltip)}">Starting Gear ⓘ</span>
              <span class="pregen-preview__val" style="text-transform: capitalize; cursor: help; color: var(--color-console-cyan-dim);" data-tooltip="${escapeHtml(gearTooltip)}">${gearText}</span>
            </div>
            <div class="pregen-preview__label" style="margin-top: 4px;">Traits (Hover for description)</div>
            <div class="pregen-preview__traits">
              ${traitsBadges}
            </div>
          </div>
        `;
      }
    }

    const currentAptitudeTooltip = getAptitudeTooltipText(slot.customAptitude);
    const currentGearTooltip = getGearTooltipText(slot.customGear);

    card.innerHTML = `
      <div class="char-slot-card__header">
        <span class="char-slot-card__title">Slot ${index + 1}</span>
        ${
          slotConfigs.length > 1
            ? `<button class="settings-button btn-remove-slot" data-index="${index}" style="margin: 0;">Remove</button>`
            : ''
        }
      </div>
      <div class="char-slot-card__body">
        <label class="settings-field__label" style="margin-bottom: 2px;">Character Template</label>
        <select class="char-slot-card__select sel-pregen" data-index="${index}">
          ${pregenOptions}
          <option value="custom" ${slot.pregenName === 'custom' ? 'selected' : ''}>Custom Character...</option>
        </select>
        
        ${pregenPreviewHtml}

        <div class="custom-editor" style="display: ${slot.pregenName === 'custom' ? 'flex' : 'none'}; margin-top: var(--space-xs); gap: var(--space-2xs); flex-direction: column;">
          <input type="text" placeholder="Name" class="char-slot-card__input inp-name" data-index="${index}" value="${slot.customName}" />
          <input type="text" placeholder="Concept (e.g. Grumpy Engineer)" class="char-slot-card__input inp-concept" data-index="${index}" value="${slot.customConcept}" data-tooltip="${escapeHtml(conceptTooltip)}" />
          
          <div style="display: flex; gap: var(--space-2xs); align-items: center;">
            <select class="char-slot-card__select sel-aptitude" data-index="${index}" style="flex: 1;" data-tooltip="${escapeHtml(currentAptitudeTooltip)}">
              ${aptitudeOptions}
            </select>
            <span style="cursor: help; color: var(--color-alert-amber); font-size: 14px;" data-tooltip="${escapeHtml(currentAptitudeTooltip)}">ⓘ</span>
          </div>

          <label class="settings-field__label" style="margin-top: var(--space-3xs); margin-bottom: 2px;">Starting Gear</label>
          <div style="display: flex; gap: var(--space-2xs); align-items: center;">
            <select class="char-slot-card__select sel-gear" data-index="${index}" style="flex: 1;" data-tooltip="${escapeHtml(currentGearTooltip)}">
              ${gearOptions}
            </select>
            <span style="cursor: help; color: var(--color-alert-amber); font-size: 14px;" data-tooltip="${escapeHtml(currentGearTooltip)}">ⓘ</span>
          </div>

          <div style="margin-top: var(--space-xs); display: flex; flex-direction: column; gap: var(--space-xs);">
            <label class="settings-field__label" style="margin-bottom: 0;" data-tooltip="Modifiers are assigned dynamically: first trait adjusts by 3, second by 2, third by 1. Use the sign button to toggle positive/negative modifier.">Traits Setup (Hover for details) ⓘ</label>
            
            <!-- Trait 1 -->
            <div class="custom-editor__trait-container" style="display: flex; flex-direction: column; gap: var(--space-3xs);">
              <div class="custom-editor__trait-row">
                <select class="char-slot-card__select sel-trait1-dropdown" data-index="${index}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait1Name || 'Trait 1', slot.customTrait1Sign === '+' ? 3 : -3))}">
                  ${trait1OptionsHtml}
                </select>
                <button class="custom-editor__btn-sign btn-trait1-sign ${slot.customTrait1Sign === '-' ? 'custom-editor__btn-sign--negative' : ''}" data-index="${index}" data-tooltip="Click to toggle positive (+3) or negative (-3) modifier.">
                  3 (${slot.customTrait1Sign})
                </button>
              </div>
              ${!isT1Known ? `
                <input type="text" placeholder="Custom Trait 1 Name" class="char-slot-card__input inp-trait1-custom" data-index="${index}" value="${t1Name}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait1Name || 'Custom Trait', slot.customTrait1Sign === '+' ? 3 : -3))}" />
              ` : ''}
            </div>

            <!-- Trait 2 -->
            <div class="custom-editor__trait-container" style="display: flex; flex-direction: column; gap: var(--space-3xs);">
              <div class="custom-editor__trait-row">
                <select class="char-slot-card__select sel-trait2-dropdown" data-index="${index}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait2Name || 'Trait 2', slot.customTrait2Sign === '+' ? 2 : -2))}">
                  ${trait2OptionsHtml}
                </select>
                <button class="custom-editor__btn-sign btn-trait2-sign ${slot.customTrait2Sign === '-' ? 'custom-editor__btn-sign--negative' : ''}" data-index="${index}" data-tooltip="Click to toggle positive (+2) or negative (-2) modifier.">
                  2 (${slot.customTrait2Sign})
                </button>
              </div>
              ${!isT2Known ? `
                <input type="text" placeholder="Custom Trait 2 Name" class="char-slot-card__input inp-trait2-custom" data-index="${index}" value="${t2Name}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait2Name || 'Custom Trait', slot.customTrait2Sign === '+' ? 2 : -2))}" />
              ` : ''}
            </div>

            <!-- Trait 3 -->
            <div class="custom-editor__trait-container" style="display: flex; flex-direction: column; gap: var(--space-3xs);">
              <div class="custom-editor__trait-row">
                <select class="char-slot-card__select sel-trait3-dropdown" data-index="${index}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait3Name || 'Trait 3', slot.customTrait3Sign === '+' ? 1 : -1))}">
                  ${trait3OptionsHtml}
                </select>
                <button class="custom-editor__btn-sign btn-trait3-sign ${slot.customTrait3Sign === '-' ? 'custom-editor__btn-sign--negative' : ''}" data-index="${index}" data-tooltip="Click to toggle positive (+1) or negative (-1) modifier.">
                  1 (${slot.customTrait3Sign})
                </button>
              </div>
              ${!isT3Known ? `
                <input type="text" placeholder="Custom Trait 3 Name" class="char-slot-card__input inp-trait3-custom" data-index="${index}" value="${t3Name}" data-tooltip="${escapeHtml(getTraitTooltipText(slot.customTrait3Name || 'Custom Trait', slot.customTrait3Sign === '+' ? 1 : -1))}" />
              ` : ''}
            </div>
          </div>
        </div>

        <label class="char-slot-card__checkbox-label">
          <input type="checkbox" class="char-slot-card__checkbox chk-ai" data-index="${index}" ${slot.isAI ? 'checked' : ''} />
          <span>AI Co-pilot</span>
        </label>

        ${
          slot.isAI 
            ? `
            <button class="settings-button btn-generate-npc" data-index="${index}" ${slot.isGenerating ? 'disabled' : ''}>
              ${slot.isGenerating ? '<span class="spinner"></span> Generating NPC...' : '🤖 Generate NPC Details'}
            </button>
            `
            : ''
        }
      </div>
    `;

    container.appendChild(card);
  });

  // Render "Add Crew Member" card if < 6
  if (slotConfigs.length < 6) {
    const addCard = document.createElement('div');
    addCard.className = 'char-slot-card';
    addCard.style.borderStyle = 'dashed';
    addCard.style.cursor = 'pointer';
    addCard.style.display = 'flex';
    addCard.style.alignItems = 'center';
    addCard.style.justifyContent = 'center';
    addCard.style.minHeight = '180px';
    addCard.innerHTML = `
      <span style="font-family: var(--font-display); font-size: var(--font-size-md); color: var(--color-text-muted);">+ Add Crew Member</span>
    `;
    addCard.addEventListener('click', () => {
      const templateName = PREGEN_ROSTER[slotConfigs.length % PREGEN_ROSTER.length].name;
      slotConfigs.push({
        isAI: false,
        pregenName: templateName,
        customName: '',
        customConcept: '',
        customAptitude: 'Commander',
        customGear: null,
        customTrait1Name: 'Resourceful',
        customTrait1Sign: '+',
        customTrait2Name: 'Determined',
        customTrait2Sign: '+',
        customTrait3Name: 'Quick Reflexes',
        customTrait3Sign: '+'
      });
      renderSlots();
    });
    container.appendChild(addCard);
  }

  // Bind event listeners to slot inputs
  container.querySelectorAll('.sel-pregen').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      const val = (e.target as HTMLSelectElement).value;
      slotConfigs[idx].pregenName = val;
      renderSlots();
    });
  });

  container.querySelectorAll('.inp-name').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customName = (e.target as HTMLInputElement).value;
    });
  });

  container.querySelectorAll('.inp-concept').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customConcept = (e.target as HTMLInputElement).value;
    });
  });

  container.querySelectorAll('.sel-aptitude').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customAptitude = (e.target as HTMLSelectElement).value as AptitudeType;
      // Re-render so info icon and tooltip get updated
      renderSlots();
    });
  });

  container.querySelectorAll('.sel-gear').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      const val = (e.target as HTMLSelectElement).value;
      slotConfigs[idx].customGear = val ? val as Gear : null;
      renderSlots(); // Re-render so gear tooltip updates immediately
    });
  });

  // Trait 1 Select change
  container.querySelectorAll('.sel-trait1-dropdown').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      const val = (e.target as HTMLSelectElement).value;
      if (val === 'custom') {
        slotConfigs[idx].customTrait1Name = 'Custom Trait 1';
      } else {
        slotConfigs[idx].customTrait1Name = val;
      }
      renderSlots();
    });
  });

  // Trait 2 Select change
  container.querySelectorAll('.sel-trait2-dropdown').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      const val = (e.target as HTMLSelectElement).value;
      if (val === 'custom') {
        slotConfigs[idx].customTrait2Name = 'Custom Trait 2';
      } else {
        slotConfigs[idx].customTrait2Name = val;
      }
      renderSlots();
    });
  });

  // Trait 3 Select change
  container.querySelectorAll('.sel-trait3-dropdown').forEach((select) => {
    select.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      const val = (e.target as HTMLSelectElement).value;
      if (val === 'custom') {
        slotConfigs[idx].customTrait3Name = 'Custom Trait 3';
      } else {
        slotConfigs[idx].customTrait3Name = val;
      }
      renderSlots();
    });
  });

  // Custom trait name input listeners
  container.querySelectorAll('.inp-trait1-custom').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait1Name = (e.target as HTMLInputElement).value;
    });
    input.addEventListener('blur', () => {
      renderSlots(); // Re-render on blur to update tooltips without breaking typing focus
    });
  });

  container.querySelectorAll('.inp-trait2-custom').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait2Name = (e.target as HTMLInputElement).value;
    });
    input.addEventListener('blur', () => {
      renderSlots();
    });
  });

  container.querySelectorAll('.inp-trait3-custom').forEach((input) => {
    input.addEventListener('input', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait3Name = (e.target as HTMLInputElement).value;
    });
    input.addEventListener('blur', () => {
      renderSlots();
    });
  });

  // Toggle trait modifier signs
  container.querySelectorAll('.btn-trait1-sign').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait1Sign = slotConfigs[idx].customTrait1Sign === '+' ? '-' : '+';
      renderSlots();
    });
  });
  container.querySelectorAll('.btn-trait2-sign').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait2Sign = slotConfigs[idx].customTrait2Sign === '+' ? '-' : '+';
      renderSlots();
    });
  });
  container.querySelectorAll('.btn-trait3-sign').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].customTrait3Sign = slotConfigs[idx].customTrait3Sign === '+' ? '-' : '+';
      renderSlots();
    });
  });

  container.querySelectorAll('.chk-ai').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs[idx].isAI = (e.target as HTMLInputElement).checked;
      renderSlots();
    });
  });

  container.querySelectorAll('.btn-remove-slot').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      slotConfigs.splice(idx, 1);
      renderSlots();
    });
  });

  // Wire up Generate NPC button
  container.querySelectorAll('.btn-generate-npc').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      generateNPCOnSlot(idx);
    });
  });

  // Enable Start button if configurations are valid
  if (startBtn) {
    startBtn.disabled = slotConfigs.length === 0;
  }
}
