import { NarrativeEvent } from './narrativeTypes';
import { verbosityController } from './verbosityController';
import { koboldClient } from './koboldCppClient';
import { buildPrompt } from './promptTemplateBuilder';
import { getRoomDescription, getObstacleDescription, getOutcomeDescription } from './flavorTextLibrary';
import { getAdversaryIntro, getAdversaryDefeatText } from './adversaryFlavorText';
import { getRandomDealerQuip } from './dealerQuipLibrary';

export class NarrativeEventRouter {
  
  public async handleEvent(event: NarrativeEvent): Promise<string> {
    if (!verbosityController.shouldNarrate(event.type)) {
      return '';
    }

    // Try LLM if connected
    if (koboldClient.getIsConnected()) {
      try {
        const prompt = buildPrompt(event);
        const narration = await koboldClient.generate(prompt);
        if (narration) return narration;
      } catch (e) {
        console.warn('LLM generation failed, falling back to pre-written text.');
      }
    }

    // Fallback to pre-written text
    return this.getPreWrittenText(event);
  }

  private getPreWrittenText(event: NarrativeEvent): string {
    if (event.preWrittenText) {
      return event.preWrittenText;
    }

    const ctx = event.context;
    switch (event.type) {
      case 'ROOM_ENTERED':
        return getRoomDescription(ctx.roomName || 'Unknown Room');
      case 'OBSTACLE_REVEALED':
        return getObstacleDescription(ctx.obstacleName || 'Unknown Obstacle');
      case 'TEST_BUST':
        return getOutcomeDescription(ctx.obstacleName || 'Obstacle', false);
      case 'TEST_SUCCESS':
        return getOutcomeDescription(ctx.obstacleName || 'Obstacle', true);
      case 'ADVERSARY_ENCOUNTER':
        return getAdversaryIntro(ctx.adversaryName || 'Unknown Adversary');
      case 'ADVERSARY_DEFEATED':
        return getAdversaryDefeatText(ctx.adversaryName || 'Unknown Adversary');
      case 'RISING_TENSION':
        return getRandomDealerQuip('TENSION_RISING');
      case 'CHARACTER_DEATH':
        return `${ctx.characterName} has perished in the cold void.`;
      case 'CRISIS_TRIGGERED':
      case 'CRISIS_RESOLVED':
      case 'GHOST_FLASHBACK':
      default:
        return `${ctx.characterName} experiences a strange sensation.`;
    }
  }
}

export const narrativeRouter = new NarrativeEventRouter();
