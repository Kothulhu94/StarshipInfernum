import { RoomSurfaceDetail } from './roomDescriptionTypes';

const ROOM_DETAILS: RoomSurfaceDetail[] = [
  { canonicalName: 'Airlock', aliases: ['Airlock'], purpose: 'a pressure gate between the ship and open vacuum', fixtures: 'manual wheels, warning lamps, suit lockers, and pressure gauges', clue: 'old scratch marks cluster around the emergency release.' },
  { canonicalName: 'Cantina / Mess Hall', aliases: ['Cantina / Mess Hall', 'Galley / Kitchen'], purpose: 'the crew commons where meals, rumors, and arguments used to settle', fixtures: 'bolted tables, dispenser banks, cook stations, and cracked serving trays', clue: 'half-finished meals show the evacuation was sudden.' },
  { canonicalName: 'Brig / Interrogation Room', aliases: ['Brig / Interrogation Room'], purpose: 'a detention block built to make people feel forgotten', fixtures: 'restraint chairs, camera eyes, cell fields, and stained floor drains', clue: 'someone tried to carve a warning into the inside of a locked cell.' },
  { canonicalName: 'Hallway', aliases: ['Hallway'], purpose: 'a narrow artery through the ship', fixtures: 'bulkhead ribs, access panels, handrails, and emergency strip lights', clue: 'the wall scuffs show traffic moving in panic, not formation.' },
  { canonicalName: 'Command Bridge', aliases: ['Command Bridge', 'Navigation Room'], purpose: 'the nerve center where every bad decision became shipwide fact', fixtures: 'helm stations, nav glass, command couches, and tactical repeater screens', clue: 'the final course correction is still blinking for confirmation.' },
  { canonicalName: 'Storage Room', aliases: ['Storage Room', 'Storage', 'Vault'], purpose: 'a cramped reserve of supplies nobody expected to need this badly', fixtures: 'cargo shelves, tie-down hooks, coded bins, and cracked inventory pads', clue: 'the manifest no longer matches what is stacked here.' },
  { canonicalName: 'Crew Quarters', aliases: ['Crew Quarters', 'Officer Quarters'], purpose: 'private bunks turned into a record of interrupted lives', fixtures: 'fold-down beds, lockers, family photos, and privacy curtains', clue: 'personal effects are missing in patterns that look deliberate.' },
  { canonicalName: 'Engineering', aliases: ['Engineering', 'Power Core Room', 'Power Core'], purpose: 'the loud mechanical heart of the vessel', fixtures: 'reactor shielding, coolant towers, diagnostic shrines, and repair gantries', clue: 'maintenance tags are written over each other in increasingly frantic hands.' },
  { canonicalName: 'Medbay', aliases: ['Medbay', 'Med Clinic / Sickbay'], purpose: 'a clinic where sterile procedure has surrendered to triage', fixtures: 'autodoc cradles, surgical arms, med lockers, and cracked biobeds', clue: 'the patient board lists names that are not in the crew manifest.' },
  { canonicalName: 'Rec Room', aliases: ['Rec Room', 'Lounge'], purpose: 'a morale room pretending comfort was ever possible out here', fixtures: 'soft seats, game tables, screens, and ration cabinets', clue: 'someone left a recorded message queued but unsent.' },
  { canonicalName: 'Ready / War Room', aliases: ['Ready / War Room'], purpose: 'a planning chamber for emergencies that have already arrived', fixtures: 'holo maps, briefing rails, sealable doors, and tactical lockers', clue: 'the tabletop projection keeps replaying the same doomed route.' },
  { canonicalName: 'Library', aliases: ['Library', 'Administration Office'], purpose: 'a memory vault of regulations, records, and quiet lies', fixtures: 'data stacks, archive shelves, terminal alcoves, and privacy glass', clue: 'recent files are scrubbed, but the deletion timestamps remain.' },
  { canonicalName: 'Science Lab', aliases: ['Science Lab'], purpose: 'a research compartment full of questions nobody should have asked', fixtures: 'sample freezers, containment glass, microscopes, and reagent arms', clue: 'one experiment is still running without power.' },
  { canonicalName: 'Lift / Elevator', aliases: ['Lift / Elevator', 'Lift'], purpose: 'a vertical transit shaft that makes every deck feel far away', fixtures: 'floor indicators, cage rails, brake clamps, and service hatches', clue: 'the call log shows stops on decks the ship does not officially have.' },
  { canonicalName: 'Life Support', aliases: ['Life Support'], purpose: 'the lungs of the ship, all filters and desperate circulation', fixtures: 'scrubber towers, oxygen tanks, humidity traps, and alarm valves', clue: 'the airflow tastes recycled through something organic.' },
  { canonicalName: 'Armory', aliases: ['Armory', 'Weapons & Shield Control', 'Weapons & Shields', 'Torpedo Room / Turret'], purpose: 'a secured weapons compartment where restraint is optional', fixtures: 'weapon racks, shield relays, targeting glass, and ammunition safes', clue: 'the locks were opened from both sides.' },
  { canonicalName: 'Transporter Room', aliases: ['Transporter Room'], purpose: 'a matter-transfer chamber with too much faith in calibration', fixtures: 'transit pads, pattern buffers, emitter hoops, and checksum panels', clue: 'a partial scan is saved under a name nobody recognizes.' },
  { canonicalName: 'Maintenance Tunnel', aliases: ['Maintenance Tunnel'], purpose: 'a crawlspace where the ship shows its bones', fixtures: 'pipe bundles, cable trays, crawl grates, and low amber lamps', clue: 'fresh drag marks vanish into a duct too small for a person.' },
  { canonicalName: 'Hangar Bay', aliases: ['Hangar Bay', 'Escape Pods'], purpose: 'a launch chamber built around the promise of leaving', fixtures: 'shuttle clamps, pod racks, fuel couplers, and exterior bay doors', clue: 'several escape systems have been armed but not fired.' },
  { canonicalName: 'Cargo Bay', aliases: ['Cargo Bay'], purpose: 'a cavernous hold where mass and shadow collect', fixtures: 'stacked containers, loader tracks, crane arms, and magnetic tie-downs', clue: 'one sealed crate is warm enough to fog the metal around it.' },
  { canonicalName: 'Central Server Room', aliases: ['Central Server Room', 'Central Server'], purpose: 'the ship mind packed into towers of humming glass', fixtures: 'server racks, coolant cables, access plinths, and security shutters', clue: 'deleted logs continue to print themselves in the margins.' },
  { canonicalName: 'Observation Deck', aliases: ['Observation Deck'], purpose: 'a viewing gallery where space presses close to the glass', fixtures: 'panoramic ports, visitor rails, telescope rigs, and reflection shields', clue: 'the stars outside do not hold still when you blink.' },
  { canonicalName: 'Communication Room', aliases: ['Communication Room', 'Communication'], purpose: 'a signal room for voices that may never reach anyone', fixtures: 'antenna controls, receiver dishes, encryption keys, and dead microphones', clue: 'one channel is transmitting from inside the ship.' },
  { canonicalName: 'Robotics Lab', aliases: ['Robotics Lab', 'Robotics'], purpose: 'a workshop where useful machines learn bad habits', fixtures: 'charging bays, manipulator arms, diagnostic benches, and spare limbs', clue: 'service drones have arranged themselves facing the door.' },
  { canonicalName: 'Locker Room / Bathroom', aliases: ['Locker Room / Bathroom', 'Lockers / Bathroom'], purpose: 'a tiled utility room where privacy has become another broken system', fixtures: 'lockers, shower stalls, mirrors, drains, and steam lines', clue: 'one mirror has fingerprints on the wrong side of the glass.' },
  { canonicalName: 'Waste Processing', aliases: ['Waste Processing'], purpose: 'a foul industrial room where the ship digests what the crew discards', fixtures: 'compactor teeth, reclamation tanks, filter drums, and incinerator doors', clue: 'the intake log includes biological mass nobody reported missing.' },
  { canonicalName: 'Repair Shop', aliases: ['Repair Shop'], purpose: 'a practical bay of tools, parts, and desperate improvisation', fixtures: 'workbenches, welders, tool cages, and suspended engine parts', clue: 'someone built a barricade here and then abandoned it from the inside.' },
  { canonicalName: 'Security HQ', aliases: ['Security HQ', 'Security Headquarters'], purpose: 'a fortified watch room for threats the cameras failed to stop', fixtures: 'monitor banks, stun lockers, incident boards, and armored shutters', clue: 'the final camera feed is paused on this room before you entered.' },
  { canonicalName: 'Laundry Room', aliases: ['Laundry Room', 'Laundry'], purpose: 'an industrial washroom full of heat, chemicals, and repeating cycles', fixtures: 'washer drums, dryer stacks, bleach tanks, and folding tables', clue: 'uniforms are sorted by blood type instead of department.' },
  { canonicalName: 'Cryopods Room', aliases: ['Cryopods Room', 'Cryopods'], purpose: 'a cold berth for sleepers who trusted the ship to wake them', fixtures: 'frosted capsules, coolant rails, life-sign readouts, and thaw pumps', clue: 'one empty pod is still reporting a heartbeat.' },
  { canonicalName: 'Classroom / Training Room', aliases: ['Classroom / Training Room'], purpose: 'a training space that taught procedures for disasters less personal than this', fixtures: 'holo instructors, crash mats, exam terminals, and hazard projectors', clue: 'the current lesson is titled How to Recognize You Are Too Late.' },
  { canonicalName: 'Garden / Hydroponics', aliases: ['Garden / Hydroponics', 'Garden / Hydro'], purpose: 'the ship garden where food, oxygen, and false calm were cultivated', fixtures: 'grow racks, nutrient lines, mist sprayers, and pollination lamps', clue: 'the plants lean toward you before the ventilation moves.' },
  { canonicalName: 'Gym', aliases: ['Gym'], purpose: 'a fitness compartment for bodies that now only need to survive', fixtures: 'treadmills, resistance rigs, gravity plates, and impact mats', clue: 'the equipment usage log shows a workout after the room was sealed.' },
];

const ROOM_ALIAS_LOOKUP = new Map<string, RoomSurfaceDetail>();

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

for (const room of ROOM_DETAILS) {
  for (const alias of [room.canonicalName, ...room.aliases]) {
    ROOM_ALIAS_LOOKUP.set(normalizeKey(alias), room);
  }
}

export function getRoomSurfaceDetail(roomName: string): RoomSurfaceDetail {
  return ROOM_ALIAS_LOOKUP.get(normalizeKey(roomName)) || {
    canonicalName: roomName,
    aliases: [roomName],
    purpose: 'a ship compartment whose original purpose has been buried by the crisis',
    fixtures: 'half-lit panels, loose plating, emergency labels, and unsecured equipment',
    clue: 'the room still carries signs of whoever passed through before you.',
  };
}
