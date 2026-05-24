import { MajorCrisisType, MinorCrisisType } from '@crisisSystem/crisisTypes';

export interface ScenarioConfig {
  id: string;
  name: string;
  majorCrisis: MajorCrisisType;
  defaultMinorCrisis: MinorCrisisType;
  backstory: string;
  year?: number;
  shipName?: string;
  restrictedAptitudes?: string[]; // Aptitude names that shouldn't be used
  startWithNoGear?: boolean; // Whether characters start with no gear (e.g., Flying into the Sun)
  adversaryTypes: string[]; // Adversaries featured in this scenario
  extraRulesText?: string;
  requiresSpacesuitForEva?: boolean;
}
