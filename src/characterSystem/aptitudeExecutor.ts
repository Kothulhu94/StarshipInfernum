import { Character } from './characterTypes';
import { Card } from '@cardEngine/cardDefinitions';

/**
 * Checks if a character is immune to a specific obstacle due to their aptitude or gear.
 */
export function isImmuneToObstacle(character: Character, obstacleCode: string): boolean {
  const code = obstacleCode.toUpperCase();


  // 1. Android immunities
  if (character.aptitude === 'Android') {
    // Extreme Temperature (9S), Lack of Oxygen (QC), Toxic Gas (5C)
    // In our registry, QC is oxygen_critical, 5C is toxic_gas, 9S is extreme_temps, 4S is radiation, 6D is parasite_illness
    if (code === '9S' || code === 'QC' || code === '5C' || code === '4S' || code === '6D') {
      return true;
    }
  }

  // 2. Spacesuit immunities
  if (character.gear === 'spacesuit') {
    // Contamination/Illness (6D), Lack of Oxygen (QC), Toxic Gas (5C), Radiation (4S), Vent to Space (4C)
    if (code === '6D' || code === 'QC' || code === '5C' || code === '4S' || code === '4C' || code === '8C') {
      return true;
    }
  }

  return false;
}

/**
 * Calculates modified starting tension level for card counts.
 * Armored ignores 1 round of tension vs adversaries.
 * Counselor ignores 1 round of tension vs psychic obstacles.
 */
export function getModifiedTension(
  character: Character,
  rawTension: number,
  isAdversary: boolean,
  obstacleId: string
): number {
  let tension = rawTension;

  if (character.aptitude === 'Armored' && isAdversary) {
    tension = Math.max(0, tension - 1);
  }

  if (character.aptitude === 'Counselor') {
    const psychicObstacles = ['claustrophobia', 'hallucination', 'paranoia', 'panic_attack', 'cotard_delusion'];
    if (psychicObstacles.includes(obstacleId.toLowerCase())) {
      tension = Math.max(0, tension - 1);
    }
  }

  return tension;
}

/**
 * Checks if Psychic aptitude reveals both of Dealer's cards.
 * Returns true if Psychic is active and this is the first hand of the test.
 */
export function shouldPsychicRevealDealer(character: Character, isFirstHand: boolean): boolean {
  return character.aptitude === 'Psychic' && isFirstHand;
}

/**
 * Checks if Commander swap is available.
 */
export function canCommanderSwap(
  commander: Character,
  isGroupTest: boolean,
  hasUsedCommanderSwapThisTest: boolean
): boolean {
  return commander.aptitude === 'Commander' && isGroupTest && !hasUsedCommanderSwapThisTest && !commander.isDead;
}

/**
 * Executes a Commander swap between the commander's last card and target player's last card.
 */
export function executeCommanderSwap(commanderHand: Card[], targetHand: Card[]): void {
  if (commanderHand.length === 0 || targetHand.length === 0) return;
  const temp = commanderHand[commanderHand.length - 1];
  commanderHand[commanderHand.length - 1] = targetHand[targetHand.length - 1];
  targetHand[targetHand.length - 1] = temp;
}

/**
 * Checks if Shapeshifter swap is available.
 */
export function canShapeshifterSwap(character: Character, hasUsedSwapThisTest: boolean): boolean {
  return character.aptitude === 'Shapeshifter' && !hasUsedSwapThisTest && !character.isDead;
}

/**
 * Executes a Shapeshifter swap between player's last card and dealer's face-up card.
 * In standard Blackjack, dealer's face-up card is the second card (index 1).
 */
export function executeShapeshifterSwap(playerHand: Card[], dealerHand: Card[]): void {
  if (playerHand.length === 0 || dealerHand.length < 2) return;
  const temp = playerHand[playerHand.length - 1];
  playerHand[playerHand.length - 1] = dealerHand[1];
  dealerHand[1] = temp;
}

/**
 * Checks if Science redraw is available.
 */
export function canScienceRedraw(
  character: Character,
  isAdversary: boolean,
  isBust: boolean,
  hasUsedRedrawThisTest: boolean
): boolean {
  return character.aptitude === 'Science' && !isAdversary && isBust && !hasUsedRedrawThisTest && !character.isDead;
}

/**
 * Checks if Smuggler pocket card swap is available.
 */
export function canSmugglerSwap(character: Character, hasUsedSwapThisTest: boolean): boolean {
  return character.aptitude === 'Smuggler' && !hasUsedSwapThisTest && !character.isDead && !!character.ghostCard;
}

/**
 * Executes a Smuggler swap. Swaps pocket card (stored in ghostCard) with the player's last card.
 * The new card remains in the pocket.
 */
export function executeSmugglerSwap(character: Character, playerHand: Card[]): void {
  if (!character.ghostCard || playerHand.length === 0) return;
  
  const lastCard = playerHand[playerHand.length - 1];
  const pocketCard = {
    suit: character.ghostCard.suit,
    rank: character.ghostCard.rank,
    faceUp: true
  } as Card;

  // Swap
  playerHand[playerHand.length - 1] = pocketCard;
  character.ghostCard = {
    suit: lastCard.suit,
    rank: lastCard.rank
  };
}

/**
 * Checks if Trainee backup redraw is available in a Group Test.
 */
export function canTraineeRedraw(
  trainee: Character,
  hasUsedTraineeThisTest: boolean
): boolean {
  return trainee.aptitude === 'Trainee' && !hasUsedTraineeThisTest && !trainee.isDead;
}

/**
 * Checks if Survivor can slink away from a Disaster after surviving the first round.
 */
export function canSurvivorSlink(character: Character, isDisaster: boolean, disasterRound: number): boolean {
  return character.aptitude === 'Survivor' && isDisaster && disasterRound > 1 && !character.isDead;
}
