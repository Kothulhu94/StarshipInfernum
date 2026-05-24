import { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { AdversaryData, ADVERSARY_REGISTRY, getAdversaryByCard } from './adversaryRegistry';

const SCENARIO_ADVERSARY_ALIASES: Record<string, keyof typeof ADVERSARY_REGISTRY> = {
  mutineer: 'pirate_scavenger',
  nanotech_zombie: 'ghoul_zombie',
  pirate: 'pirate_scavenger',
  predatory_horror: 'predatory_horror',
};

export function getScenarioAdversaryByCard(
  cardCode: string,
  level: 1 | 2 | 3,
  scenario: ScenarioConfig | null
): AdversaryData {
  const allowedTypes = scenario?.adversaryTypes || [];
  const mappedTypes = allowedTypes
    .map((typeId) => SCENARIO_ADVERSARY_ALIASES[typeId] || typeId)
    .filter((typeId): typeId is keyof typeof ADVERSARY_REGISTRY => typeId in ADVERSARY_REGISTRY);

  if (mappedTypes.length === 0) {
    return getAdversaryByCard(cardCode, level);
  }

  let hash = 0;
  for (let i = 0; i < cardCode.length; i++) {
    hash += cardCode.charCodeAt(i);
  }

  const selectedType = mappedTypes[hash % mappedTypes.length];
  return {
    ...ADVERSARY_REGISTRY[selectedType],
    level,
  };
}

export function shouldRegularCombatDefeatAdversary(
  scenario: ScenarioConfig | null,
  adversary: AdversaryData
): boolean {
  return !(scenario?.id === 'scavengers' && adversary.id === 'predatory_horror');
}
