import { Suit } from '@cardEngine/cardDefinitions';
import {
  comparePlayerAndDealer,
  dealPlayerOpeningHand,
  evaluatePlayerHand,
} from '@cardEngine/blackjackTestSemantics';
import {
  checkCrisisUnlocked,
  isDisasterTrigger,
  onCrisisTestBust,
  onCrisisTestSuccess,
} from '@crisisSystem/jokerEventHandler';
import { MajorCrisisState } from '@crisisSystem/crisisTypes';
import {
  createRoomObstacleDrawState,
  normalizeRoomObstacleState,
} from '@mapGenerator/roomObstacleState';
import { RoomNode } from '@mapGenerator/mapLayoutTypes';
import {
  buildSerializableSaveFixture,
  assertSerializableSaveContract,
} from './saveLoadContractGuard';
import {
  createDeterministicDeck,
  getDeterministicDeckCards,
} from './deterministicDeckFixture';
import { assertNarrativeImmersionContract } from './narrativeImmersionContractGuard';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function smokeSaveLoadContract(): void {
  assertSerializableSaveContract(buildSerializableSaveFixture());
}

function smokeRoomObstaclePairedDraws(): void {
  const draw = createRoomObstacleDrawState('7H', '7S');
  assert(draw.isRankMatch, 'Room and obstacle rank matches must be detectable.');
  assert(!draw.isSuitMatch, 'Mismatched suits must not be flagged as a suit match.');

  const legacyRoom = {
    id: 'legacy-room',
    name: 'Legacy Room',
    cardCode: '9C',
    obstacleState: 'unresolved',
    roomType: 'Lab',
    x: 0,
    y: 0,
    z: 0,
    width: 4,
    height: 4,
    templateId: 'legacy-template',
    doors: [],
    features: {},
    isDiscovered: true,
    isObstacleCleared: false,
  } as RoomNode;

  const normalized = normalizeRoomObstacleState(legacyRoom);
  assert(normalized.roomCardCode === '9C', 'Legacy room card must migrate to roomCardCode.');
  assert(normalized.obstacleCardCode === '9C', 'Legacy room card must migrate to obstacleCardCode.');
  assert(normalized.roomObstacleDraw?.isDouble === true, 'Legacy same-card migration must mark doubles.');
}

function smokeBlackjackSemantics(): void {
  const natural = evaluatePlayerHand([
    { suit: Suit.HEARTS, rank: 'A', faceUp: true },
    { suit: Suit.SPADES, rank: 'K', faceUp: true },
  ]);
  assert(natural.total === 21 && natural.isNatural21, 'Ace plus face card must be a natural 21.');

  const mitigatedBust = evaluatePlayerHand([
    { suit: Suit.HEARTS, rank: 'K', faceUp: true },
    { suit: Suit.SPADES, rank: 'Q', faceUp: true },
    { suit: Suit.CLUBS, rank: '5', faceUp: true },
  ], -4);
  assert(!mitigatedBust.isBust && mitigatedBust.total === 21, 'Trait modifiers must be able to mitigate busts.');

  const push = comparePlayerAndDealer(
    { total: 19, isSoft: false, isBust: false, isNatural21: false },
    { total: 19, isSoft: false, isBust: false, isNatural21: false }
  );
  assert(push === 'PUSH', 'Equal non-bust scores must push.');

  const deck = createDeterministicDeck([
    { suit: Suit.HEARTS, rank: '2', faceUp: false },
    { suit: Suit.SPADES, rank: '3', faceUp: false },
    { suit: Suit.CLUBS, rank: '4', faceUp: false },
    { suit: Suit.DIAMONDS, rank: '5', faceUp: false },
  ]);
  const hand = dealPlayerOpeningHand(deck, 2);
  assert(hand.length === 4, 'Rising Tension 2 must deal four player opening cards.');
  assert(hand.every(card => card.faceUp), 'Player opening cards must be face up.');
}

function smokeCrisisJokerFlow(): void {
  assert(
    isDisasterTrigger({ suit: Suit.SPADES, rank: 'A', faceUp: true, isJoker: true }),
    'Joker cards must trigger Disasters.'
  );

  const major: MajorCrisisState = {
    id: 'ALIEN_HORROR',
    jokersRemaining: 1,
    jokersTotal: 1,
    isUnlocked: false,
    isResolved: false,
    completedStepRoomIds: [],
  };
  onCrisisTestSuccess(major);
  assert(major.jokersRemaining === 0, 'Successful crisis tests must remove a Joker.');
  assert(major.isUnlocked, 'Major crisis must unlock after all Jokers are removed.');

  const bustMajor: MajorCrisisState = {
    id: 'MUTINY',
    jokersRemaining: 1,
    jokersTotal: 1,
    isUnlocked: false,
    isResolved: false,
    completedStepRoomIds: [],
  };
  const deck = createDeterministicDeck([]);
  onCrisisTestBust(bustMajor, deck);
  checkCrisisUnlocked(bustMajor);
  assert(bustMajor.jokersRemaining === 0 && bustMajor.isUnlocked, 'Busted crisis tests still advance Joker removal.');
  assert(getDeterministicDeckCards(deck).some(card => card.isJoker), 'Busted crisis tests must return a Joker to the deck.');
}

export function runRuleRegressionSmokeSuite(): void {
  smokeSaveLoadContract();
  smokeRoomObstaclePairedDraws();
  assertNarrativeImmersionContract();
  smokeBlackjackSemantics();
  smokeCrisisJokerFlow();
}
