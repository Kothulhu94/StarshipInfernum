import { AdversaryData } from './adversaryRegistry';

export type AdversaryDisposition =
  | 'waiting'
  | 'chasing'
  | 'ambushing'
  | 'fled'
  | 'temporarily_driven_off'
  | 'defeated';

export interface AdversaryInstance {
  id: string;
  typeId: string;
  name: string;
  level: 1 | 2 | 3;
  currentRoomId: string;
  successesRemaining: number;
  disposition: AdversaryDisposition;
}

export interface AdversaryCombatStateUpdate {
  defeated: boolean;
  playerEscaped: boolean;
  successesRemaining: number;
  disposition: AdversaryDisposition;
}

export function getRequiredAdversarySuccesses(adversary: AdversaryData): number {
  if (adversary.id === 'warmonger' && adversary.level === 3) {
    return 4;
  }
  return adversary.level;
}
