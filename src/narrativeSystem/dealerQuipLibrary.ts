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
