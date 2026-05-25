import { PREGEN_ROSTER } from '@characterSystem/pregenRoster';
import { AptitudeType, Gear } from '@characterSystem/characterTypes';
import {
  TRAIT_REGISTRY,
  escapeHtml,
  getAptitudeTooltipText,
  getGearTooltipText,
  getTraitTooltipText,
} from '@characterSystem/traitRegistry';
import { CrewSlotConfig } from './characterCreationSlotTypes';

const CHARACTER_CONCEPT_TOOLTIP = `<strong>Concept</strong><br/>A short 2-3 word description defining your character's role and personality (e.g. 'Heroic Captain', 'Grumpy Engineer'). Used for flavor, roleplaying, and to provide context to the AI (Gemma 4) for generating custom narratives, dialogs, and flashbacks during gameplay.`;

const APTITUDES: AptitudeType[] = [
  'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
  'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
  'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee',
];

const GEAR_OPTIONS: Array<{ val: string; label: string }> = [
  { val: '', label: 'None' },
  { val: 'spacesuit', label: 'Spacesuit' },
  { val: 'medkit', label: 'MedKit' },
  { val: 'ranged_weapon', label: 'Ranged Weapon' },
  { val: 'melee_weapon', label: 'Melee Weapon' },
  { val: 'explosives', label: 'Explosives' },
];

export function renderCharacterCreationSlots(
  slotConfigs: CrewSlotConfig[],
  generateNPCOnSlot: (index: number) => void
): void {
  const container = document.getElementById('char-slots-container');
  const startBtn = document.getElementById('btn-start-game') as HTMLButtonElement | null;
  if (!container) return;

  const rerender = () => renderCharacterCreationSlots(slotConfigs, generateNPCOnSlot);
  container.innerHTML = '';

  slotConfigs.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = `char-slot-card ${slot.isAI ? '' : 'char-slot-card--active'}`;
    card.innerHTML = buildSlotCardHtml(slotConfigs, slot, index);
    container.appendChild(card);
  });

  if (slotConfigs.length < 6) {
    container.appendChild(createAddCrewCard(slotConfigs, rerender));
  }

  bindSlotInputEvents(container, slotConfigs, rerender, generateNPCOnSlot);

  if (startBtn) {
    startBtn.disabled = slotConfigs.length === 0 || slotConfigs.some((slot) => !slot.pregenName);
  }
}

function buildSlotCardHtml(
  slotConfigs: CrewSlotConfig[],
  slot: CrewSlotConfig,
  index: number
): string {
  const pregenOptions = `
    <option value="" disabled ${!slot.pregenName ? 'selected' : ''}>-- Choose Character --</option>
    ${PREGEN_ROSTER.map(
      (p) => `<option value="${p.name}" ${slot.pregenName === p.name ? 'selected' : ''}>${p.name}</option>`
    ).join('')}
  `;
  const aptitudeOptions = APTITUDES.map(
    (a) => `<option value="${a}" ${slot.customAptitude === a ? 'selected' : ''}>${a}</option>`
  ).join('');
  const gearOptions = GEAR_OPTIONS.map(
    (g) => `<option value="${g.val}" ${slot.customGear === g.val ? 'selected' : ''}>${g.label}</option>`
  ).join('');
  const traitOptions = buildTraitOptionHtml(slot);
  const pregenPreviewHtml = buildPregenPreviewHtml(slot);
  const currentAptitudeTooltip = getAptitudeTooltipText(slot.customAptitude);
  const currentGearTooltip = getGearTooltipText(slot.customGear);

  return `
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
      ${buildCustomEditorHtml(slot, index, aptitudeOptions, gearOptions, traitOptions, currentAptitudeTooltip, currentGearTooltip)}

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
}

function buildTraitOptionHtml(slot: CrewSlotConfig): [string, string, string] {
  const knownTraits = Object.keys(TRAIT_REGISTRY);
  const t1Name = slot.customTrait1Name;
  const t2Name = slot.customTrait2Name;
  const t3Name = slot.customTrait3Name;
  const isT1Known = knownTraits.includes(t1Name);
  const isT2Known = knownTraits.includes(t2Name);
  const isT3Known = knownTraits.includes(t3Name);

  return [
    buildTraitSelectOptions(knownTraits, t1Name, [isT2Known ? t2Name : null, isT3Known ? t3Name : null], isT1Known),
    buildTraitSelectOptions(knownTraits, t2Name, [isT1Known ? t1Name : null, isT3Known ? t3Name : null], isT2Known),
    buildTraitSelectOptions(knownTraits, t3Name, [isT1Known ? t1Name : null, isT2Known ? t2Name : null], isT3Known),
  ];
}

function buildTraitSelectOptions(
  knownTraits: string[],
  selectedTrait: string,
  excludedTraits: Array<string | null>,
  isSelectedKnown: boolean
): string {
  const excluded = excludedTraits.filter(Boolean) as string[];
  return [
    ...knownTraits
      .filter((trait) => !excluded.includes(trait))
      .map((trait) => `<option value="${trait}" ${selectedTrait === trait ? 'selected' : ''}>${trait}</option>`),
    `<option value="custom" ${!isSelectedKnown ? 'selected' : ''}>Custom...</option>`,
  ].join('');
}

function buildPregenPreviewHtml(slot: CrewSlotConfig): string {
  if (slot.pregenName === 'custom') return '';

  const template = PREGEN_ROSTER.find((p) => p.name === slot.pregenName);
  if (!template) return '';

  const gearText = template.gear ? template.gear.replace('_', ' ') : 'None';
  const aptitudeTooltip = getAptitudeTooltipText(template.aptitude);
  const gearTooltip = getGearTooltipText(template.gear);
  const traitsBadges = template.traits.map((trait) => {
    const tooltip = getTraitTooltipText(trait.name, trait.modifier);
    return `<span class="pregen-preview__trait-badge" data-tooltip="${escapeHtml(tooltip)}">${trait.name} (${trait.modifier > 0 ? '+' : ''}${trait.modifier})</span>`;
  }).join('');

  return `
    <div class="pregen-preview">
      <div class="pregen-preview__item">
        <span class="pregen-preview__label" style="cursor: help;" data-tooltip="${escapeHtml(CHARACTER_CONCEPT_TOOLTIP)}">Concept ⓘ</span>
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

function buildCustomEditorHtml(
  slot: CrewSlotConfig,
  index: number,
  aptitudeOptions: string,
  gearOptions: string,
  traitOptions: [string, string, string],
  aptitudeTooltip: string,
  gearTooltip: string
): string {
  const traitKnown = [
    Object.hasOwn(TRAIT_REGISTRY, slot.customTrait1Name),
    Object.hasOwn(TRAIT_REGISTRY, slot.customTrait2Name),
    Object.hasOwn(TRAIT_REGISTRY, slot.customTrait3Name),
  ];

  return `
    <div class="custom-editor" style="display: ${slot.pregenName === 'custom' ? 'flex' : 'none'}; margin-top: var(--space-xs); gap: var(--space-2xs); flex-direction: column;">
      <input type="text" placeholder="Name" class="char-slot-card__input inp-name" data-index="${index}" value="${slot.customName}" />
      <input type="text" placeholder="Concept (e.g. Grumpy Engineer)" class="char-slot-card__input inp-concept" data-index="${index}" value="${slot.customConcept}" data-tooltip="${escapeHtml(CHARACTER_CONCEPT_TOOLTIP)}" />
      <div style="display: flex; gap: var(--space-2xs); align-items: center;">
        <select class="char-slot-card__select sel-aptitude" data-index="${index}" style="flex: 1;" data-tooltip="${escapeHtml(aptitudeTooltip)}">
          ${aptitudeOptions}
        </select>
        <span style="cursor: help; color: var(--color-alert-amber); font-size: 14px;" data-tooltip="${escapeHtml(aptitudeTooltip)}">ⓘ</span>
      </div>
      <label class="settings-field__label" style="margin-top: var(--space-3xs); margin-bottom: 2px;">Starting Gear</label>
      <div style="display: flex; gap: var(--space-2xs); align-items: center;">
        <select class="char-slot-card__select sel-gear" data-index="${index}" style="flex: 1;" data-tooltip="${escapeHtml(gearTooltip)}">
          ${gearOptions}
        </select>
        <span style="cursor: help; color: var(--color-alert-amber); font-size: 14px;" data-tooltip="${escapeHtml(gearTooltip)}">ⓘ</span>
      </div>
      <div style="margin-top: var(--space-xs); display: flex; flex-direction: column; gap: var(--space-xs);">
        <label class="settings-field__label" style="margin-bottom: 0;" data-tooltip="Modifiers are assigned dynamically: first trait adjusts by 3, second by 2, third by 1. Use the sign button to toggle positive/negative modifier.">Traits Setup (Hover for details) ⓘ</label>
        ${buildTraitEditorHtml(1, slot.customTrait1Name, slot.customTrait1Sign, index, traitOptions[0], traitKnown[0])}
        ${buildTraitEditorHtml(2, slot.customTrait2Name, slot.customTrait2Sign, index, traitOptions[1], traitKnown[1])}
        ${buildTraitEditorHtml(3, slot.customTrait3Name, slot.customTrait3Sign, index, traitOptions[2], traitKnown[2])}
      </div>
    </div>
  `;
}

function buildTraitEditorHtml(
  traitNumber: 1 | 2 | 3,
  traitName: string,
  traitSign: '+' | '-',
  index: number,
  traitOptionsHtml: string,
  isKnownTrait: boolean
): string {
  const modifierMagnitude = traitNumber === 1 ? 3 : traitNumber === 2 ? 2 : 1;
  const modifier = traitSign === '+' ? modifierMagnitude : -modifierMagnitude;

  return `
    <div class="custom-editor__trait-container" style="display: flex; flex-direction: column; gap: var(--space-3xs);">
      <div class="custom-editor__trait-row">
        <select class="char-slot-card__select sel-trait${traitNumber}-dropdown" data-index="${index}" data-tooltip="${escapeHtml(getTraitTooltipText(traitName || `Trait ${traitNumber}`, modifier))}">
          ${traitOptionsHtml}
        </select>
        <button class="custom-editor__btn-sign btn-trait${traitNumber}-sign ${traitSign === '-' ? 'custom-editor__btn-sign--negative' : ''}" data-index="${index}" data-tooltip="Click to toggle positive (+${modifierMagnitude}) or negative (-${modifierMagnitude}) modifier.">
          ${modifierMagnitude} (${traitSign})
        </button>
      </div>
      ${!isKnownTrait ? `
        <input type="text" placeholder="Custom Trait ${traitNumber} Name" class="char-slot-card__input inp-trait${traitNumber}-custom" data-index="${index}" value="${traitName}" data-tooltip="${escapeHtml(getTraitTooltipText(traitName || 'Custom Trait', modifier))}" />
      ` : ''}
    </div>
  `;
}

function createAddCrewCard(slotConfigs: CrewSlotConfig[], rerender: () => void): HTMLDivElement {
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
    slotConfigs.push(createDefaultCrewSlot(''));
    rerender();
  });
  return addCard;
}

function createDefaultCrewSlot(pregenName: string): CrewSlotConfig {
  return {
    isAI: false,
    pregenName,
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

function bindSlotInputEvents(
  container: HTMLElement,
  slotConfigs: CrewSlotConfig[],
  rerender: () => void,
  generateNPCOnSlot: (index: number) => void
): void {
  bindValueChange(container, '.sel-pregen', (idx, value) => {
    slotConfigs[idx].pregenName = value;
    rerender();
  });
  bindTextInput(container, '.inp-name', (idx, value) => {
    slotConfigs[idx].customName = value;
  });
  bindTextInput(container, '.inp-concept', (idx, value) => {
    slotConfigs[idx].customConcept = value;
  });
  bindValueChange(container, '.sel-aptitude', (idx, value) => {
    slotConfigs[idx].customAptitude = value as AptitudeType;
    rerender();
  });
  bindValueChange(container, '.sel-gear', (idx, value) => {
    slotConfigs[idx].customGear = value ? value as Gear : null;
    rerender();
  });

  bindTraitControls(container, slotConfigs, rerender);

  container.querySelectorAll('.chk-ai').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const idx = readEventIndex(event);
      slotConfigs[idx].isAI = (event.target as HTMLInputElement).checked;
      rerender();
    });
  });
  container.querySelectorAll('.btn-remove-slot').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const idx = readEventIndex(event);
      slotConfigs.splice(idx, 1);
      rerender();
    });
  });
  container.querySelectorAll('.btn-generate-npc').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      generateNPCOnSlot(readEventIndex(event));
    });
  });
}

function bindTraitControls(
  container: HTMLElement,
  slotConfigs: CrewSlotConfig[],
  rerender: () => void
): void {
  bindTraitDropdown(container, '.sel-trait1-dropdown', 'customTrait1Name', 'Custom Trait 1', slotConfigs, rerender);
  bindTraitDropdown(container, '.sel-trait2-dropdown', 'customTrait2Name', 'Custom Trait 2', slotConfigs, rerender);
  bindTraitDropdown(container, '.sel-trait3-dropdown', 'customTrait3Name', 'Custom Trait 3', slotConfigs, rerender);
  bindCustomTraitInput(container, '.inp-trait1-custom', 'customTrait1Name', slotConfigs, rerender);
  bindCustomTraitInput(container, '.inp-trait2-custom', 'customTrait2Name', slotConfigs, rerender);
  bindCustomTraitInput(container, '.inp-trait3-custom', 'customTrait3Name', slotConfigs, rerender);
  bindTraitSignButton(container, '.btn-trait1-sign', 'customTrait1Sign', slotConfigs, rerender);
  bindTraitSignButton(container, '.btn-trait2-sign', 'customTrait2Sign', slotConfigs, rerender);
  bindTraitSignButton(container, '.btn-trait3-sign', 'customTrait3Sign', slotConfigs, rerender);
}

function bindValueChange(
  container: HTMLElement,
  selector: string,
  onChange: (index: number, value: string) => void
): void {
  container.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('change', (event) => {
      onChange(readEventIndex(event), (event.target as HTMLSelectElement).value);
    });
  });
}

function bindTextInput(
  container: HTMLElement,
  selector: string,
  onInput: (index: number, value: string) => void
): void {
  container.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('input', (event) => {
      onInput(readEventIndex(event), (event.target as HTMLInputElement).value);
    });
  });
}

function bindTraitDropdown(
  container: HTMLElement,
  selector: string,
  property: 'customTrait1Name' | 'customTrait2Name' | 'customTrait3Name',
  customLabel: string,
  slotConfigs: CrewSlotConfig[],
  rerender: () => void
): void {
  bindValueChange(container, selector, (idx, value) => {
    slotConfigs[idx][property] = value === 'custom' ? customLabel : value;
    rerender();
  });
}

function bindCustomTraitInput(
  container: HTMLElement,
  selector: string,
  property: 'customTrait1Name' | 'customTrait2Name' | 'customTrait3Name',
  slotConfigs: CrewSlotConfig[],
  rerender: () => void
): void {
  bindTextInput(container, selector, (idx, value) => {
    slotConfigs[idx][property] = value;
  });
  container.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('blur', rerender);
  });
}

function bindTraitSignButton(
  container: HTMLElement,
  selector: string,
  property: 'customTrait1Sign' | 'customTrait2Sign' | 'customTrait3Sign',
  slotConfigs: CrewSlotConfig[],
  rerender: () => void
): void {
  container.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const idx = readEventIndex(event);
      slotConfigs[idx][property] = slotConfigs[idx][property] === '+' ? '-' : '+';
      rerender();
    });
  });
}

function readEventIndex(event: Event): number {
  const target = event.currentTarget || event.target;
  return parseInt((target as HTMLElement).getAttribute('data-index') || '0', 10);
}
