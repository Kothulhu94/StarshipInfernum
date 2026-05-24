import { APTITUDE_REGISTRY } from './aptitudeRegistry';
import { Gear } from './characterTypes';

export const TRAIT_REGISTRY: Record<string, string> = {
  // Alexis Vance
  'Lead by Example': 'Inspire the crew by leading tests from the front.',
  'Inspiring Presence': 'Grants a supportive boost to allies in group tests.',
  'Refuse to Fail': 'Stubborn determination that prevents critical failure.',

  // Zarek Tor
  'Analytical Mind': 'Quickly calculates angles and odds in survival situations.',
  'Cool Under Pressure': 'Stay completely calm during high-risk events.',
  'Emotionless Logic': 'Applies cold math to overcome emotional panic.',

  // Billy Cooper
  'Dumb Luck': 'Bizarrely escapes danger through pure, unearned luck.',
  'Eager to Please': 'Strives to impress superiors, granting extra effort.',
  'Clumsy but Quick': 'Stumbles around but moves incredibly fast.',

  // Mac McConnely
  'Percussive Maintenance': 'Fixes broken technology by hitting it.',
  'Seen it All Before': 'Veteran status makes new crises feel routine.',
  'Stubborn as a Mule': 'Absolute refusal to give up or yield to obstacles.',

  // Jax Thorne
  'Relentless Fury': 'Fierce combat drive that overpowers adversaries.',
  'Thick Skinned': 'Withstands physical blunt trauma and harsh comments.',
  'Brawler': 'Proficient in close-quarters physical combat.',

  // Celeste Aurelia
  'Emotional Anchor': 'Acts as a calming force for panicked crewmates.',
  'Deep Insight': 'Easily understands the psychological state of others.',
  'Calming Voice': 'Soothes stressed allies with reassuring words.',

  // M.E.L.V.I.N.
  'Robotic Fortitude': 'Sturdy metallic construction that resists damage.',
  'Calculated Pessimism': 'Prepares for worst-case outcomes to mitigate them.',
  'Sacrificial Protocols': 'Willingness to draw damage away from human crew.',

  // Angela Mercer
  'Steady Hands': 'Flawless precision during emergency medical procedures.',
  'Triage Prioritization': 'Focuses medical attention where it is needed most.',
  'Clinical Detachment': 'Maintains objective focus in bloody situations.',

  // Custom Defaults
  'Resourceful': 'Finds clever ways to utilize random items and scrap.',
  'Determined': 'Relentless focus on completing the mission.',
  'Quick Reflexes': 'Reacts instantaneously to sudden environmental hazards.',
  'Adrenaline Rush': 'Surge of energy when facing immediate physical harm.',
  'Observant': 'Spots hidden traps, pathways, and structural flaws.',
  'Agile': 'Performs feats of acrobatics and escapes tight spaces easily.'
};

/**
 * Escapes special HTML characters.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compiles tooltip HTML for a given trait.
 */
export function getTraitTooltipText(name: string, modifier: number): string {
  const trimmed = name.trim();
  const description = TRAIT_REGISTRY[trimmed] || 'A custom trait representing the character\'s unique background and training.';
  const sign = modifier >= 0 ? '+' : '';
  const explanation = modifier >= 0
    ? `Exhaust this trait to add <strong>+${modifier}</strong> to your hand total before the Dealer reveals their face-down card.`
    : `Exhaust this trait to subtract <strong>${modifier}</strong> from your hand total to avoid busting.`;

  return `
    <div class="tooltip-header" style="font-family: var(--font-display); color: var(--color-console-cyan); font-weight: bold; margin-bottom: 4px;">
      ${escapeHtml(trimmed)} (${sign}${modifier})
    </div>
    <div class="tooltip-desc" style="font-style: italic; color: var(--color-text-secondary); margin-bottom: 6px;">
      ${escapeHtml(description)}
    </div>
    <div class="tooltip-rule" style="font-size: 10px; color: var(--color-text-muted);">
      ${explanation}
    </div>
  `.trim();
}

/**
 * Compiles tooltip HTML for a given aptitude.
 */
export function getAptitudeTooltipText(aptitude: string): string {
  const def = APTITUDE_REGISTRY[aptitude as any];
  if (!def) {
    return `<div style="font-family: var(--font-display); font-weight: bold;">${escapeHtml(aptitude)}</div>`;
  }

  return `
    <div class="tooltip-header" style="font-family: var(--font-display); color: var(--color-alert-amber); font-weight: bold; margin-bottom: 4px;">
      Aptitude: ${escapeHtml(def.name)}
    </div>
    <div class="tooltip-desc" style="font-style: italic; color: var(--color-text-secondary); margin-bottom: 6px;">
      ${escapeHtml(def.description)}
    </div>
    <div class="tooltip-rule" style="font-size: 11px; color: var(--color-text-primary); border-top: 1px solid var(--glass-border); padding-top: 4px;">
      <strong>Rules:</strong> ${escapeHtml(def.rulesText)}
    </div>
  `.trim();
}

/**
 * Compiles tooltip HTML for a given starting gear item.
 */
export function getGearTooltipText(gear: Gear | string | null): string {
  if (!gear) {
    return `
      <div class="tooltip-header" style="font-family: var(--font-display); color: var(--color-console-cyan); font-weight: bold; margin-bottom: 2px;">
        Starting Gear: None
      </div>
      <div class="tooltip-desc" style="font-style: italic; color: var(--color-text-secondary); font-size: 11px;">
        Character starts the game with no items.
      </div>
    `.trim();
  }

  const normalized = typeof gear === 'string' ? gear.trim() : '';
  const descriptions: Record<string, { name: string; rules: string }> = {
    spacesuit: {
      name: 'Spacesuit',
      rules: 'Required for EVA. Confers immunity to toxic gas, lack of oxygen, radiation, and extreme temperatures, but prevents using Traits to modify tests. Cannot carry other gear.'
    },
    medkit: {
      name: 'MedKit',
      rules: 'One-time use item to recover an exhausted trait in any room once the obstacle is cleared. Medics can use this to heal a busted trait instead.'
    },
    ranged_weapon: {
      name: 'Ranged Weapon',
      rules: 'Allows redrawing the last card dealt in a Survival Test against distant Adversaries. Destroyed if you bust.'
    },
    melee_weapon: {
      name: 'Melee Weapon',
      rules: 'Allows redrawing the last card dealt in a Survival Test against close range Adversaries. Destroyed if you bust.'
    },
    explosives: {
      name: 'Explosives',
      rules: 'Requires preparation test. Can be used to blow doors open, create hull breaches, or instantly eliminate any Adversary.'
    }
  };

  const item = descriptions[normalized];
  if (!item) {
    return `<div style="font-family: var(--font-display); font-weight: bold;">Gear: ${escapeHtml(normalized)}</div>`;
  }

  return `
    <div class="tooltip-header" style="font-family: var(--font-display); color: var(--color-console-cyan); font-weight: bold; margin-bottom: 4px;">
      Gear: ${escapeHtml(item.name)}
    </div>
    <div class="tooltip-rule" style="font-size: 11px; color: var(--color-text-primary); border-top: 1px solid var(--glass-border); padding-top: 4px;">
      <strong>Rules:</strong> ${escapeHtml(item.rules)}
    </div>
  `.trim();
}

