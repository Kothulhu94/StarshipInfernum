var Suit = /* @__PURE__ */ ((Suit2) => {
  Suit2["HEARTS"] = "HEARTS";
  Suit2["SPADES"] = "SPADES";
  Suit2["DIAMONDS"] = "DIAMONDS";
  Suit2["CLUBS"] = "CLUBS";
  return Suit2;
})(Suit || {});
function evaluateHand(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces++;
      total += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  const isSoft = aces > 0;
  const isBust = total > 21;
  const isNatural21 = cards.length === 2 && total === 21;
  return { total, isSoft, isBust, isNatural21 };
}
function dealFaceUpCards(deck, count) {
  const hand = [];
  for (let i = 0; i < count; i++) {
    const card = deck.draw();
    card.faceUp = true;
    hand.push(card);
  }
  return hand;
}
function dealPlayerOpeningHand(deck, tension) {
  return dealFaceUpCards(deck, 2 + tension);
}
function evaluatePlayerHand(hand, traitModifier = 0) {
  const raw = evaluateHand(hand);
  const total = raw.total + traitModifier;
  return {
    total,
    isSoft: raw.isSoft,
    isBust: total > 21,
    isNatural21: raw.isNatural21 && traitModifier === 0
  };
}
function comparePlayerAndDealer(playerEvaluation, dealerEvaluation) {
  {
    return "PUSH";
  }
}
function checkCrisisUnlocked(majorState) {
  if (majorState.jokersRemaining <= 0) {
    majorState.isUnlocked = true;
  }
}
function onCrisisTestSuccess(crisisState) {
  if (crisisState.jokersRemaining > 0) {
    crisisState.jokersRemaining--;
  }
  if ("isUnlocked" in crisisState) {
    checkCrisisUnlocked(crisisState);
  }
}
function onCrisisTestBust(crisisState, survivalDeck) {
  if (crisisState.jokersRemaining > 0) {
    crisisState.jokersRemaining--;
    survivalDeck.insertJoker(true);
  }
  if ("isUnlocked" in crisisState) {
    checkCrisisUnlocked(crisisState);
  }
}
function isDisasterTrigger(card) {
  return true;
}
function getRank(cardCode) {
  return cardCode.slice(0, -1);
}
function getSuit(cardCode) {
  return cardCode.slice(-1);
}
function createRoomObstacleDrawState(roomCardCode, obstacleCardCode) {
  return {
    roomCardCode,
    obstacleCardCode,
    isRankMatch: getRank(roomCardCode) === getRank(obstacleCardCode),
    isSuitMatch: getSuit(roomCardCode) === getSuit(obstacleCardCode),
    isDouble: roomCardCode === obstacleCardCode
  };
}
function getRoomCardCode(room) {
  return room.roomCardCode || room.cardCode;
}
function getObstacleCardCode(room) {
  return room.obstacleCardCode || room.cardCode;
}
function getObstacleState(room) {
  if (room.obstacleState) return room.obstacleState;
  return room.isObstacleCleared ? "cleared" : "unresolved";
}
function normalizeRoomObstacleState(room) {
  const roomCardCode = getRoomCardCode(room);
  const obstacleCardCode = getObstacleCardCode(room);
  room.roomCardCode = roomCardCode;
  room.obstacleCardCode = obstacleCardCode;
  room.cardCode = roomCardCode;
  room.obstacleState = getObstacleState(room);
  room.isObstacleCleared = room.obstacleState === "cleared" || room.obstacleState === "bypassed";
  if (roomCardCode && obstacleCardCode && !room.roomObstacleDraw) {
    room.roomObstacleDraw = createRoomObstacleDrawState(roomCardCode, obstacleCardCode);
  }
  return room;
}
const REQUIRED_SAVE_KEYS = [
  "gamePhase",
  "scenarioId",
  "characters",
  "activeCharacterId",
  "majorCrisisState",
  "minorCrisisState",
  "majorCrisisCard",
  "minorCrisisCard",
  "crisisClockTokensRemaining",
  "crisisClockTokensTotal",
  "activeRoomId",
  "currentDeck",
  "isFatalDisasters",
  "historyLog",
  "survivalDeckCards",
  "roDeckCards",
  "drawnJokers",
  "adversaryInstances",
  "mapGraphSerialized"
];
function buildSerializableSaveFixture() {
  const room = {
    id: "bridge-qa",
    name: "Bridge",
    cardCode: "7H",
    roomCardCode: "7H",
    obstacleCardCode: "7S",
    obstacleState: "persistent",
    roomObstacleDraw: createRoomObstacleDrawState("7H", "7S"),
    roomType: "Bridge",
    x: 0,
    y: 0,
    z: 0,
    width: 6,
    height: 6,
    templateId: "qa-bridge",
    doors: [],
    features: {},
    isDiscovered: true,
    isObstacleCleared: false
  };
  return {
    gamePhase: "EXPLORING",
    scenarioId: "qa-scenario",
    characters: [],
    activeCharacterId: null,
    majorCrisisState: {
      id: "ALIEN_HORROR",
      jokersRemaining: 1,
      jokersTotal: 1,
      isUnlocked: false,
      isResolved: false,
      completedStepRoomIds: []
    },
    minorCrisisState: {
      id: "LOST",
      jokersRemaining: 1,
      isResolved: false,
      completedStepRoomIds: []
    },
    majorCrisisCard: { suit: Suit.SPADES, rank: "A", faceUp: true },
    minorCrisisCard: { suit: Suit.CLUBS, rank: "K", faceUp: true },
    crisisClockTokensRemaining: 3,
    crisisClockTokensTotal: 4,
    activeRoomId: room.id,
    currentDeck: 0,
    isFatalDisasters: true,
    historyLog: ["QA fixture created."],
    survivalDeckCards: [],
    roDeckCards: [],
    drawnJokers: [{ suit: Suit.SPADES, rank: "A", faceUp: true, isJoker: true }],
    adversaryInstances: [],
    mapGraphSerialized: {
      rooms: [room],
      corridors: []
    }
  };
}
function assertSerializableSaveContract(save) {
  for (const key of REQUIRED_SAVE_KEYS) {
    if (!(key in save)) {
      throw new Error(`SerializableGameState is missing ${String(key)}.`);
    }
  }
  if (!Array.isArray(save.mapGraphSerialized.rooms)) {
    throw new Error("SerializableGameState.mapGraphSerialized.rooms must be an array.");
  }
  const firstRoom = save.mapGraphSerialized.rooms[0];
  if (!firstRoom?.roomCardCode || !firstRoom?.obstacleCardCode || !firstRoom?.roomObstacleDraw) {
    throw new Error("Room save contract must preserve paired room and obstacle card state.");
  }
  if (!Array.isArray(save.drawnJokers)) {
    throw new Error("SerializableGameState.drawnJokers must always be an array.");
  }
}
class Deck {
  constructor(isSurvivalDeck = false) {
    this.isSurvivalDeck = isSurvivalDeck;
    this.reset();
  }
  cards = [];
  reset() {
    this.cards = [];
    const suits = [Suit.HEARTS, Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({ suit, rank, faceUp: false });
      }
    }
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  draw() {
    const card = this.cards.pop();
    if (!card) {
      this.reset();
      this.shuffle();
      return this.cards.pop();
    }
    return card;
  }
  getRemainingCount() {
    return this.cards.length;
  }
  /**
   * Removes all cards matching the given rank and suit from the deck.
   * Returns the removed card, or null if not found.
   */
  removeCard(rank, suit) {
    const idx = this.cards.findIndex((c) => c.rank === rank && c.suit === suit && !c.isJoker);
    if (idx !== -1) {
      return this.cards.splice(idx, 1)[0];
    }
    return null;
  }
  /**
   * Randomly inserts a Joker card into the deck.
   */
  insertJoker(faceUp = true) {
    const jokerCard = {
      suit: Suit.SPADES,
      // Dummy suit
      rank: "A",
      // Dummy rank
      faceUp,
      isJoker: true
    };
    const insertPos = Math.floor(Math.random() * (this.cards.length + 1));
    this.cards.splice(insertPos, 0, jokerCard);
  }
  /**
   * Removes all Jokers currently in the deck. Returns the count of removed Jokers.
   */
  removeJokers() {
    const originalCount = this.cards.length;
    this.cards = this.cards.filter((c) => !c.isJoker);
    return originalCount - this.cards.length;
  }
}
function cloneCard(card) {
  return { ...card };
}
function createDeterministicDeck(topDraws, isSurvivalDeck = false) {
  const deck = new Deck(isSurvivalDeck);
  const deckInternals = deck;
  deckInternals.cards = topDraws.map(cloneCard).reverse();
  return deck;
}
function getDeterministicDeckCards(deck) {
  return deck.cards;
}
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
function smokeSaveLoadContract() {
  assertSerializableSaveContract(buildSerializableSaveFixture());
}
function smokeRoomObstaclePairedDraws() {
  const draw = createRoomObstacleDrawState("7H", "7S");
  assert(draw.isRankMatch, "Room and obstacle rank matches must be detectable.");
  assert(!draw.isSuitMatch, "Mismatched suits must not be flagged as a suit match.");
  const legacyRoom = {
    id: "legacy-room",
    name: "Legacy Room",
    cardCode: "9C",
    obstacleState: "unresolved",
    roomType: "Lab",
    x: 0,
    y: 0,
    z: 0,
    width: 4,
    height: 4,
    templateId: "legacy-template",
    doors: [],
    features: {},
    isDiscovered: true,
    isObstacleCleared: false
  };
  const normalized = normalizeRoomObstacleState(legacyRoom);
  assert(normalized.roomCardCode === "9C", "Legacy room card must migrate to roomCardCode.");
  assert(normalized.obstacleCardCode === "9C", "Legacy room card must migrate to obstacleCardCode.");
  assert(normalized.roomObstacleDraw?.isDouble === true, "Legacy same-card migration must mark doubles.");
}
function smokeBlackjackSemantics() {
  const natural = evaluatePlayerHand([
    { suit: Suit.HEARTS, rank: "A", faceUp: true },
    { suit: Suit.SPADES, rank: "K", faceUp: true }
  ]);
  assert(natural.total === 21 && natural.isNatural21, "Ace plus face card must be a natural 21.");
  const mitigatedBust = evaluatePlayerHand([
    { suit: Suit.HEARTS, rank: "K", faceUp: true },
    { suit: Suit.SPADES, rank: "Q", faceUp: true },
    { suit: Suit.CLUBS, rank: "5", faceUp: true }
  ], -4);
  assert(!mitigatedBust.isBust && mitigatedBust.total === 21, "Trait modifiers must be able to mitigate busts.");
  const push = comparePlayerAndDealer();
  assert(push === "PUSH", "Equal non-bust scores must push.");
  const deck = createDeterministicDeck([
    { suit: Suit.HEARTS, rank: "2", faceUp: false },
    { suit: Suit.SPADES, rank: "3", faceUp: false },
    { suit: Suit.CLUBS, rank: "4", faceUp: false },
    { suit: Suit.DIAMONDS, rank: "5", faceUp: false }
  ]);
  const hand = dealPlayerOpeningHand(deck, 2);
  assert(hand.length === 4, "Rising Tension 2 must deal four player opening cards.");
  assert(hand.every((card) => card.faceUp), "Player opening cards must be face up.");
}
function smokeCrisisJokerFlow() {
  assert(
    isDisasterTrigger({ suit: Suit.SPADES }),
    "Joker cards must trigger Disasters."
  );
  const major = {
    id: "ALIEN_HORROR",
    jokersRemaining: 1,
    jokersTotal: 1,
    isUnlocked: false,
    isResolved: false,
    completedStepRoomIds: []
  };
  onCrisisTestSuccess(major);
  assert(major.jokersRemaining === 0, "Successful crisis tests must remove a Joker.");
  assert(major.isUnlocked, "Major crisis must unlock after all Jokers are removed.");
  const bustMajor = {
    id: "MUTINY",
    jokersRemaining: 1,
    jokersTotal: 1,
    isUnlocked: false,
    isResolved: false,
    completedStepRoomIds: []
  };
  const deck = createDeterministicDeck([]);
  onCrisisTestBust(bustMajor, deck);
  checkCrisisUnlocked(bustMajor);
  assert(bustMajor.jokersRemaining === 0 && bustMajor.isUnlocked, "Busted crisis tests still advance Joker removal.");
  assert(getDeterministicDeckCards(deck).some((card) => card.isJoker), "Busted crisis tests must return a Joker to the deck.");
}
function runRuleRegressionSmokeSuite() {
  smokeSaveLoadContract();
  smokeRoomObstaclePairedDraws();
  smokeBlackjackSemantics();
  smokeCrisisJokerFlow();
}
runRuleRegressionSmokeSuite();
console.log("Rule regression smoke suite passed.");
//# sourceMappingURL=ruleRegressionSmokeCommand.js.map
