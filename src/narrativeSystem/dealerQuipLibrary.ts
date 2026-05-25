export const DealerQuips: Record<string, string[]> = {
  'TENSION_RISING': [
    "The house always wins, but you're welcome to keep playing.",
    "Are you sweating yet? Because you should be.",
    "Another card? How brave. Or how foolish."
  ],
  'BUST': [
    "Oh dear. That's going to leave a mark.",
    "I warned you to stand.",
    "Such a shame. Next in line?"
  ],
  'WIN': [
    "Beginner's luck.",
    "Enjoy it while it lasts.",
    "A minor setback for the house."
  ]
};

export function getRandomDealerQuip(category: string): string {
  const quips = DealerQuips[category];
  if (!quips || quips.length === 0) return "The Dealer smiles knowingly.";
  return quips[Math.floor(Math.random() * quips.length)];
}

export function getContextualTensionQuip(context: any): string {
  if (context.adversaryName) {
    return `The ${context.adversaryName} presses its advantage. The Dealer smirks as the tension rises.`;
  }
  if (context.obstacleName) {
    return `The situation with the ${context.obstacleName} worsens. The Dealer deals another card.`;
  }
  if (context.scenarioId === 'flying_into_the_sun') {
    return "The heat becomes unbearable as the sun looms closer. The Dealer smiles knowingly.";
  }
  if (context.scenarioId === 'prison_break') {
    return "The rioters' chants echo louder through the hull. The Dealer deals another card.";
  }
  return getRandomDealerQuip('TENSION_RISING');
}
