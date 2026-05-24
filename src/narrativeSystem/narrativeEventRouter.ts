import { NarrativeEvent } from './narrativeTypes';
import { verbosityController } from './verbosityController';
import { koboldClient } from './koboldCppClient';
import { buildPrompt } from './promptTemplateBuilder';
import { getNarrativeFallbackText } from './narrativeFallbackText';

export class NarrativeEventRouter {
  
  public async handleEvent(event: NarrativeEvent): Promise<string> {
    if (!verbosityController.shouldNarrate(event.type)) {
      return '';
    }

    // Try LLM if connected
    if (koboldClient.getIsConnected()) {
      try {
        const prompt = buildPrompt(event, verbosityController.getPromptLengthRule());
        const narration = await koboldClient.generate(prompt, verbosityController.getPromptMaxTokens());
        if (narration) return narration;
      } catch (e) {
        console.warn('LLM generation failed, falling back to pre-written text.');
      }
    }

    // Fallback to pre-written text
    return getNarrativeFallbackText(event);
  }
}

export const narrativeRouter = new NarrativeEventRouter();
