import { VerbosityLevel } from './narrativeTypes';

export class VerbosityController {
  private level: VerbosityLevel = 'FULL';

  public setLevel(newLevel: VerbosityLevel) {
    this.level = newLevel;
  }

  public getLevel(): VerbosityLevel {
    return this.level;
  }

  public shouldNarrate(eventType: string): boolean {
    if (this.level === 'FULL') return true;
    
    if (this.level === 'KEY_MOMENTS') {
      const keyEvents = ['CHARACTER_DEATH', 'CRISIS_TRIGGERED', 'CRISIS_RESOLVED', 'ADVERSARY_ENCOUNTER'];
      return keyEvents.includes(eventType);
    }
    
    if (this.level === 'MINIMAL') {
      const minimalEvents = ['CHARACTER_DEATH'];
      return minimalEvents.includes(eventType);
    }
    
    return true;
  }
}

export const verbosityController = new VerbosityController();
