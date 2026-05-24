import { NarrativeEvent } from './narrativeTypes';

export function buildPrompt(event: NarrativeEvent, lengthRule: string): string {
  const ctx = event.context;
  let prompt = `You are the Dealer in Starship Infernum. The scenario is '${ctx.scenarioName}'.\n`;
  
  prompt += `Character '${ctx.characterName}' (Traits: ${ctx.characterTraits.join(', ')}) `;

  switch (event.type) {
    case 'ROOM_ENTERED':
      prompt += `just entered the ${ctx.roomName}. Describe only the atmosphere of the room.`;
      break;
    case 'OBSTACLE_REVEALED':
      prompt += `discovered a ${ctx.obstacleName} obstacle. Describe the danger without resolving it.`;
      break;
    case 'TEST_BUST':
      prompt += `failed to overcome the ${ctx.obstacleName}. Narrate only the provided failure.`;
      break;
    case 'TEST_SUCCESS':
      prompt += `successfully overcame the ${ctx.obstacleName}. Narrate only the provided success.`;
      break;
    case 'CRISIS_TRIGGERED':
      prompt += `is present as a ship crisis begins. Describe the alarm and pressure.`;
      break;
    case 'CRISIS_RESOLVED':
      prompt += `is present as a ship crisis is brought under control. Describe the release of pressure.`;
      break;
    case 'ADVERSARY_ENCOUNTER':
      prompt += `encountered ${ctx.adversaryName}. Narrate the threat entering the scene.`;
      break;
    case 'ADVERSARY_DEFEATED':
      prompt += `survived an encounter with ${ctx.adversaryName}. Narrate the immediate aftermath.`;
      break;
    case 'RISING_TENSION':
      prompt += `feels the ship situation worsen. Narrate a brief pressure spike.`;
      break;
    case 'CHARACTER_DEATH':
      prompt += `has died. Narrate their tragic end without inventing extra injuries or survivors.`;
      break;
    case 'GHOST_FLASHBACK':
      prompt += `is remembered in a ghost flashback. Narrate a brief haunted memory.`;
      break;
    default:
      prompt += `experienced an event. Narrate it briefly.`;
      break;
  }

  if (ctx.extraContext) {
    prompt += `\nAdditional context: ${ctx.extraContext}`;
  }
  
  prompt += `\n${lengthRule}`;
  prompt += `\nNever mention cards, score totals, legal moves, hidden rules, or outcomes not already supplied above.`;
  prompt += `\nNever announce damage, death, crisis progress, map changes, success, or failure unless this prompt explicitly states that outcome.`;
  prompt += `\nDealer narration:\n`;

  return prompt;
}
