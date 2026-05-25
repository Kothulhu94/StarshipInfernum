import { RoomFlavorText } from './roomFlavorText';

export const ObstacleFlavorText: Record<string, string> = {
  'Acid': 'The floor is covered in pools of bubbling green acid and those pools are growing larger by the second.',
  'Claustrophobia': 'The walls begin to close in on you, sweat breaks out on your brow, and your knees buckle under the mental strain.',
  'Contamination': 'Strange liquid begins to spray out in an arc over your head from a ruptured pipe on the ceiling.',
  'Cotard Delusion': 'It suddenly hits you that you didn\'t survive the last disaster... you are already dead.',
  'Crewmate': 'You discover a fellow crewmate trapped and in desperate need of your help.',
  'Dangerous Debris': 'A tangled mess of jagged metal, broken glass, and twisted furniture litters the floor from a recent explosion.',
  'Darkness': 'This room is pitch black. It is so dark that you can\'t even see your own hand in front of your face.',
  'Dimensional Rift': 'A jagged tear runs across the floor, a hole in the fabric of reality where dark forces stream out.',
  'Electric Discharge': 'Power surges and sparks from panel to panel. A tingling sensation runs up your leg, warning of the high voltage.',
  'Exhaustion': 'Your body aches from the strain. If you don\'t catch your breath, you might drop dead from sheer fatigue.',
  'Explosion': 'A deafening sound and shockwave ripples through the ship as white light, searing fire, and shrapnel fly outward.',
  'External Impact': 'Something big and heavy strikes the outer hull, causing the room to quake and metal to crumble overhead.',
  'Extreme Pressure': 'Your head pounds, your joints pop, and objects shatter as the atmospheric pressure rapidly rises.',
  'Extreme Temperatures': 'A wave of sweltering heat hits you, melting objects in a shimmering haze. You gasp for breath.',
  'Hallucination': 'An old friend stands in the empty space, pulls a gun, and fires. Your mind insists the danger is real.',
  'Hologram': 'A terrifying threat blocks your path, but something about the way the light hits it seems strangely artificial.',
  'Hull Breach': 'A gaping hole in the side of the ship pulls everything towards the inky black emptiness of space.',
  'Parasite / Illness': 'Your glands feel swollen, joints ache, and the room spins. You have been infected by something deadly.',
  'Radiation': 'A pulsing light emanates from the room—a silent killer that is piercing your body and ripping your DNA to shreds.',
  'Security Malfunction': 'A ceiling-mounted laser turret spins around towards you, red targeting dots float across your body, and it opens fire.',
  'Structural Issues': 'A loud, tortured groan reverberates through the air as the floor buckles and the ceiling comes crashing in.',
  'Teleport': 'Your body tingles and begins to dematerialize as an errant teleporter beam locks onto your coordinates.',
  'Time Rift': 'A strong sense of déjà vu washes over you as you slip backwards in time, forced to repeat the horror you just survived.',
  'Toxic Gas': 'A soft hissing sound fills the air. You start to choke and your eyeballs burn as your lungs fill with poison.',
  'Trapdoor': 'Without warning, a panel collapses beneath your weight, threatening to send you tumbling into the darkness below.',
  'Vent to Space': 'A hatch opens in the wall and the contents of the room are rapidly jettisoned into the cold vacuum.',
  'Vermin Swarm': 'A wave of vermin bursts forth from the vents, crawling up your body, biting, scratching, and overwhelming you.'
};

export const OutcomeFlavorText: Record<string, { success: string; bust: string }> = {
  'Acid': { success: 'You carefully step through the clear patches, avoiding the burning puddles.', bust: 'Your foot slips into the acid, severely burning your leg. You lose a Trait.' },
  'Claustrophobia': { success: 'You hold onto your sanity and push the rising panic down.', bust: 'You freak out, causing physical harm to yourself in your panic. You lose a Trait.' },
  'Contamination': { success: 'You dive out of the way, shielding yourself from the caustic spray.', bust: 'You get a facefull of chemicals, suffering serious burns. You lose a Trait.' },
  'Cotard Delusion': { success: 'You push the dark thoughts away, grounding yourself in reality.', bust: 'You injure yourself just to prove you can still bleed. You lose a Trait.' },
  'Dangerous Debris': { success: 'You manage to traverse the jagged ruins without issue.', bust: 'You stumble into sharp shrapnel, slicing yourself open. You lose a Trait.' },
  'Darkness': { success: 'You navigate the pitch black room without bumping into anything dangerous.', bust: 'You trip over an unseen hazard and suffer a heavy fall. You lose a Trait.' },
  'Dimensional Rift': { success: 'You break free from the otherworldly tentacles pulling you in.', bust: 'Your body is wracked by cosmic forces from beyond. You lose a Trait.' },
  'Electric Discharge': { success: 'You avoid the sparking conduits and safely bypass the surge.', bust: 'You are shocked with a tremendous amount of electricity. You lose a Trait.' },
  'Exhaustion': { success: 'You manage to catch your breath and find a second wind.', bust: 'You collapse to the floor, panting as every muscle screams. You lose a Trait.' },
  'Explosion': { success: 'You hit the deck in time to avoid the worst of the blast.', bust: 'You are struck by shrapnel and shell-shocked by the force. You lose a Trait.' },
  'External Impact': { success: 'You keep your footing and dive away from falling metal.', bust: 'You are thrown across the room by the violent quake. You lose a Trait.' },
  'Extreme Pressure': { success: 'You push your way through the room before the pressure crushes you.', bust: 'The pressure ruptures blood vessels; you begin vomiting. You lose a Trait.' },
  'Extreme Temperatures': { success: 'You cross the sweltering room before succumbing to the heat.', bust: 'You suffer severe heatstroke and blistering burns. You lose a Trait.' },
  'Hallucination': { success: 'You realize the falsehood of the illusion and force it from your mind.', bust: 'Your mind insists the injury is real, and psychosomatic wounds appear. You lose a Trait.' },
  'Hologram': { success: 'You see through the projection and safely ignore the threat.', bust: 'You panic and run right into a solid bulkhead, injuring yourself. You lose a Trait.' },
  'Hull Breach': { success: 'You grab onto a secured console, fighting the vacuum until the doors seal.', bust: 'You are struck by flying debris as you struggle against the pull. You lose a Trait.' },
  'Parasite / Illness': { success: 'Your immune system fights off the sudden onslaught of the infection.', bust: 'The illness takes hold; you double over in agonizing pain. You lose a Trait.' },
  'Radiation': { success: 'You sprint through the room before absorbing a lethal dose.', bust: 'The radiation sickness hits you immediately, causing cellular damage. You lose a Trait.' },
  'Security Malfunction': { success: 'You dive behind cover just as the laser turret opens fire.', bust: 'A laser blast grazes your shoulder, leaving a searing burn. You lose a Trait.' },
  'Structural Issues': { success: 'You brace the collapsing ceiling just long enough to escape.', bust: 'A falling beam crushes your leg before you scramble away. You lose a Trait.' },
  'Teleport': { success: 'You shake off the transporter beam and remain where you are.', bust: 'You are warped away, suffering cellular degradation in transit. You lose a Trait.' },
  'Time Rift': { success: 'You survive the temporal loop and return to the present intact.', bust: 'You return from the time loop carrying fresh, bleeding wounds. You lose a Trait.' },
  'Toxic Gas': { success: 'You cover your mouth and escape without inhaling the poison.', bust: 'You inhale the caustic gas, burning your throat and lungs. You lose a Trait.' },
  'Trapdoor': { success: 'You grab the ledge as the floor drops out beneath you.', bust: 'You plummet into the darkness below, landing hard. You lose a Trait.' },
  'Vent to Space': { success: 'You hold onto a secured crate until the atmospheric vent closes.', bust: 'You are slammed into the wall by the sudden depressurization. You lose a Trait.' },
  'Vermin Swarm': { success: 'You crush the swarm underfoot, escaping before they overwhelm you.', bust: 'The swarm bites and scratches you viciously before moving on. You lose a Trait.' }
};

export const ScenarioFlavorText: Record<string, string> = {
  'Flying into the Sun': 'It is the year 3115. You are the crew of the Starship Welke, the final hope of a dying species. An asteroid storm has caused a trajectory error. In six hours, the ship will crash into the nearby sun.',
  'Prison Break': 'The transport freighter Pembroke 13 has been taken over by its cargo of 1,200 convicts. Your special forces team must infiltrate the ship and resolve the crisis.',
  'Scavengers': 'You are independent salvage workers stripping an ancient, derelict alien vessel. Your crewmate has gone missing, and something massive and hungry is hunting you in the dark.',
  'Space Madness': 'The crew of Space Force One has been infected with "Space Madness". Hallucinations run rampant, the coffee maker is in charge, and Madame President is trapped onboard.',
  'Wish Upon a Dying Star': 'The ship is completely dead in space. The power is out, life support is failing, and strange shadow beings have begun slipping through the cracks of reality.',
  'Terror on Holodeck Three': 'A malfunction in the ship\'s dimensional drive has merged the physical ship with terrifying holographic simulations. Nothing is real, but everything can kill you.'
};

export function getRoomDescription(roomName: string, scenarioId: string): string {
  const roomData = RoomFlavorText[roomName];
  if (roomData && roomData[scenarioId]) {
    return roomData[scenarioId];
  }
  // Fallback if scenario specific text isn't found
  return `You enter the ${roomName}. It looks eerily quiet.`;
}

export function getObstacleDescription(obstacleName: string): string {
  return ObstacleFlavorText[obstacleName] || `A dangerous ${obstacleName} blocks your path.`;
}

export function getOutcomeDescription(obstacleName: string, isSuccess: boolean): string {
  const texts = OutcomeFlavorText[obstacleName];
  if (!texts) return isSuccess ? 'You succeed.' : 'You take damage.';
  return isSuccess ? texts.success : texts.bust;
}

export function getScenarioDescription(scenarioName: string): string {
  return ScenarioFlavorText[scenarioName] || `You are playing ${scenarioName}.`;
}
