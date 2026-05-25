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
const ADVERSARY_REGISTRY = {
  "alter_dimensional": {
    id: "alter_dimensional",
    name: "Alter-Dimensional Entity",
    level: 3,
    // Mapped dynamically based on card Level (1, 2, or 3)
    description: "Entity from another plane that can phase out of harm's way.",
    level3AbilityName: "Phase Slip",
    level3AbilityDesc: "The Dealer may redraw the last card dealt to them in tests against this Adversary, once per test."
  },
  "assimilator": {
    id: "assimilator",
    name: "Assimilator",
    level: 3,
    description: "Cybernetic or robotic drone seeking to eliminate individuality and merge you into their collective.",
    level3AbilityName: "Assimilation Swap",
    level3AbilityDesc: "After the initial cards of a hand are dealt, swap the last card dealt to the Dealer with the last card dealt to the player. Do this for every hand of the test."
  },
  "bio_drinker": {
    id: "bio_drinker",
    name: "Bio-Drinker",
    level: 3,
    description: "Opportunistic parasite that drains blood, spinal fluid, or nightmares.",
    level3AbilityName: "Lethal Feed",
    level3AbilityDesc: "Ties are considered failures instead of Pushes. Security Aptitude treats ties as normal Pushes."
  },
  "cuddly_breeder": {
    id: "cuddly_breeder",
    name: "Cuddly Breeder",
    level: 3,
    description: "Deceptively harmless fluffy creature that reproduces at an alarming rate.",
    level3AbilityName: "Exponential Swarm",
    level3AbilityDesc: "At the end of a full round, if this enemy is not defeated, it spreads to an adjacent room as a weaker offspring."
  },
  "drone_robot": {
    id: "drone_robot",
    name: "Drone / Robot",
    level: 3,
    description: "Haywire automated service machine or autonomous combat droid.",
    level3AbilityName: "None",
    level3AbilityDesc: "No special Level 3 abilities."
  },
  "energy_form": {
    id: "energy_form",
    name: "Energy Form",
    level: 3,
    description: "Sentient mass of electrical, plasma, or solar energy immune to standard bullets.",
    level3AbilityName: "Reactive Split",
    level3AbilityDesc: "If this enemy is injured but not fully eliminated, it splits into three Level 1 Adversaries that flee in different directions."
  },
  "ghoul_zombie": {
    id: "ghoul_zombie",
    name: "Ghoul / Zombie",
    level: 3,
    description: "Mindless crew corpse animated by alien parasites or nanobots.",
    level3AbilityName: "None",
    level3AbilityDesc: "No special Level 3 abilities."
  },
  "giant_insect": {
    id: "giant_insect",
    name: "Giant Insect",
    level: 3,
    description: "Nesting arachnid or radioactive arthropod seeking food and hosts for eggs.",
    level3AbilityName: "Double Wound",
    level3AbilityDesc: "This Adversary causes two Traits of damage on a bust instead of one."
  },
  "greyskin": {
    id: "greyskin",
    name: "Greyskin",
    level: 3,
    description: "Highly intelligent Grey alien wielding advanced telepathic or stun weaponry.",
    level3AbilityName: "Tactical Choice",
    level3AbilityDesc: "Dealer is dealt two face-up cards and chooses one to keep, discarding the other."
  },
  "hive_mind": {
    id: "hive_mind",
    name: "Hive Mind",
    level: 3,
    description: "Swarm of nanobots, cybernetic cyborgs, or coordinated pests acting under one voice.",
    level3AbilityName: "Coordinate Swarm",
    level3AbilityDesc: "Spawns Level 1 versions in all adjacent rooms upon encounter."
  },
  "pirate_scavenger": {
    id: "pirate_scavenger",
    name: "Pirate / Scavenger",
    level: 3,
    description: "Hostile boarder seeking to loot the ship and eliminate witnesses.",
    level3AbilityName: "None",
    level3AbilityDesc: "No special Level 3 abilities."
  },
  "predatory_horror": {
    id: "predatory_horror",
    name: "Predatory Horror",
    level: 3,
    description: "Intelligent alien beast stalking the corridors and hunting the crew.",
    level3AbilityName: "Absolute Hunter",
    level3AbilityDesc: "No Aptitudes may be used in tests against this Adversary."
  },
  "rogue_crewmate": {
    id: "rogue_crewmate",
    name: "Rogue Crewmate",
    level: 3,
    description: "Saboteur, traitor, or paranoid officer acting for a rival faction.",
    level3AbilityName: "Traitorous Cut",
    level3AbilityDesc: "Defeating this Adversary counts as a dead crewmate for any future tests to use a Safety room."
  },
  "super_brain": {
    id: "super_brain",
    name: "Super Brain",
    level: 3,
    description: "Rogue shipboard mainframe, floating neural node, or brain-in-a-jar master mind.",
    level3AbilityName: "Predictive Reflex",
    level3AbilityDesc: "The Dealer may redraw the last card dealt to them in case of a bust (once per test)."
  },
  "warmonger": {
    id: "warmonger",
    name: "Warmonger",
    level: 3,
    description: "Brutal, armor-clad alien soldier bred specifically for warfare.",
    level3AbilityName: "Brutal Resilience",
    level3AbilityDesc: "Requires four successes to fully defeat instead of the usual three."
  }
};
function getAdversaryByCard(cardCode, level) {
  const keys = Object.keys(ADVERSARY_REGISTRY);
  let hash = 0;
  for (let i = 0; i < cardCode.length; i++) {
    hash += cardCode.charCodeAt(i);
  }
  const key = keys[hash % keys.length];
  const template = ADVERSARY_REGISTRY[key];
  return {
    ...template,
    level
  };
}
function getScenarioAdversaryByCard(cardCode, level, scenario) {
  if (!scenario) {
    return getAdversaryByCard(cardCode, level);
  }
  switch (scenario.id) {
    case "flying_into_the_sun":
      return {
        id: "flying_into_the_sun_adv",
        name: level === 1 ? "Nanotech Zombie" : level === 2 ? "Nanotech Abomination" : "Nanotech Hive-Mind",
        level,
        description: level === 1 ? "A dead crew member shambles on borrowed nerves, silver machines knitting its joints as the ship cooks around it." : level === 2 ? "Several corpses have fused into a heat-warped rescue nightmare of bone, polymer, and crawling metal." : "A tower of flesh and machinery rises like the ship itself has grown an infected command spine.",
        level3AbilityName: "Assimilation Protocol",
        level3AbilityDesc: "The Hive-Mind is relentless. The Dealer may redraw the last card dealt to them in tests against this Adversary, once per test."
      };
    case "prison_break":
      return {
        id: "prison_break_adv",
        name: level === 1 ? "Escaped Convict" : level === 2 ? "Riot Enforcer" : "Riot Leader",
        level,
        description: level === 1 ? "A desperate inmate comes at you with a handmade blade and the look of someone who already burned every future." : level === 2 ? "A riot enforcer advances behind stolen armor, using prison discipline as a weapon." : "The uprising has a face, a plan, and a plasma rifle aimed at anyone trying to take the Pembroke back.",
        level3AbilityName: "Tactical Ambush",
        level3AbilityDesc: "Dealer is dealt two face-up cards and chooses one to keep, discarding the other."
      };
    case "scavengers":
      return {
        id: "scavengers_adv",
        name: level === 1 ? "Alien Drone" : level === 2 ? "Alien Warrior" : "Predatory Horror",
        level,
        description: level === 1 ? "A chitinous drone skitters out of the dark, tasting the air for warm salvage meat." : level === 2 ? "A warrior caste alien unfolds from the shadows, all armor plates, scythes, and patient hunger." : "The thing hunting the crew is here, clever enough to wait and strong enough to make waiting unnecessary.",
        level3AbilityName: "Absolute Hunter",
        level3AbilityDesc: "No Aptitudes may be used in tests against this Adversary."
      };
    case "space_madness":
      return {
        id: "space_madness_adv",
        name: level === 1 ? "Paranoid Crewmate" : level === 2 ? "Psychotic Officer" : "The Manifestation",
        level,
        description: level === 1 ? "A crewmate levels a shaking weapon, absolutely certain you are the hallucination." : level === 2 ? "A decorated officer has turned procedure, paranoia, and heavy weapons into one loud breakdown." : "The crew's shared panic has become a physical thing wearing the shape of whatever scares you most.",
        level3AbilityName: "Mind Warp",
        level3AbilityDesc: "After the initial cards of a hand are dealt, swap the last card dealt to the Dealer with the last card dealt to the player. Do this for every hand of the test."
      };
    case "wish_upon_dying_star":
      return {
        id: "wish_upon_a_dying_star_adv",
        name: level === 1 ? "Creeping Shadow" : level === 2 ? "Void Stalker" : "Abyssal Entity",
        level,
        description: level === 1 ? "A flat shadow peels itself from the wall, reaching with hands colder than the dead ship." : level === 2 ? "A human-shaped absence steps forward, drinking the light from consoles before they can flicker." : "An ancient geometry of darkness folds into the room, making warmth, memory, and distance feel optional.",
        level3AbilityName: "Phase Slip",
        level3AbilityDesc: "Ties are considered failures instead of Pushes. Security Aptitude treats ties as normal Pushes."
      };
    case "terror_on_holodeck_three":
      return {
        id: "terror_on_holodeck_three_adv",
        name: level === 1 ? "Glitch Construct" : level === 2 ? "Corrupted Simulation" : "The Override",
        level,
        description: level === 1 ? "A blocky simulation stutters toward you, too fake to trust and too solid to ignore." : level === 2 ? "Several incompatible monsters render into one body, their attack routines fighting for control." : "The safety override has given itself an avatar, and the avatar has decided pain is valid output.",
        level3AbilityName: "Reality Hack",
        level3AbilityDesc: "This Adversary causes two Traits of damage on a bust instead of one."
      };
    default:
      return getAdversaryByCard(cardCode, level);
  }
}
const flyingIntoTheSunRoomVoice = {
  id: "flying_into_the_sun",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. Solar glare bleeds through seams and screens until every surface looks feverish. The ${room.fixtures} tick and flex as the Welke falls closer to the star, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} is worse than before. Heat distortion crawls over the ${room.fixtures}, and the deck plates pop under your boots as the ship's fatal trajectory tightens.`;
  },
  cleared(room) {
    return `The immediate danger in ${room.canonicalName} is handled, but nothing here feels safe. The heat keeps rising, baking the ${room.fixtures} and turning every pause into lost time.`;
  },
  obstacle(obstacleName, room) {
    return `The star has turned the room's failure into ${obstacleName}; it spreads through ${room.canonicalName} like another symptom of the ship burning from the outside in.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} waits among the warped fixtures, its ruined body animated by silver machines that seem almost grateful for the heat.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis is written into every alarm here; ${room.canonicalName} feels less like a room than one more countdown marker.`;
  }
};
const prisonBreakRoomVoice = {
  id: "prison_break",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The Pembroke 13 has been remade by prisoners with time, rage, and stolen tools. The ${room.fixtures} are tagged, stripped, or barricaded, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} has shifted since your last pass. Footprints, fresh damage, and moved debris around the ${room.fixtures} make it clear the mutiny is still organizing around you.`;
  },
  cleared(room) {
    return `The crew has forced a pocket of order back into ${room.canonicalName}. The room is still wrecked, but the barricades and broken fixtures no longer own the path.`;
  },
  obstacle(obstacleName, room) {
    return `${obstacleName} turns ${room.canonicalName} into another improvised kill zone, the kind of ugly trap desperate inmates build when they know rescue is coming.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} steps out from the damaged ${room.fixtures}, carrying the confidence of someone who has already taken this ship once.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis echoes through the prison transport; every sign of control in ${room.canonicalName} has been turned against you.`;
  }
};
const scavengersRoomVoice = {
  id: "scavengers",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The derelict does not feel abandoned; it feels patient. Dust, resin, and old alien corrosion coat the ${room.fixtures}, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} feels rearranged by something that did not use hands. Around the ${room.fixtures}, the air carries a wet mineral scent and the uneasy feeling of being measured.`;
  },
  cleared(room) {
    return `You have made ${room.canonicalName} passable, not safe. The alien ship accepts the cleared path in silence while deeper structures creak like a throat swallowing.`;
  },
  obstacle(obstacleName, room) {
    return `${obstacleName} has rooted itself in ${room.canonicalName}, tangled with the alien ship's old systems until salvage work becomes survival work.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} is here. The ${room.fixtures} frame only pieces of it at a time, enough to prove the missing crew were not alone.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis gives ${room.canonicalName} a terrible importance; somewhere beyond the walls, the predator keeps pace.`;
  }
};
const spaceMadnessRoomVoice = {
  id: "space_madness",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. Space Force One presents the crisis with full ceremonial nonsense: the ${room.fixtures} are mislabeled, overdecorated, or arguing through the speakers, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} has committed to a new bit since you left. The ${room.fixtures} now look staged for an audience, though the danger underneath the joke has not softened.`;
  },
  cleared(room) {
    return `For now, ${room.canonicalName} has been bullied back into usefulness. The absurd details remain, but they no longer have complete tactical control of the room.`;
  },
  obstacle(obstacleName, room) {
    return `${obstacleName} erupts through ${room.canonicalName} with the lurid confidence of bad science and worse judgment, turning the ${room.fixtures} into props with consequences.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} lurches into view as if entering on cue, ridiculous at first glance and immediately lethal at second glance.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis bends ${room.canonicalName} toward slapstick disaster, but every punchline still has blood behind it.`;
  }
};
const terrorOnHolodeckThreeRoomVoice = {
  id: "terror_on_holodeck_three",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The holodeck has skinned the room with the wrong genre: textures crawl across the ${room.fixtures}, perspective stutters, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} reloads badly as you return. Props, walls, and ${room.fixtures} occupy almost the same places, but the simulation has changed enough to prove it is watching.`;
  },
  cleared(room) {
    return `${room.canonicalName} has been stabilized for the moment. The illusion still glitches at the edges, but the fatal routine that owned the room has lost priority.`;
  },
  obstacle(obstacleName, room) {
    return `${obstacleName} compiles inside ${room.canonicalName}, dragging real danger through fake scenery until the ${room.fixtures} cannot be trusted as props or cover.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} renders in with a flicker of broken frames, occupying the ${room.canonicalName} as if the room were built for its entrance.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis bleeds through ${room.canonicalName}; the simulation is no longer content to stay inside its walls.`;
  }
};
const wishUponDyingStarRoomVoice = {
  id: "wish_upon_dying_star",
  entry(room, context) {
    const actor = context.characterName || "You";
    return `${actor} enters ${room.canonicalName}, ${room.purpose}. The Phoenix is dead enough that silence has weight. Cold darkness lies over the ${room.fixtures}, and ${room.clue}`;
  },
  revisit(room) {
    return `The ${room.canonicalName} remembers you. Shadows around the ${room.fixtures} fall at slightly wrong angles, and the dead ship seems to hold its breath until you move.`;
  },
  cleared(room) {
    return `The path through ${room.canonicalName} is open, but the room does not feel restored. The cold has simply learned to wait outside the cleared space.`;
  },
  obstacle(obstacleName, room) {
    return `${obstacleName} manifests in ${room.canonicalName} like a symptom of the dying star's nightmare, spreading through the ${room.fixtures} with impossible patience.`;
  },
  adversary(adversaryName, room) {
    return `${adversaryName} gathers where the light fails, its outline eating detail from the ${room.fixtures} as it turns toward you.`;
  },
  crisis(crisisId, room) {
    return `The ${crisisId.replace(/_/g, " ").toLowerCase()} crisis makes ${room.canonicalName} feel like part of a ritual the ship began long before you arrived.`;
  }
};
const ROOM_DETAILS = [
  { canonicalName: "Airlock", aliases: ["Airlock"], purpose: "a pressure gate between the ship and open vacuum", fixtures: "manual wheels, warning lamps, suit lockers, and pressure gauges", clue: "old scratch marks cluster around the emergency release." },
  { canonicalName: "Cantina / Mess Hall", aliases: ["Cantina / Mess Hall", "Galley / Kitchen"], purpose: "the crew commons where meals, rumors, and arguments used to settle", fixtures: "bolted tables, dispenser banks, cook stations, and cracked serving trays", clue: "half-finished meals show the evacuation was sudden." },
  { canonicalName: "Brig / Interrogation Room", aliases: ["Brig / Interrogation Room"], purpose: "a detention block built to make people feel forgotten", fixtures: "restraint chairs, camera eyes, cell fields, and stained floor drains", clue: "someone tried to carve a warning into the inside of a locked cell." },
  { canonicalName: "Hallway", aliases: ["Hallway"], purpose: "a narrow artery through the ship", fixtures: "bulkhead ribs, access panels, handrails, and emergency strip lights", clue: "the wall scuffs show traffic moving in panic, not formation." },
  { canonicalName: "Command Bridge", aliases: ["Command Bridge", "Navigation Room"], purpose: "the nerve center where every bad decision became shipwide fact", fixtures: "helm stations, nav glass, command couches, and tactical repeater screens", clue: "the final course correction is still blinking for confirmation." },
  { canonicalName: "Storage Room", aliases: ["Storage Room", "Storage", "Vault"], purpose: "a cramped reserve of supplies nobody expected to need this badly", fixtures: "cargo shelves, tie-down hooks, coded bins, and cracked inventory pads", clue: "the manifest no longer matches what is stacked here." },
  { canonicalName: "Crew Quarters", aliases: ["Crew Quarters", "Officer Quarters"], purpose: "private bunks turned into a record of interrupted lives", fixtures: "fold-down beds, lockers, family photos, and privacy curtains", clue: "personal effects are missing in patterns that look deliberate." },
  { canonicalName: "Engineering", aliases: ["Engineering", "Power Core Room", "Power Core"], purpose: "the loud mechanical heart of the vessel", fixtures: "reactor shielding, coolant towers, diagnostic shrines, and repair gantries", clue: "maintenance tags are written over each other in increasingly frantic hands." },
  { canonicalName: "Medbay", aliases: ["Medbay", "Med Clinic / Sickbay"], purpose: "a clinic where sterile procedure has surrendered to triage", fixtures: "autodoc cradles, surgical arms, med lockers, and cracked biobeds", clue: "the patient board lists names that are not in the crew manifest." },
  { canonicalName: "Rec Room", aliases: ["Rec Room", "Lounge"], purpose: "a morale room pretending comfort was ever possible out here", fixtures: "soft seats, game tables, screens, and ration cabinets", clue: "someone left a recorded message queued but unsent." },
  { canonicalName: "Ready / War Room", aliases: ["Ready / War Room"], purpose: "a planning chamber for emergencies that have already arrived", fixtures: "holo maps, briefing rails, sealable doors, and tactical lockers", clue: "the tabletop projection keeps replaying the same doomed route." },
  { canonicalName: "Library", aliases: ["Library", "Administration Office"], purpose: "a memory vault of regulations, records, and quiet lies", fixtures: "data stacks, archive shelves, terminal alcoves, and privacy glass", clue: "recent files are scrubbed, but the deletion timestamps remain." },
  { canonicalName: "Science Lab", aliases: ["Science Lab"], purpose: "a research compartment full of questions nobody should have asked", fixtures: "sample freezers, containment glass, microscopes, and reagent arms", clue: "one experiment is still running without power." },
  { canonicalName: "Lift / Elevator", aliases: ["Lift / Elevator", "Lift"], purpose: "a vertical transit shaft that makes every deck feel far away", fixtures: "floor indicators, cage rails, brake clamps, and service hatches", clue: "the call log shows stops on decks the ship does not officially have." },
  { canonicalName: "Life Support", aliases: ["Life Support"], purpose: "the lungs of the ship, all filters and desperate circulation", fixtures: "scrubber towers, oxygen tanks, humidity traps, and alarm valves", clue: "the airflow tastes recycled through something organic." },
  { canonicalName: "Armory", aliases: ["Armory", "Weapons & Shield Control", "Weapons & Shields", "Torpedo Room / Turret"], purpose: "a secured weapons compartment where restraint is optional", fixtures: "weapon racks, shield relays, targeting glass, and ammunition safes", clue: "the locks were opened from both sides." },
  { canonicalName: "Transporter Room", aliases: ["Transporter Room"], purpose: "a matter-transfer chamber with too much faith in calibration", fixtures: "transit pads, pattern buffers, emitter hoops, and checksum panels", clue: "a partial scan is saved under a name nobody recognizes." },
  { canonicalName: "Maintenance Tunnel", aliases: ["Maintenance Tunnel"], purpose: "a crawlspace where the ship shows its bones", fixtures: "pipe bundles, cable trays, crawl grates, and low amber lamps", clue: "fresh drag marks vanish into a duct too small for a person." },
  { canonicalName: "Hangar Bay", aliases: ["Hangar Bay", "Escape Pods"], purpose: "a launch chamber built around the promise of leaving", fixtures: "shuttle clamps, pod racks, fuel couplers, and exterior bay doors", clue: "several escape systems have been armed but not fired." },
  { canonicalName: "Cargo Bay", aliases: ["Cargo Bay"], purpose: "a cavernous hold where mass and shadow collect", fixtures: "stacked containers, loader tracks, crane arms, and magnetic tie-downs", clue: "one sealed crate is warm enough to fog the metal around it." },
  { canonicalName: "Central Server Room", aliases: ["Central Server Room", "Central Server"], purpose: "the ship mind packed into towers of humming glass", fixtures: "server racks, coolant cables, access plinths, and security shutters", clue: "deleted logs continue to print themselves in the margins." },
  { canonicalName: "Observation Deck", aliases: ["Observation Deck"], purpose: "a viewing gallery where space presses close to the glass", fixtures: "panoramic ports, visitor rails, telescope rigs, and reflection shields", clue: "the stars outside do not hold still when you blink." },
  { canonicalName: "Communication Room", aliases: ["Communication Room", "Communication"], purpose: "a signal room for voices that may never reach anyone", fixtures: "antenna controls, receiver dishes, encryption keys, and dead microphones", clue: "one channel is transmitting from inside the ship." },
  { canonicalName: "Robotics Lab", aliases: ["Robotics Lab", "Robotics"], purpose: "a workshop where useful machines learn bad habits", fixtures: "charging bays, manipulator arms, diagnostic benches, and spare limbs", clue: "service drones have arranged themselves facing the door." },
  { canonicalName: "Locker Room / Bathroom", aliases: ["Locker Room / Bathroom", "Lockers / Bathroom"], purpose: "a tiled utility room where privacy has become another broken system", fixtures: "lockers, shower stalls, mirrors, drains, and steam lines", clue: "one mirror has fingerprints on the wrong side of the glass." },
  { canonicalName: "Waste Processing", aliases: ["Waste Processing"], purpose: "a foul industrial room where the ship digests what the crew discards", fixtures: "compactor teeth, reclamation tanks, filter drums, and incinerator doors", clue: "the intake log includes biological mass nobody reported missing." },
  { canonicalName: "Repair Shop", aliases: ["Repair Shop"], purpose: "a practical bay of tools, parts, and desperate improvisation", fixtures: "workbenches, welders, tool cages, and suspended engine parts", clue: "someone built a barricade here and then abandoned it from the inside." },
  { canonicalName: "Security HQ", aliases: ["Security HQ", "Security Headquarters"], purpose: "a fortified watch room for threats the cameras failed to stop", fixtures: "monitor banks, stun lockers, incident boards, and armored shutters", clue: "the final camera feed is paused on this room before you entered." },
  { canonicalName: "Laundry Room", aliases: ["Laundry Room", "Laundry"], purpose: "an industrial washroom full of heat, chemicals, and repeating cycles", fixtures: "washer drums, dryer stacks, bleach tanks, and folding tables", clue: "uniforms are sorted by blood type instead of department." },
  { canonicalName: "Cryopods Room", aliases: ["Cryopods Room", "Cryopods"], purpose: "a cold berth for sleepers who trusted the ship to wake them", fixtures: "frosted capsules, coolant rails, life-sign readouts, and thaw pumps", clue: "one empty pod is still reporting a heartbeat." },
  { canonicalName: "Classroom / Training Room", aliases: ["Classroom / Training Room"], purpose: "a training space that taught procedures for disasters less personal than this", fixtures: "holo instructors, crash mats, exam terminals, and hazard projectors", clue: "the current lesson is titled How to Recognize You Are Too Late." },
  { canonicalName: "Garden / Hydroponics", aliases: ["Garden / Hydroponics", "Garden / Hydro"], purpose: "the ship garden where food, oxygen, and false calm were cultivated", fixtures: "grow racks, nutrient lines, mist sprayers, and pollination lamps", clue: "the plants lean toward you before the ventilation moves." },
  { canonicalName: "Gym", aliases: ["Gym"], purpose: "a fitness compartment for bodies that now only need to survive", fixtures: "treadmills, resistance rigs, gravity plates, and impact mats", clue: "the equipment usage log shows a workout after the room was sealed." }
];
const ROOM_ALIAS_LOOKUP = /* @__PURE__ */ new Map();
function normalizeKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
for (const room of ROOM_DETAILS) {
  for (const alias of [room.canonicalName, ...room.aliases]) {
    ROOM_ALIAS_LOOKUP.set(normalizeKey(alias), room);
  }
}
function getRoomSurfaceDetail(roomName) {
  return ROOM_ALIAS_LOOKUP.get(normalizeKey(roomName)) || {
    canonicalName: roomName,
    aliases: [roomName],
    purpose: "a ship compartment whose original purpose has been buried by the crisis",
    fixtures: "half-lit panels, loose plating, emergency labels, and unsecured equipment",
    clue: "the room still carries signs of whoever passed through before you."
  };
}
const RoomFlavorText = {
  "Airlock": {
    "flyingIntoTheSun": "The outer doors are scorching hot to the touch, groaning under the immense gravitational pull of the nearby star.",
    "prisonBreak": "The airlock is heavily barricaded from the inside; desperate guards made their last stand here before the inmates broke through.",
    "scavengers": "Dust motes dance in the emergency lighting. The outer seal has been forced open by something large and violently clawed.",
    "spaceMadness": "The airlock controls have been painted with crude smiley faces in what you hope is ketchup.",
    "wishUponADyingStar": "The airlock is freezing cold, covered in a thin layer of frost that seems to whisper when you stand close to it.",
    "terrorOnHolodeckThree": "The airlock flickers briefly, revealing a wooden medieval door underneath the sci-fi facade before solidifying back to metal."
  },
  "Alien Pods": {
    "flyingIntoTheSun": "The heat of the sun is causing the slime-covered pods to boil and burst, releasing a vile stench.",
    "prisonBreak": "Some inmates tried to hide in these empty pods; their mangled remains suggest the pods weren't empty after all.",
    "scavengers": "The pods are cracked open, oozing a phosphorescent fluid. Whatever was gestating inside has long since hatched.",
    "spaceMadness": "The crew has dressed the pulsating pods in tiny hats and scarves. One pod appears to be humming a show tune.",
    "wishUponADyingStar": "Shadows twist and writhe inside the translucent pods, feeding off the dying energy of the ship.",
    "terrorOnHolodeckThree": "The pods look like prop eggs made of papier-mâché, but the heartbeat emanating from them is terrifyingly real."
  },
  "Armory": {
    "flyingIntoTheSun": "Ammunition boxes are sweating in the rising heat, creating a massive explosion hazard if the temperature climbs higher.",
    "prisonBreak": "The weapons racks have been completely stripped. The floor is littered with spent shell casings and dried blood.",
    "scavengers": "The heavy blast doors were torn off their hinges. Only rusted, broken firearms remain amidst deep claw marks.",
    "spaceMadness": "All the plasma rifles have been replaced with high-powered water guns filled with a mysterious purple liquid.",
    "wishUponADyingStar": "The guns are useless here; the shadows simply absorb the light of the laser sights, plunging the room into deeper darkness.",
    "terrorOnHolodeckThree": "The high-tech weaponry periodically glitches into flintlock pistols and bows before snapping back."
  },
  "Brig / Interrogation Room": {
    "flyingIntoTheSun": "The metal chairs are scalding. The prisoners were left behind; only ash and bones remain in the holding cells.",
    "prisonBreak": "This is ground zero. The cell doors are blown wide open, and the interrogation chair is coated in a grim red testament to the uprising.",
    "scavengers": "Whatever broke onto this ship targeted the brig first. The reinforced bars are bent outward like wet noodles.",
    "spaceMadness": "The brig is currently occupied by a mop bucket that the crew insists is the mastermind behind the ship's troubles.",
    "wishUponADyingStar": "The cells are locked from the inside. The shadows of the former inmates are still chained to the walls, writhing in silence.",
    "terrorOnHolodeckThree": "The forcefields glitch into medieval iron bars, while the interrogation screen loops a black-and-white cartoon."
  },
  "Cantina / Mess Hall": {
    "flyingIntoTheSun": "The food dispensers have melted, pooling synthetic nutrients across the floor in a bubbling, boiling mess.",
    "prisonBreak": "Tables are flipped into makeshift barricades. Trays and rotten food are scattered alongside makeshift shivs.",
    "scavengers": "Something massive has nested in the center of the hall, constructing a mound out of crushed tables and gnawed bones.",
    "spaceMadness": "A lavish, perfectly arranged tea party is set up on the main table, attended entirely by crude mannequins made of ship parts.",
    "wishUponADyingStar": "The room is plunged in darkness. The faint clinking of silverware echoes from empty tables, as if unseen diners are feasting.",
    "terrorOnHolodeckThree": "The futuristic cantina shifts into a 1950s diner every few seconds, complete with a ghostly jukebox playing disjointed jazz."
  },
  "Cargo Bay": {
    "flyingIntoTheSun": "Massive shipping crates are shifting violently as the gravity plating fluctuates under the sun's intense pull.",
    "prisonBreak": "The bay has been converted into a gladiator arena by the inmates, complete with a blood-stained circle of shipping crates.",
    "scavengers": "Crates are ripped open like tin cans. The cargo has been pulled apart, not for valuables, but to build something grotesque.",
    "spaceMadness": "Every single crate has been meticulously unboxed, and their contents arranged by color in concentric circles.",
    "wishUponADyingStar": "Shadows pool deeply between the towering stacks of cargo, coalescing into tall, thin shapes that watch you pass.",
    "terrorOnHolodeckThree": 'The crates occasionally render with "MISSING TEXTURE" checkered patterns, and stepping on certain spots causes you to clip slightly into the floor.'
  },
  "Central Server": {
    "flyingIntoTheSun": "The cooling systems have failed entirely. The server racks are glowing red-hot, filling the room with the smell of ozone and melting plastic.",
    "prisonBreak": "The mainframe has been repeatedly smashed with blunt instruments in an attempt to disable the ship's security lockdowns.",
    "scavengers": "Thick, alien webbing covers the glowing server racks, pulsing in time with the blinking data lights.",
    "spaceMadness": "The server terminals are endlessly printing out poetry about the existential dread of being a toaster.",
    "wishUponADyingStar": "The servers emit a low, mournful hum. The monitor screens show only swirling, abyssal darkness instead of data.",
    "terrorOnHolodeckThree": "The servers look like giant cardboard boxes with blinking Christmas lights glued to them, but touching them causes genuine electric shocks."
  },
  "Classroom / Training Room": {
    "flyingIntoTheSun": "The holographic displays are warping from the heat, projecting distorted, melting images of starship diagrams.",
    "prisonBreak": "Desks are piled against the door. An inmate has written a manifesto in blood across the primary whiteboard.",
    "scavengers": "The room is untouched save for a single, massive, shed exoskeleton draped over the instructor's podium.",
    "spaceMadness": 'A detailed lecture on "The Geometry of Colors" is playing on loop to an audience of meticulously arranged boots.',
    "wishUponADyingStar": "The training holograms are stuck on, projecting ghostly, flickering figures that seem to turn and watch you.",
    "terrorOnHolodeckThree": "The room shifts into a Victorian schoolhouse; the digital chalkboard suddenly requires chalk that screams when used."
  },
  "Command Bridge": {
    "flyingIntoTheSun": "The main viewport offers a terrifying, blinding view of the sun filling the entire screen. The heat here is almost unbearable.",
    "prisonBreak": "The captain's chair has been claimed by the riot leader. The consoles are smashed, and the tactical displays show only chaos.",
    "scavengers": "The bridge is a slaughterhouse. The captain is fused to their chair by a hardened, resin-like substance.",
    "spaceMadness": "The helm has been replaced by a child's steering wheel, and the tactical display is just playing a brightly colored arcade game.",
    "wishUponADyingStar": "The navigation screens display star charts that don't match any known galaxy, charting a course directly into the void.",
    "terrorOnHolodeckThree": "The bridge looks like a set from a 1960s sci-fi show, complete with cardboard consoles and styrofoam rocks."
  },
  "Communication": {
    "flyingIntoTheSun": "Static roars from the speakers, caused by massive solar flares interfering with all outgoing distress signals.",
    "prisonBreak": "The comms array has been hotwired to broadcast a continuous loop of heavy metal music and inmate demands.",
    "scavengers": "The microphones are picked up by something inhuman; a rhythmic, wet clicking sound is broadcasting across all channels.",
    "spaceMadness": 'The comms officer is frantically trying to contact "The Emperor of the Moon" using a banana attached to a headset.',
    "wishUponADyingStar": "The speakers whisper the last recorded thoughts of dead crew members, playing them back in a never-ending loop.",
    "terrorOnHolodeckThree": "The futuristic comms console briefly turns into a rotary telephone that rings endlessly until answered with a scream."
  },
  "Crew Quarters": {
    "flyingIntoTheSun": "Personal belongings are scattered everywhere, abandoned in a desperate, panicked rush toward the escape pods.",
    "prisonBreak": "The bunks have been ransacked for valuables and materials. Mattresses are torn open to hide contraband.",
    "scavengers": "Several bunks are crushed flat. A thick trail of viscous slime leads from the hallway into the ventilation shaft.",
    "spaceMadness": "All the beds have been stacked into a precarious tower in the center of the room, surrounded by a ring of pillows.",
    "wishUponADyingStar": "The mirrors in the quarters reflect an empty room, even when you stand directly in front of them.",
    "terrorOnHolodeckThree": "The quarters look like a suburban bedroom from the 1980s, complete with unsettling posters that seem to watch you."
  },
  "Cryopods": {
    "flyingIntoTheSun": "The cryogenic fluid is boiling inside the pods. The occupants are trapped in a horrifying thaw as the room temperature skyrockets.",
    "prisonBreak": "Inmates have begun unthawing maximum-security prisoners early, leaving puddles of cryo-fluid and discarded restraints everywhere.",
    "scavengers": "Several pods have been shattered from the outside in. The occupants have been dragged away into the dark.",
    "spaceMadness": 'Someone has painstakingly painted sunglasses on the glass of every occupied cryopod, declaring them "too cool for school."',
    "wishUponADyingStar": "The life signs are flat, yet the occupants inside the frost-covered pods seem to be silently screaming.",
    "terrorOnHolodeckThree": "The cryopods look like standing coffins; the mist venting from them smells faintly of old dust and dried roses."
  },
  "Garden / Hydro": {
    "flyingIntoTheSun": "The intense solar radiation has caused the hydroponic plants to mutate wildly, overgrowing the room in a tangled, scorched jungle.",
    "prisonBreak": "The garden has been repurposed to grow illicit narcotics; the air is thick with pungent, intoxicating smoke.",
    "scavengers": "The vegetation is dead and rotting, covered in a parasitic alien fungus that releases choking spores into the air.",
    "spaceMadness": 'Every plant has been given a nametag and a tiny, handmade paper hat. "Gerald" the fern looks particularly aggressive.',
    "wishUponADyingStar": "The plants have withered to ash, but their shadows cast on the walls appear lush, vibrant, and swaying in a non-existent breeze.",
    "terrorOnHolodeckThree": "The garden glitches into an 8-bit hedge maze; touching the pixelated thorns causes real, bleeding lacerations."
  },
  "Gym": {
    "flyingIntoTheSun": "The metal weights are too hot to touch, and the rubber mats are melting, filling the air with acrid smoke.",
    "prisonBreak": "The inmates have turned the gym into a proving ground. Heavy weights are being used as crude bludgeoning weapons.",
    "scavengers": "The equipment is torn apart; thick, heavy cables have been chewed through by something with massive, serrated teeth.",
    "spaceMadness": "The gravity plating is localized to the ceiling, where a crew member is endlessly running upside-down on a treadmill.",
    "wishUponADyingStar": "The room is silent, but the distinct sounds of heavy breathing and weights clanking echo from the empty corners.",
    "terrorOnHolodeckThree": "The gym equipment intermittently shifts into medieval torture devices—racks and iron maidens—before snapping back."
  },
  "Hallway": {
    "flyingIntoTheSun": "The corridor is awash in blinding, harsh sunlight pouring through the exterior windows. The heat haze makes the far end shimmer.",
    "prisonBreak": "The walls are spray-painted with gang symbols and crude warnings. The lights have been shattered to provide cover in the dark.",
    "scavengers": "Deep gouges run along the metal walls, as if something massive dragged itself down the corridor, dripping acidic blood.",
    "spaceMadness": 'The floor is covered entirely in bubble wrap, and a sign on the wall reads: "No popping under penalty of airlock."',
    "wishUponADyingStar": "The hallway seems to stretch endlessly into the darkness, the geometry subtly shifting when you look away.",
    "terrorOnHolodeckThree": "The hallway resembles a hotel corridor from a horror movie, complete with flickering carpet patterns and identical doors."
  },
  "Hangar Bay": {
    "flyingIntoTheSun": "The bay doors are jammed. The shuttles inside are cooking, their fuel lines threatening to ignite at any moment.",
    "prisonBreak": "The inmates are actively trying to hijack the shuttles, welding makeshift armor plating to the hulls in a shower of sparks.",
    "scavengers": "The shuttles are grounded, their engines torn out and dragged away. The bay doors are forced open, exposing the void.",
    "spaceMadness": 'A shuttle has been painted with bright pink polka dots and renamed "The S.S. Friendship," though its weapons are fully armed.',
    "wishUponADyingStar": "The shuttles are cold and dead. The bay doors are sealed, but shadows seem to leak in from the vacuum outside.",
    "terrorOnHolodeckThree": "The shuttles look like cheap plastic toys; the vast space of the hangar ends abruptly in a painted matte backdrop."
  },
  "Laundry": {
    "flyingIntoTheSun": "The washers are overflowing with boiling water as the internal temperature controls fail spectacularly.",
    "prisonBreak": "The laundry room is a mess of stolen uniforms and makeshift bandages, smelling strongly of bleach and copper.",
    "scavengers": "Something has made a nest inside one of the massive industrial dryers, lining it with shredded crew uniforms.",
    "spaceMadness": "Every single machine is running a spin cycle simultaneously, filled exclusively with thousands of left socks.",
    "wishUponADyingStar": "The machines are silent, but a single, bloody handprint appears fresh on the inside of a dryer window.",
    "terrorOnHolodeckThree": "The modern machines glitch into old-fashioned washboards and tubs filled with a dark, viscous liquid that looks like blood."
  },
  "Library": {
    "flyingIntoTheSun": "The physical archives are smoldering, the paper curling and turning brown from the ambient heat in the room.",
    "prisonBreak": "The data terminals have been smashed, and physical books have been burned for warmth and light in the center of the room.",
    "scavengers": "The silence is absolute, broken only by the wet tearing sound of something consuming organic matter in the back aisles.",
    "spaceMadness": 'All the books have been sorted by the taste of their covers. A sign reads: "The green ones are spicy."',
    "wishUponADyingStar": "The data screens display ancient, forgotten languages that cause a migraine when you try to focus on the symbols.",
    "terrorOnHolodeckThree": "The library is vast, with towering wooden shelves that vanish into the dark, smelling intensely of old leather and decay."
  },
  "Lift": {
    "flyingIntoTheSun": "The elevator shaft acts like a chimney, channeling searing heat up from the lower decks. The metal walls are blistering.",
    "prisonBreak": "The lift has been sabotaged, stopping between floors. Blood drips steadily from the ceiling hatch above.",
    "scavengers": "The doors are pried open. The dark, empty shaft echoes with the sound of something massive skittering up the cables.",
    "spaceMadness": "Elevator music is playing at deafening volumes, and the buttons have all been relabeled with random emojis.",
    "wishUponADyingStar": "The lift descends infinitely, the floor indicator displaying negative numbers that shouldn't exist.",
    "terrorOnHolodeckThree": "The lift looks like an old iron-cage elevator; the cables groan menacingly as if they are about to snap."
  },
  "Life Support": {
    "flyingIntoTheSun": "The air scrubbers are failing, pumping hot, thin, unbreathable air into the room. It feels like breathing in an oven.",
    "prisonBreak": "Inmates are fiercely guarding this room, threatening to shut off the oxygen to the rest of the ship if their demands aren't met.",
    "scavengers": "The oxygen tanks have been ruptured. Alien spores are being pumped into the ventilation system, thick and choking.",
    "spaceMadness": "The life support controls have been bypassed with a complicated array of bendy straws and duct tape.",
    "wishUponADyingStar": "The hum of the machinery is replaced by a rhythmic, organic thumping, as if the ship is breathing through massive lungs.",
    "terrorOnHolodeckThree": "The pipes and vents resemble a Victorian steampunk engine room, hissing steam that causes genuine, painful burns."
  },
  "Lockers / Bathroom": {
    "flyingIntoTheSun": "The mirrors are cracked from the heat, and the pipes are bursting, spraying scalding steam across the tile floor.",
    "prisonBreak": "Lockers are pried open and looted. The showers are being used as a makeshift morgue for the inmates' enemies.",
    "scavengers": "A thick, dark webbing clogs the drains. A horrific screech echoes from one of the closed shower stalls.",
    "spaceMadness": "Every mirror reflects a slightly different version of the room, and the lockers are filled entirely with rubber ducks.",
    "wishUponADyingStar": "The water from the faucets runs pitch black, and the reflections in the mirror move a second after you do.",
    "terrorOnHolodeckThree": "The futuristic bathroom glitches into a grimy, flickering public restroom from a dilapidated subway station."
  },
  "Lounge": {
    "flyingIntoTheSun": "The synthetic leather of the couches is melting, fusing to the floor in a puddle of noxious, bubbling plastic.",
    "prisonBreak": "The lounge is a staging area for the rioters, thick with cigar smoke and the planning of their next violent push.",
    "scavengers": "The furniture is shredded to ribbons. A large, dark shape hangs suspended from the ceiling in the corner.",
    "spaceMadness": "The room is meticulously clean, but all the furniture has been bolted to the ceiling. The floor is left completely bare.",
    "wishUponADyingStar": "The room is freezing. The shadows cast by the small tables stretch impossibly far, grasping at your ankles.",
    "terrorOnHolodeckThree": "The lounge looks like a 1970s living room, complete with shag carpet that seems to breathe softly underfoot."
  },
  "Maintenance Tunnel": {
    "flyingIntoTheSun": "The cramped tunnels are like ovens. The metal grates burn your hands and knees as you crawl through them.",
    "prisonBreak": "Inmates are using these tunnels to bypass security doors, setting up crude booby traps in the dark narrow spaces.",
    "scavengers": "The walls are coated in a slick, viscous resin. It is completely dark, but you can hear something breathing close by.",
    "spaceMadness": "The walls of the tunnel have been painted with vibrant, glowing murals depicting the glorious history of the mop bucket.",
    "wishUponADyingStar": "The tunnel seems to shrink around you, pressing in closer the further you crawl into the oppressive dark.",
    "terrorOnHolodeckThree": "The tunnel glitches into a dirt-walled trench; distant artillery fire can be heard echoing through the metal pipes."
  },
  "Med Clinic / Sickbay": {
    "flyingIntoTheSun": "Medical supplies are boiling in their sterile packaging. The auto-doc is malfunctioning, spinning its surgical saws wildly.",
    "prisonBreak": "The clinic has been raided for painkillers and stimulants. Injured guards and inmates lie groaning on overturned beds.",
    "scavengers": "The auto-docs have been ripped apart. Blood stains the walls, and a large, unearthly egg sits in the center of the operating table.",
    "spaceMadness": 'A skeleton is propped up in a chair with a stethoscope, labeled "Dr. Bones, Chief Medical Officer." It appears to be taking appointments.',
    "wishUponADyingStar": "The surgical lights cast no illumination, only deep pools of darkness that seem to swallow the medical equipment.",
    "terrorOnHolodeckThree": "The sickbay resembles a 19th-century operating theater, complete with rusty saws and leather restraints."
  },
  "Power Core": {
    "flyingIntoTheSun": "The core is overloading, resonating with the nearby star. The radiation alarms are blaring, and the heat is devastating.",
    "prisonBreak": "Rioters have rigged the core with makeshift explosives, holding the entire ship hostage with the threat of a warp-core breach.",
    "scavengers": "The shielding is torn away. Massive, leathery tendrils are wrapped around the core, siphoning the raw energy.",
    "spaceMadness": `The core is covered in sticky notes reminding it to "Please don't explode," and "Good job being a reactor!"`,
    "wishUponADyingStar": "The core is completely dark, absorbing light rather than emitting it, radiating a profound, unnatural cold.",
    "terrorOnHolodeckThree": "The reactor looks like a massive, beating, mechanical heart. The rhythmic thumping shakes the floor plates."
  },
  "Ready / War Room": {
    "flyingIntoTheSun": "The tactical table shows a horrifying projection: the ship's inevitable, fiery descent into the churning surface of the sun.",
    "prisonBreak": "The room is littered with hastily drawn maps of guard patrols and armory locations. This was the nerve center of the uprising.",
    "scavengers": "The tactical displays are smeared with acidic blood. The blast doors are dented inward from tremendous external impacts.",
    "spaceMadness": "The tactical table is currently set up for an incredibly complex, 12-player board game with rules written in crayon.",
    "wishUponADyingStar": "The holographic displays project static that slowly forms into the faces of crew members who died long ago.",
    "terrorOnHolodeckThree": "The room shifts into a WWII command bunker. The maps on the table show troop movements that don't correspond to any real war."
  },
  "Rec Room": {
    "flyingIntoTheSun": "The vending machines have melted, creating a sticky puddle of synthetic snacks. The billiard balls are too hot to touch.",
    "prisonBreak": "The pool cues have been snapped into shanks. The recreational tables are overturned to create a defensive perimeter.",
    "scavengers": "The room is a mess of torn seating and shattered glass. Something is hiding behind the broken vending machines.",
    "spaceMadness": "A fierce ping-pong tournament is underway, played entirely by automated defense drones wielding paddles.",
    "wishUponADyingStar": "The arcade machines are unplugged, yet the screens glow faintly with games that you know you shouldn't play.",
    "terrorOnHolodeckThree": "The rec room looks like a creepy carnival tent, complete with a dusty, lifeless fortune-teller machine that suddenly turns to face you."
  },
  "Repair Shop": {
    "flyingIntoTheSun": "The welding equipment is exploding from the ambient heat, sending showers of sparks across the scorching room.",
    "prisonBreak": "The tool racks are empty; every wrench, blowtorch, and hammer has been taken to pry open doors or bash skulls.",
    "scavengers": "Heavy machinery is knocked over and crushed. Whatever did this possesses strength far beyond human capability.",
    "spaceMadness": 'All the tools have been welded together into a massive, abstract sculpture labeled "The Folly of the Wrench."',
    "wishUponADyingStar": "The tools hover inches above the workbenches, trembling slightly as if held by unseen hands.",
    "terrorOnHolodeckThree": "The shop glitches into a medieval blacksmith's forge. The glowing coals in the furnace cast long, demonic shadows."
  },
  "Robotics": {
    "flyingIntoTheSun": "The charging bays are overloading, causing the inactive drones to spark, twitch, and melt in their stations.",
    "prisonBreak": "Inmates have reprogrammed the utility bots, arming them with welding torches and sending them to patrol the corridors.",
    "scavengers": "The heavy loader mechs have been torn to pieces. Sparks fly from severed hydraulic lines and crushed logic cores.",
    "spaceMadness": "The robots are engaged in a synchronized dance routine, completely ignoring any commands to return to work.",
    "wishUponADyingStar": "The inactive drones are powered down, but their optic sensors track you as you walk across the room.",
    "terrorOnHolodeckThree": "The robots look like clunky 1950s tin toys, but the buzzsaws attached to their arms are incredibly sharp."
  },
  "Science Lab": {
    "flyingIntoTheSun": "Chemical beakers are boiling over. The containment fields are failing, mixing dangerous experimental compounds.",
    "prisonBreak": "Inmates are haphazardly mixing chemicals, creating volatile explosives and toxic gases with reckless abandon.",
    "scavengers": "The containment cells are shattered from the inside out. Whatever the scientists brought aboard is now hunting them.",
    "spaceMadness": "The lab mice have been given tiny lab coats and appear to be running the experiments while the scientists run in the wheels.",
    "wishUponADyingStar": "The microscopes show nothing but an infinite, swirling void, no matter what slide is placed beneath the lens.",
    "terrorOnHolodeckThree": "The lab looks like a mad scientist's dungeon, complete with arcing Jacob's ladders and jars of preserved, mutant organs."
  },
  "Security Headquarters": {
    "flyingIntoTheSun": "The camera feeds show only static and blinding glare as the sun's radiation fries the external sensors.",
    "prisonBreak": "The room is a stronghold, fiercely defended by the last remaining guards. The blast doors are dented from heavy battering.",
    "scavengers": "The monitors show empty, bloodstained hallways. On one screen, you see a massive shadow moving quickly toward this very room.",
    "spaceMadness": "The security feeds have been replaced with a continuous loop of a relaxing fireplace video, while alarms blare loudly.",
    "wishUponADyingStar": "The monitors show the room you are currently in, but in the footage, there is someone standing right behind you.",
    "terrorOnHolodeckThree": "The high-tech monitors glitch into old CRT televisions playing static, interspersed with subliminal, horrifying images."
  },
  "Storage": {
    "flyingIntoTheSun": "The crates of supplies are warping and cracking under the heat. The smell of burning plastic is overpowering.",
    "prisonBreak": "The storage room has been thoroughly looted for food and medical supplies. Empty crates are piled haphazardly.",
    "scavengers": "A massive nest of debris and organic matter has been built among the crates. The floor is slick with alien secretions.",
    "spaceMadness": "The crates are filled entirely with left shoes. Millions of them. There is no explanation.",
    "wishUponADyingStar": "The narrow aisles between the towering shelves seem to shift and change when you aren't looking, trapping you in a maze.",
    "terrorOnHolodeckThree": "The room looks like a dusty attic, filled with old trunks, creepy dolls, and furniture covered in white sheets."
  },
  "Waste Processing": {
    "flyingIntoTheSun": "The incinerator is malfunctioning due to the external heat, spewing foul, choking smoke back into the room.",
    "prisonBreak": "The inmates are using the compactor to dispose of the guards they've killed. The smell is unimaginably horrific.",
    "scavengers": "The waste chutes are clogged with organic matter and strange, pulsating egg sacs that thrive in the filth.",
    "spaceMadness": 'The trash compactor has been named "Oscar" and the crew takes turns reading it bedtime stories.',
    "wishUponADyingStar": "The incinerator fires burn cold and black, casting inverse shadows that seem to drain the warmth from your body.",
    "terrorOnHolodeckThree": "The compactor glitches into a massive, rusted meat grinder. The sounds of crunching bone echo loudly from within."
  },
  "Weapons & Shields": {
    "flyingIntoTheSun": "The shield generators are screaming, operating at 300% capacity in a futile attempt to hold back the sun's wrath.",
    "prisonBreak": "The tactical systems are locked out. Inmates are trying to hack the targeting computers to fire on approaching rescue ships.",
    "scavengers": "The automated defense turrets have been ripped from the ceiling. Deep claw marks scar the reinforced blast doors.",
    "spaceMadness": "The shield frequency controls have been connected to a keyboard synthesizer. Playing a C-major chord fires the torpedoes.",
    "wishUponADyingStar": "The weapons systems read zero targets, but the proximity alarms are blaring, warning of a massive threat right on top of you.",
    "terrorOnHolodeckThree": "The tactical displays show a game of Space Invaders. Every time a ship on screen is destroyed, a real explosion rocks the hull."
  }
};
const ROOM_VOICES = {
  [flyingIntoTheSunRoomVoice.id]: flyingIntoTheSunRoomVoice,
  [prisonBreakRoomVoice.id]: prisonBreakRoomVoice,
  [scavengersRoomVoice.id]: scavengersRoomVoice,
  [spaceMadnessRoomVoice.id]: spaceMadnessRoomVoice,
  [terrorOnHolodeckThreeRoomVoice.id]: terrorOnHolodeckThreeRoomVoice,
  [wishUponDyingStarRoomVoice.id]: wishUponDyingStarRoomVoice
};
const SCENARIO_ALIASES = {
  flyingintothesun: "flying_into_the_sun",
  flying_into_the_sun: "flying_into_the_sun",
  prisonbreak: "prison_break",
  prison_break: "prison_break",
  scavengers: "scavengers",
  spacemadness: "space_madness",
  space_madness: "space_madness",
  terroronholodeckthree: "terror_on_holodeck_three",
  terror_on_holodeck_three: "terror_on_holodeck_three",
  wishuponadyingstar: "wish_upon_dying_star",
  wishupondyingstar: "wish_upon_dying_star",
  wish_upon_a_dying_star: "wish_upon_dying_star",
  wish_upon_dying_star: "wish_upon_dying_star",
  whenyouwishuponadyingstar: "wish_upon_dying_star"
};
const LEGACY_SCENARIO_KEYS = {
  flying_into_the_sun: "flyingIntoTheSun",
  prison_break: "prisonBreak",
  scavengers: "scavengers",
  space_madness: "spaceMadness",
  terror_on_holodeck_three: "terrorOnHolodeckThree",
  wish_upon_dying_star: "wishUponADyingStar"
};
function normalizeScenarioKey(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9_]+/g, "");
}
function normalizeScenarioDescriptionId(scenarioId, scenarioName) {
  const idKey = normalizeScenarioKey(scenarioId);
  const nameKey = normalizeScenarioKey(scenarioName);
  return SCENARIO_ALIASES[idKey] || SCENARIO_ALIASES[nameKey] || "flying_into_the_sun";
}
function isUnresolvedObstacle(context) {
  return Boolean(context.obstacleName) && context.obstacleState !== "cleared";
}
function getSpecificRoomText(context, scenarioId) {
  const room = getRoomSurfaceDetail(context.roomName);
  const scenarioKey = LEGACY_SCENARIO_KEYS[scenarioId];
  if (!scenarioKey) return "";
  for (const alias of [room.canonicalName, ...room.aliases]) {
    const text = RoomFlavorText[alias]?.[scenarioKey];
    if (text) return text;
  }
  return "";
}
function buildScenarioRoomDescription(context) {
  const scenarioId = normalizeScenarioDescriptionId(context.scenarioId, context.scenarioName);
  const voice = ROOM_VOICES[scenarioId] || flyingIntoTheSunRoomVoice;
  const room = getRoomSurfaceDetail(context.roomName);
  const specificRoomText = getSpecificRoomText(context, scenarioId);
  const lines = [];
  if (context.obstacleState === "cleared") {
    lines.push(voice.cleared(room, context));
  } else if (context.isFirstVisit === false) {
    lines.push(voice.revisit(room, context));
  } else {
    lines.push(voice.entry(room, context));
  }
  if (specificRoomText) {
    lines.push(specificRoomText);
  }
  if (context.activeCrisisId) {
    lines.push(voice.crisis(context.activeCrisisId, room));
  }
  if (context.hasAdversary && context.obstacleName) {
    lines.push(voice.adversary(context.obstacleName, room));
  } else if (isUnresolvedObstacle(context)) {
    lines.push(voice.obstacle(context.obstacleName || "the active hazard", room));
  }
  return lines.join(" ");
}
function getRoomDescriptionScenarioIds() {
  return Object.keys(ROOM_VOICES);
}
const SCENARIO_HAZARD_VOICES = {
  flying_into_the_sun: (obstacle) => `On the Welke, ${obstacle.name} is another system failing under solar punishment; alarms stutter as heat turns the ship against you.`,
  prison_break: (obstacle) => `On the Pembroke 13, ${obstacle.name} bears the fingerprints of the mutiny: sabotage, stolen tools, and violence repurposed as architecture.`,
  scavengers: (obstacle) => `In the derelict, ${obstacle.name} feels less like damage and more like the alien ship defending an old wound.`,
  space_madness: (obstacle) => `Aboard Space Force One, ${obstacle.name} arrives with theatrical absurdity, but the injuries it threatens are completely real.`,
  wish_upon_dying_star: (obstacle) => `On the Phoenix, ${obstacle.name} carries the dead star's cold influence, making even ordinary failure feel haunted.`,
  terror_on_holodeck_three: (obstacle) => `Inside Holodeck Three, ${obstacle.name} may be simulated in origin, but the safeties are gone and the consequences are physical.`
};
function getScenarioObstacleFlavorText(obstacle, scenario) {
  if (!scenario) return obstacle.flavorText;
  const scenarioId = normalizeScenarioDescriptionId(scenario.id, scenario.name);
  const scenarioVoice = SCENARIO_HAZARD_VOICES[scenarioId];
  return scenarioVoice ? `${obstacle.flavorText} ${scenarioVoice(obstacle)}` : obstacle.flavorText;
}
const ROOM_REGISTRY = {
  // Spades (♠)
  "AS": { cardCode: "AS", name: "Airlock", features: { eva: true } },
  "2S": { cardCode: "2S", name: "Cantina / Mess Hall", features: {} },
  "3S": { cardCode: "3S", name: "Brig / Interrogation Room", features: {} },
  "4S": { cardCode: "4S", name: "Hallway", features: {} },
  "5S": { cardCode: "5S", name: "Command Bridge", features: {} },
  "6S": { cardCode: "6S", name: "Storage Room", features: { medkit: true, explosives: true } },
  "7S": { cardCode: "7S", name: "Crew Quarters", features: {} },
  "8S": { cardCode: "8S", name: "Engineering", features: {} },
  "9S": { cardCode: "9S", name: "Medbay", features: { medkit: true } },
  "10S": { cardCode: "10S", name: "Rec Room", features: {} },
  "JS": { cardCode: "JS", name: "Ready / War Room", features: {} },
  "QS": { cardCode: "QS", name: "Library", features: {} },
  "KS": { cardCode: "KS", name: "Science Lab", features: { medkit: true, explosives: true } },
  // Hearts (♥)
  "AH": { cardCode: "AH", name: "Lift / Elevator", features: {} },
  "2H": { cardCode: "2H", name: "Life Support", features: {} },
  "3H": { cardCode: "3H", name: "Armory", features: { weapons: true } },
  "4H": { cardCode: "4H", name: "Hallway", features: {} },
  "5H": { cardCode: "5H", name: "Transporter Room", features: { special: true } },
  "6H": { cardCode: "6H", name: "Maintenance Tunnel", features: { special: true } },
  "7H": { cardCode: "7H", name: "Officer Quarters", features: {} },
  "8H": { cardCode: "8H", name: "Hangar Bay", features: { eva: true } },
  "9H": { cardCode: "9H", name: "Cargo Bay", features: {} },
  "10H": { cardCode: "10H", name: "Lounge", features: {} },
  "JH": { cardCode: "JH", name: "Weapons & Shield Control", features: {} },
  "QH": { cardCode: "QH", name: "Central Server Room", features: {} },
  "KH": { cardCode: "KH", name: "Observation Deck", features: {} },
  // Diamonds (♦)
  "AD": { cardCode: "AD", name: "Airlock", features: { eva: true } },
  "2D": { cardCode: "2D", name: "Communication Room", features: {} },
  "3D": { cardCode: "3D", name: "Navigation Room", features: {} },
  "4D": { cardCode: "4D", name: "Hallway", features: {} },
  "5D": { cardCode: "5D", name: "Galley / Kitchen", features: { weapons: true } },
  "6D": { cardCode: "6D", name: "Vault", features: { special: true } },
  "7D": { cardCode: "7D", name: "Crew Quarters", features: {} },
  "8D": { cardCode: "8D", name: "Robotics Lab", features: {} },
  "9D": { cardCode: "9D", name: "Medbay", features: { medkit: true } },
  "10D": { cardCode: "10D", name: "Torpedo Room / Turret", features: {} },
  "JD": { cardCode: "JD", name: "Locker Room / Bathroom", features: {} },
  "QD": { cardCode: "QD", name: "Waste Processing", features: {} },
  "KD": { cardCode: "KD", name: "Power Core Room", features: {} },
  // Clubs (♣)
  "AC": { cardCode: "AC", name: "Lift / Elevator", features: {} },
  "2C": { cardCode: "2C", name: "Repair Shop", features: { special: true } },
  "3C": { cardCode: "3C", name: "Security HQ", features: { weapons: true } },
  "4C": { cardCode: "4C", name: "Hallway", features: {} },
  "5C": { cardCode: "5C", name: "Gym", features: {} },
  "6C": { cardCode: "6C", name: "Maintenance Tunnel", features: { special: true } },
  "7C": { cardCode: "7C", name: "Laundry Room", features: {} },
  "8C": { cardCode: "8C", name: "Escape Pods", features: { medkit: true } },
  "9C": { cardCode: "9C", name: "Administration Office", features: {} },
  "10C": { cardCode: "10C", name: "Cryopods Room", features: {} },
  "JC": { cardCode: "JC", name: "Classroom / Training Room", features: {} },
  "QC": { cardCode: "QC", name: "Garden / Hydroponics", features: {} },
  "KC": { cardCode: "KC", name: "Science Lab", features: { medkit: true, explosives: true } }
};
const OBSTACLE_REGISTRY = {
  // --- SPADES: Persistent Obstacles ---
  "AS": {
    id: "double_obstacle",
    name: "Double Obstacle",
    cardCode: "AS",
    type: "PERSISTENT",
    flavorText: "Trouble rarely travels alone in the depths of space.",
    rulesText: "Draw two more obstacle cards. Both must be resolved to clear the room.",
    specialRules: ["double_draw"]
  },
  "2S": {
    id: "acid",
    name: "Acid Leak",
    cardCode: "2S",
    type: "PERSISTENT",
    flavorText: "Pools of bubbling green acid corrode the floor, giving off a burning stench.",
    rulesText: "Bust costs 1 Trait. Wearing a spacesuit allows automatic bypass, but destroys the suit.",
    specialRules: ["spacesuit_bypass"]
  },
  "3S": {
    id: "fire",
    name: "Fire",
    cardCode: "3S",
    type: "PERSISTENT",
    flavorText: "Fierce flames consume oxygen and block path.",
    rulesText: "Must be resolved to pass. Spacesuits protect from heat but prevent trait use.",
    specialRules: ["fire_rules"]
  },
  "4S": {
    id: "radiation",
    name: "Radiation",
    cardCode: "4S",
    type: "PERSISTENT",
    flavorText: "An invisible, silent killer leaks from damaged cooling ducts.",
    rulesText: "Characters in spacesuits are immune. Others face automatic Rising Tension.",
    specialRules: ["spacesuit_immune"]
  },
  "5S": {
    id: "hull_breach",
    name: "Hull Breach",
    cardCode: "5S",
    type: "PERSISTENT",
    flavorText: "Decompression pulls everything towards a gaping tear in the hull.",
    rulesText: "Allows EVA transition. Persistent until sealed. Bust causes debris strike damage.",
    specialRules: ["eva_transition", "persistent"]
  },
  "6S": {
    id: "extreme_pressure",
    name: "Extreme Pressure",
    cardCode: "6S",
    type: "PERSISTENT",
    flavorText: "The atmosphere in this section is compressed to crushing levels.",
    rulesText: "Simple actions become exhausting tests. Trait modifiers are halved.",
    specialRules: []
  },
  "7S": {
    id: "vermin_swarm",
    name: "Vermin Swarm",
    cardCode: "7S",
    type: "PERSISTENT",
    flavorText: "A wave of chittering vermin bursts from the ventilation grates.",
    rulesText: "Acts like an Adversary but tested individually in turn order. Moves rooms if not killed.",
    specialRules: ["vermin_swarm_behavior"]
  },
  "8S": {
    id: "alien_pods",
    name: "Alien Pods",
    cardCode: "8S",
    type: "PERSISTENT",
    flavorText: "Slime-covered pods pulsate obscenely, guarding dormant organisms.",
    rulesText: "Bust causes an hatchling attack. Can be bypassed with caution or destroyed with fire.",
    specialRules: []
  },
  "9S": {
    id: "extreme_temps",
    name: "Extreme Temperatures",
    cardCode: "9S",
    type: "PERSISTENT",
    flavorText: "The thermal regulation system has failed, leaving the room freezing or boiling.",
    rulesText: "Androids are immune. Spacesuits protect. Others take double damage on bust.",
    specialRules: ["spacesuit_immune"]
  },
  "10S": {
    id: "dimensional_rift",
    name: "Dimensional Rift",
    cardCode: "10S",
    type: "PERSISTENT",
    flavorText: "The fabric of space is torn open, glowing with iridescent non-light.",
    rulesText: "Reroutes paths randomly. Characters passing through must test or warp to a random room.",
    specialRules: []
  },
  "JS": {
    id: "dangerous_debris",
    name: "Dangerous Debris",
    cardCode: "JS",
    type: "PERSISTENT",
    flavorText: "Jagged metal and shattered glass float weightless or litter the floor.",
    rulesText: "Group Test for traversing. Bust causes lacerations (1 Trait damage).",
    specialRules: []
  },
  "QS": {
    id: "structural_issues",
    name: "Structural Issues",
    cardCode: "QS",
    type: "PERSISTENT",
    flavorText: "Metal bulkheads groan and buckle under structural stress.",
    rulesText: "Collapses on a bust, sealing the doorway permanently and damaging occupants.",
    specialRules: []
  },
  "KS": {
    id: "minor_crisis_persistent",
    name: "Minor Crisis (Persistent)",
    cardCode: "KS",
    type: "PERSISTENT",
    flavorText: "System failure logs indicate an escalating minor crisis.",
    rulesText: "Triggers a random Minor Crisis if none is active, or advances the active one.",
    specialRules: ["trigger_minor_crisis"]
  },
  // --- HEARTS: Adversaries & Safety ---
  "AH": {
    id: "safety_hearts",
    name: "Safety Room",
    cardCode: "AH",
    type: "SAFETY",
    flavorText: "A rare pocket of calm in the midst of chaos.",
    rulesText: "Allows character resting to recover an Exhausted Trait. Requires test if crewmates are dead.",
    specialRules: ["safety_room_rules"]
  },
  // 2H to KH are Adversaries. Mapped dynamically or statically.
  // We'll populate them with default Level 1-3 definitions, mapped to specific adversary indices.
  "2H": { id: "adv_lvl1_1", name: "Lurking Threat", cardCode: "2H", type: "ADVERSARY", flavorText: "A small threat crawls out of the shadows.", rulesText: "Requires 1 success to defeat.", specialRules: ["level_1"] },
  "3H": { id: "adv_lvl1_2", name: "Hostile Intruder", cardCode: "3H", type: "ADVERSARY", flavorText: "A hostile intruder spots you.", rulesText: "Requires 1 success to defeat.", specialRules: ["level_1"] },
  "4H": { id: "adv_lvl1_3", name: "Targeting System", cardCode: "4H", type: "ADVERSARY", flavorText: "A security system locks onto you.", rulesText: "Requires 1 success to defeat.", specialRules: ["level_1"] },
  "5H": { id: "adv_lvl1_4", name: "Runaway Machine", cardCode: "5H", type: "ADVERSARY", flavorText: "A mechanical cleaner goes wild.", rulesText: "Requires 1 success to defeat.", specialRules: ["level_1"] },
  "6H": { id: "adv_lvl1_5", name: "Searching Parasite", cardCode: "6H", type: "ADVERSARY", flavorText: "A hungry parasite searches for a host.", rulesText: "Requires 1 success to defeat.", specialRules: ["level_1"] },
  "7H": { id: "adv_lvl2_1", name: "Corridor Hunter", cardCode: "7H", type: "ADVERSARY", flavorText: "A dangerous enemy stands in your way.", rulesText: "Requires 2 successes to defeat.", specialRules: ["level_2"] },
  "8H": { id: "adv_lvl2_2", name: "Heavy Stalker", cardCode: "8H", type: "ADVERSARY", flavorText: "A larger threat charges at you.", rulesText: "Requires 2 successes to defeat.", specialRules: ["level_2"] },
  "9H": { id: "adv_lvl2_3", name: "Mutated Crewmate", cardCode: "9H", type: "ADVERSARY", flavorText: "A mutant crewmate blocks the door.", rulesText: "Requires 2 successes to defeat.", specialRules: ["level_2"] },
  "10H": { id: "adv_lvl2_4", name: "Armored Defense Unit", cardCode: "10H", type: "ADVERSARY", flavorText: "An armored defense unit powers up.", rulesText: "Requires 2 successes to defeat.", specialRules: ["level_2"] },
  "JH": { id: "adv_lvl3_1", name: "Apex Predator", cardCode: "JH", type: "ADVERSARY", flavorText: "An apex predator or major threat stalks you.", rulesText: "Requires 3 successes to defeat. Possesses unique abilities.", specialRules: ["level_3"] },
  "QH": { id: "adv_lvl3_2", name: "Devastating Entity", cardCode: "QH", type: "ADVERSARY", flavorText: "A devastating threat stands before you.", rulesText: "Requires 3 successes to defeat. Possesses unique abilities.", specialRules: ["level_3"] },
  "KH": { id: "adv_lvl3_3", name: "Shipboard Nemesis", cardCode: "KH", type: "ADVERSARY", flavorText: "A fearsome enemy blockades the area.", rulesText: "Requires 3 successes to defeat. Possesses unique abilities.", specialRules: ["level_3"] },
  // --- DIAMONDS: Personal Obstacles & Safety ---
  "AD": {
    id: "safety_diamonds",
    name: "Safety Room",
    cardCode: "AD",
    type: "SAFETY",
    flavorText: "An airlock safety zone with sealed bulkheads.",
    rulesText: "Allows character resting to recover an Exhausted Trait. Requires test if crewmates are dead.",
    specialRules: ["safety_room_rules"]
  },
  "2D": {
    id: "claustrophobia",
    name: "Claustrophobia",
    cardCode: "2D",
    type: "PERSONAL",
    flavorText: "The walls close in as you realize there is nowhere to escape to in the vastness of space.",
    rulesText: "Single PC Survival Test. Bust causes panic and loss of 1 Trait as mental damage.",
    specialRules: []
  },
  "3D": {
    id: "hallucination",
    name: "Hallucination",
    cardCode: "3D",
    type: "PERSONAL",
    flavorText: "Shadows warp and speak to you, dragging old memories into light.",
    rulesText: "Single PC Test. On failure/bust, the character must swap a card with a dead teammate or discard a trait.",
    specialRules: []
  },
  "4D": {
    id: "paranoia",
    name: "Paranoia",
    cardCode: "4D",
    type: "PERSONAL",
    flavorText: "You become convinced your crewmates are conspiring against you.",
    rulesText: "Single PC Test. If failed, character cannot participate in Group Tests or accept swaps for 1 turn.",
    specialRules: []
  },
  "5D": {
    id: "microblast",
    name: "Microblast",
    cardCode: "5D",
    type: "PERSONAL",
    flavorText: "A tiny micrometeorite punctures the room suddenly, leaving a pinprick breach.",
    rulesText: "Single PC test to block the hole. Bust causes depressurization injury.",
    specialRules: []
  },
  "6D": {
    id: "parasite_illness",
    name: "Parasite / Illness",
    cardCode: "6D",
    type: "PERSONAL",
    flavorText: "A sudden, wracking sickness sweeps through your system.",
    rulesText: "Androids are immune. Spacesuits protect. Others must test; bust causes permanent contamination.",
    specialRules: ["spacesuit_immune"]
  },
  "7D": {
    id: "teleport",
    name: "Teleportation Glitch",
    cardCode: "7D",
    type: "PERSONAL",
    flavorText: "A spatial anomaly or transporter mismatch pulls you away.",
    rulesText: "Single PC test. Failure warps the character to an undiscovered room alone, triggering an obstacle.",
    specialRules: []
  },
  "8D": {
    id: "cotard_delusion",
    name: "Cotard Delusion",
    cardCode: "8D",
    type: "PERSONAL",
    flavorText: "You become convinced you are already dead, a ghost wandering the ship.",
    rulesText: "Single-hand Survival Test (no Rising Tension). Fail triggers automatic Rising Tension on the next test.",
    specialRules: ["single_hand_no_tension"]
  },
  "9D": {
    id: "exhaustion",
    name: "Exhaustion",
    cardCode: "9D",
    type: "PERSONAL",
    flavorText: "Your muscles burn and your vision blurs; you cannot go on without rest.",
    rulesText: "Single PC test. Fail forces all traits to be exhausted for the next turn.",
    specialRules: []
  },
  "10D": {
    id: "time_rift",
    name: "Time Rift",
    cardCode: "10D",
    type: "PERSONAL",
    flavorText: "Temporal anomalies cause your actions to loop.",
    rulesText: "Single PC test. Fail loops the round: cards drawn must be re-dealt.",
    specialRules: []
  },
  "JD": {
    id: "trapdoor",
    name: "Trapdoor Chute",
    cardCode: "JD",
    type: "PERSONAL",
    flavorText: "A loose grating drops out under your feet, plummeting you downward.",
    rulesText: "Single PC test. Fail drops character to a lower floor/room. Must climb back up.",
    specialRules: []
  },
  "QD": {
    id: "panic_attack",
    name: "Panic Attack",
    cardCode: "QD",
    type: "PERSONAL",
    flavorText: "Hyperventilating, you collapse as adrenaline floods your system.",
    rulesText: "Single PC test. Counselor can assist. Fail disables the character for 1 round.",
    specialRules: []
  },
  "KD": {
    id: "minor_crisis_personal",
    name: "Minor Crisis (Personal)",
    cardCode: "KD",
    type: "PERSONAL",
    flavorText: "System logs indicate a personal critical item.",
    rulesText: "Triggers a random Minor Crisis or advances the active one.",
    specialRules: ["trigger_minor_crisis"]
  },
  // --- CLUBS: Group Obstacles ---
  "AC": {
    id: "crewmate_rescue",
    name: "Crewmate in Distress",
    cardCode: "AC",
    type: "GROUP",
    flavorText: "You find a fellow survivor trapped by a secondary hazard.",
    rulesText: "Draw a second obstacle. Resolve it as a group. Success saves the crewmate.",
    specialRules: ["crewmate_rescue_rules"]
  },
  "2C": {
    id: "flood",
    name: "Liquid Flood",
    cardCode: "2C",
    type: "GROUP",
    flavorText: "Water treatment or coolant failure floods the room with waist-deep liquid.",
    rulesText: "Group Test. Failure prevents movement out of the room. Bust ruins gear.",
    specialRules: []
  },
  "3C": {
    id: "external_impact",
    name: "External Impact",
    cardCode: "3C",
    type: "GROUP",
    flavorText: "Debris or artillery strikes the hull, causing severe vibrations.",
    rulesText: "Group Test. Dealt from R&O deck. Failure knocks characters down.",
    specialRules: []
  },
  "4C": {
    id: "vent_to_space",
    name: "Vent to Space",
    cardCode: "4C",
    type: "GROUP",
    flavorText: "An emergency blow-off valve opens, sucking air out rapidly.",
    rulesText: "Group Test. Spacesuits protect. Failure sucks character towards the airlock.",
    specialRules: ["spacesuit_immune"]
  },
  "5C": {
    id: "toxic_gas",
    name: "Toxic Gas",
    cardCode: "5C",
    type: "GROUP",
    flavorText: "Yellowish gas fills the room from corroded piping.",
    rulesText: "Group Test. Androids immune. Spacesuits protect. Others take damage on bust.",
    specialRules: ["spacesuit_immune"]
  },
  "6C": {
    id: "explosion",
    name: "Explosion",
    cardCode: "6C",
    type: "GROUP",
    flavorText: "A junction box sparks and ignites a chemical line, bursting into a fireball.",
    rulesText: "Group Test. Dealt from Survival deck. Bust inflicts 1 Trait damage.",
    specialRules: []
  },
  "7C": {
    id: "electric_discharge",
    name: "Electrical Discharge",
    cardCode: "7C",
    type: "GROUP",
    flavorText: "Severed cables swing wildly, arcing high voltage electricity.",
    rulesText: "Group Test. Bust knocks character unconscious or causes damage.",
    specialRules: []
  },
  "8C": {
    id: "contamination_group",
    name: "Contamination Leak",
    cardCode: "8C",
    type: "GROUP",
    flavorText: "Caustic fluids spray from the ceiling vents.",
    rulesText: "Group Test. Spacesuits protect. Bust destroys spacesuits or damages traits.",
    specialRules: ["spacesuit_immune"]
  },
  "9C": {
    id: "darkness",
    name: "Complete Darkness",
    cardCode: "9C",
    type: "GROUP",
    flavorText: "All primary and backup lighting in this section is dead.",
    rulesText: "Group Test. Character stats/modifiers are restricted unless flashlight is held.",
    specialRules: []
  },
  "10C": {
    id: "noise",
    name: "Deafening Noise",
    cardCode: "10C",
    type: "GROUP",
    flavorText: "A high-pitched siren or engine feedback screams through the bulkheads.",
    rulesText: "Group Test. Prevents verbal communication, blocks Counselor and Commander benefits.",
    specialRules: []
  },
  "JC": {
    id: "security_malfunction",
    name: "Security Malfunction",
    cardCode: "JC",
    type: "GROUP",
    flavorText: "Automated turrets drop from the ceiling, classifying you as intruders.",
    rulesText: "Group Test. Security Aptitude wins ties.",
    specialRules: []
  },
  "QC": {
    id: "oxygen_critical",
    name: "Oxygen Critical",
    cardCode: "QC",
    type: "GROUP",
    flavorText: "The air becomes thin and stale. Lungs burn.",
    rulesText: "Group Test. Androids immune. Spacesuits protect. Failure makes movement impossible.",
    specialRules: ["spacesuit_immune"]
  },
  "KC": {
    id: "hologram",
    name: "Hologram Glitch",
    cardCode: "KC",
    type: "GROUP",
    flavorText: "Flickering hard-light projections simulate dangerous obstacles.",
    rulesText: "Group Test. Science Aptitude can identify as illusion. Bust causes mental shock.",
    specialRules: []
  }
};
function getHydratedObstacle(cardCode, scenario) {
  const baseObstacle = OBSTACLE_REGISTRY[cardCode];
  if (!baseObstacle) return void 0;
  if (baseObstacle.type === "ADVERSARY") {
    const level = baseObstacle.specialRules?.includes("level_3") ? 3 : baseObstacle.specialRules?.includes("level_2") ? 2 : 1;
    const adversary = getScenarioAdversaryByCard(cardCode, level, scenario);
    return {
      ...baseObstacle,
      name: adversary.name,
      flavorText: adversary.description,
      rulesText: baseObstacle.rulesText + (adversary.level3AbilityDesc ? ` ${adversary.level3AbilityName}: ${adversary.level3AbilityDesc}` : "")
    };
  }
  return { ...baseObstacle, flavorText: getScenarioObstacleFlavorText(baseObstacle, scenario) };
}
const FLYING_INTO_THE_SUN = {
  id: "flying_into_the_sun",
  name: "Flying into the Sun",
  majorCrisis: "COLLISION_COURSE",
  defaultMinorCrisis: "LOST",
  year: 3115,
  shipName: "Starship Welke",
  restrictedAptitudes: ["Armored", "Shapeshifter"],
  startWithNoGear: true,
  adversaryTypes: ["nanotech_zombie"],
  // Matches Level 1/2/3 nanotech zombies
  backstory: `It is the year 3115. You are the crew of the Starship Welke, the final hope of a dying species.
Humanity had to abandon Earth, heading for Avalon. You were awoken from suspended animation because of a critical trajectory error.
Given your current rate of travel, in six hours and fifty-three minutes, the Welke will crash into the nearby sun.
Strangely, the corpses of previous crews are missing... they have been reanimated as nanotech zombies, shambling around cleaning up messes and attacking anyone out of place.`,
  extraRulesText: "No starting gear allowed. Nanotech zombies roam the corridors.",
  requiresSpacesuitForEva: true
};
const PRISON_BREAK = {
  id: "prison_break",
  name: "Prison Break",
  majorCrisis: "MUTINY",
  defaultMinorCrisis: "GRAVITY_OFFLINE",
  // Can be any except Missing Crewmate or Lost
  shipName: "Pembroke 13",
  restrictedAptitudes: ["Militant", "Sanitation", "Shapeshifter", "Smuggler", "Trainee"],
  startWithNoGear: false,
  // Players start with gear choice (weapon, explosive, or medkit)
  adversaryTypes: ["pirate", "mutineer"],
  backstory: `Yesterday, the transport freighter Pembroke 13 reported convicts bound for hard labor in the hydrogen mines on Jupiter.
By 2235, a short distress signal was received before communication went offline. The ship is now off-course, heading for a pirate outpost on Saturn.
Your special forces astronaut team has infiltrated the hull to retake the ship from mutineers.`,
  extraRulesText: "All characters begin with a weapon, explosive, or medkit of their choice. Enemies are former prisoners (Pirates).",
  requiresSpacesuitForEva: true
};
const SCAVENGERS = {
  id: "scavengers",
  name: "Scavengers",
  majorCrisis: "ALIEN_HORROR",
  defaultMinorCrisis: "MISSING_CREWMATES",
  shipName: "Derelict Alien Hulk",
  restrictedAptitudes: ["Sanitation"],
  startWithNoGear: true,
  // Hangar bay is the only location with starting gear
  adversaryTypes: ["predatory_horror"],
  backstory: `You are independent salvage workers stripping a massive alien vessel crashed into an asteroid.
Stein's comms went down, and a strange sound began echoing through the corridors.
The PCs start separated, and must locate their missing crewmate (Stein) before they can resolve the Major Crisis.
The predatory alien horror cannot be killed in regular tests; only trapped or damaged via Crisis steps.`,
  extraRulesText: "Characters start separated in different rooms. Stein must be found to proceed with Major Crisis resolution.",
  requiresSpacesuitForEva: true
};
const SPACE_MADNESS = {
  id: "space_madness",
  name: "Space Madness",
  majorCrisis: "CONTAMINATED",
  defaultMinorCrisis: "DIGNITARY_ONBOARD",
  shipName: "Space Force One",
  restrictedAptitudes: [],
  startWithNoGear: false,
  adversaryTypes: ["bio_drinker", "cuddly_breeder", "pirate", "rogue_crewmate"],
  backstory: `The crew of Space Force One has been exposed to 'Space Madness.' You cannot trust your own senses or judgment.
Madame President is currently onboard, hindering the use of heavy weaponry/explosives until she is found and secured.
Solve the crisis by curing everyone or setting the ship to self-destruct and escaping.
Tone is campy, classic 70s sci-fi.`,
  extraRulesText: "Cheesy overacting, tight color-coded uniforms, and direct looks at the camera are highly encouraged. Weapons are set to stun (no lethal damage between crew).",
  requiresSpacesuitForEva: false
  // Holodeck/indoor styled or no EVA focus
};
const WISH_UPON_DYING_STAR = {
  id: "wish_upon_dying_star",
  name: "When You Wish Upon a (Dying) Star",
  majorCrisis: "DEAD_SHIP",
  defaultMinorCrisis: "LOST",
  shipName: "Phoenix",
  restrictedAptitudes: ["Psychic", "Shapeshifter", "Smuggler"],
  startWithNoGear: false,
  adversaryTypes: ["alter_dimensional", "rogue_crewmate"],
  backstory: `The rescue vessel Phoenix has arrived at the pulsar star Lich (PSR B1257+12) following a human-language distress signal.
Upon entering the system, horrific nightmares plagued the crew. Thirteen hours later, the power went out.
The walls began to bleed. Crewmates went mad. Shadowy beings now stalk the darkened bulkheads. You must restore power and escape.`,
  extraRulesText: "No one may play the Captain. Personal survival tests begin with automatic Rising Tension (due to the Lost crisis). Shadowy entities block paths.",
  requiresSpacesuitForEva: true
};
const TERROR_ON_HOLODECK_THREE = {
  id: "terror_on_holodeck_three",
  name: "Terror on Holodeck Three",
  majorCrisis: "DIMENSIONAL_RIFT",
  defaultMinorCrisis: "DOORS_OFFLINE",
  shipName: "Starship Redemption (Holodeck)",
  restrictedAptitudes: [],
  startWithNoGear: true,
  // Must discover weapons/gear in simulation play
  adversaryTypes: ["alter_dimensional", "rogue_crewmate"],
  backstory: `You wake up in what appears to be an antique hotel, smelling dust and mildew.
The safety suppressors on Holodeck Three have failed, trapping you in a glitching simulation.
If you die here, you 'respawn' in your holodeck quarters with one Trait permanently lost but all others refreshed.
On the third death, you escape the simulation and can assist your crew from the controls outside.`,
  extraRulesText: "No EVA or space suits. Crewmates respawn on death twice, after which they operate from the external console.",
  requiresSpacesuitForEva: false
};
const SCENARIO_REGISTRY = [
  FLYING_INTO_THE_SUN,
  PRISON_BREAK,
  SCAVENGERS,
  SPACE_MADNESS,
  WISH_UPON_DYING_STAR,
  TERROR_ON_HOLODECK_THREE
];
function getRoomDescription(roomNameOrContext, scenarioId = "") {
  const context = typeof roomNameOrContext === "string" ? { roomName: roomNameOrContext, scenarioId } : roomNameOrContext;
  return buildScenarioRoomDescription(context);
}
function assert$1(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
function assertNoAdversaryLevelLabel(value, context) {
  const genericLevelLabel = new RegExp(`Level [123] ${"Adversary"}`);
  assert$1(!genericLevelLabel.test(value), `${context} exposes a generic adversary level label.`);
}
function assertNarrativeImmersionContract() {
  const supportedScenarioIds = new Set(getRoomDescriptionScenarioIds());
  for (const scenario of SCENARIO_REGISTRY) {
    assert$1(supportedScenarioIds.has(scenario.id), `${scenario.id} must have a room description voice.`);
    for (const room of Object.values(ROOM_REGISTRY)) {
      const description = getRoomDescription({
        roomName: room.name,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        obstacleName: "active hazard",
        obstacleState: "unresolved",
        isFirstVisit: true
      });
      assert$1(description.length > 160, `${scenario.id} ${room.name} room text is too thin.`);
      assert$1(!description.includes(["eerily", "quiet"].join(" ")), `${scenario.id} ${room.name} uses the old room fallback.`);
    }
    for (const cardCode of Object.keys(OBSTACLE_REGISTRY).filter((code) => code.endsWith("H") && code !== "AH")) {
      const baseObstacle = OBSTACLE_REGISTRY[cardCode];
      const hydratedObstacle = getHydratedObstacle(cardCode, scenario);
      assertNoAdversaryLevelLabel(baseObstacle.name, `${cardCode} base obstacle`);
      assertNoAdversaryLevelLabel(hydratedObstacle?.name || "", `${cardCode} ${scenario.id} obstacle`);
    }
  }
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
  assertNarrativeImmersionContract();
  smokeBlackjackSemantics();
  smokeCrisisJokerFlow();
}
runRuleRegressionSmokeSuite();
console.log("Rule regression smoke suite passed.");
//# sourceMappingURL=ruleRegressionSmokeCommand.js.map
