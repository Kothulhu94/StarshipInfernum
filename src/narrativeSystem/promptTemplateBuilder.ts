import { NarrativeEvent } from './narrativeTypes';

export function buildPrompt(event: NarrativeEvent): string {
  const ctx = event.context;
  let prompt = `You are the Dealer in Starship Infernum. The scenario is '${ctx.scenarioName}'.\n`;
  
  prompt += `Character '${ctx.characterName}' (Traits: ${ctx.characterTraits.join(', ')}) `;

  switch (event.type) {
    case 'ROOM_ENTERED':
      prompt += `just entered the ${ctx.roomName}. Describe the room ominously in 2 sentences.`;
      break;
    case 'OBSTACLE_REVEALED':
      prompt += `discovered a ${ctx.obstacleName} obstacle. Describe the danger in 2 sentences.`;
      break;
    case 'TEST_BUST':
      prompt += `just busted trying to overcome the ${ctx.obstacleName}. Narrate their failure dramatically in 2-3 sentences. Never mention cards, busts, or game mechanics.`;
      break;
    case 'TEST_SUCCESS':
      prompt += `successfully overcame the ${ctx.obstacleName}. Narrate their success in 2 sentences. Never mention cards or game mechanics.`;
      break;
    case 'ADVERSARY_ENCOUNTER':
      prompt += `encountered ${ctx.adversaryName}. Narrate the terrifying start of combat in 2 sentences.`;
      break;
    case 'CHARACTER_DEATH':
      prompt += `has died. Narrate their tragic end in 3 sentences.`;
      break;
    default:
      prompt += `experienced an event. Narrate it appropriately in 2 sentences.`;
      break;
  }

  if (ctx.extraContext) {
    prompt += `\nAdditional context: ${ctx.extraContext}`;
  }
  
  prompt += `\nDealer narration:\n`;

  return prompt;
}
