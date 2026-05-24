import { NarrativeEventType, NarrativeInterruptionVolume, VerbosityLevel } from './narrativeTypes';
import { getNarrativeVolumePolicy, shouldNarrateEvent } from './narrativeInterruptionVolumePolicy';

export class VerbosityController {
  private level: VerbosityLevel = 'FREQUENT';

  public setLevel(newLevel: VerbosityLevel) {
    this.level = newLevel;
  }

  public getLevel(): VerbosityLevel {
    return this.level;
  }

  public getPromptMaxTokens(): number {
    return getNarrativeVolumePolicy(this.level).maxTokens;
  }

  public getPromptLengthRule(): string {
    return getNarrativeVolumePolicy(this.level).promptLengthRule;
  }

  public getVolume(): NarrativeInterruptionVolume {
    return this.level;
  }

  public shouldNarrate(eventType: NarrativeEventType): boolean {
    return shouldNarrateEvent(this.level, eventType);
  }
}

export const verbosityController = new VerbosityController();
