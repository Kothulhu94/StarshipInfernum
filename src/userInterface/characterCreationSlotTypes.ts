import { AptitudeType, Gear } from '@characterSystem/characterTypes';

export interface CrewSlotConfig {
  isAI: boolean;
  pregenName: string;
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
