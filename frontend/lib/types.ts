export type Era = 'mclaren' | 'mercedes' | 'ferrari';

export interface Season {
  year: number;
  team: string;
  car: string;
  engine: string;
  era: Era;
  position: number;
  champion: boolean;
  points: number;
  starts: number;
  wins: number;
  poles: number;
  podiums: number;
  fastestLaps: number;
  dnfs: number;
  avgGrid: number;
  avgFinish: number;
  margin?: number;
  rival?: string;
  rivalPoints?: number;
  teammate: string;
  keyMoment: string;
  inProgress?: boolean;
}

/** The one shape every displayed statistic uses (spec §53). */
export interface Stat {
  value: number | string;
  label: string;
  source: string;
  updatedAt: string;
  calculated?: boolean;
}

export interface Championship {
  year: number; team: string; points: number; wins: number; poles: number;
  podiums: number; fastestLaps: number; margin: number; rival: string;
  rivalPoints: number; clinched: string; definingMoment: string; line: string;
}

export interface Circuit {
  id: string; name: string; gp: string; country: string;
  /** Geography is curated; null where a circuit has no entry in the table. */
  lat: number | null; lng: number | null; length: number | null; turns: number | null;
  starts: number; wins: number; podiums: number;
  /** Races started from P1. Not a qualifying pole count — grid penalties differ. */
  p1Starts: number; frontRow: number;
  bestFinish: number | null; dnfs: number; points: number;
  avgGrid: number | null; avgFinish: number | null;
  firstYear: number; lastYear: number; source: string;
}

export interface FeaturedRace {
  id: string; year: number; round: number; gp: string; circuit: string; team: string;
  grid: number; quali?: number; finish: number; points: number; fastestLap?: boolean;
  tyres?: string[]; laps?: number; gap?: string; story: string;
}

export interface Rival {
  id: string; name: string; years: string; teammate: boolean; championships: number;
  wins: number; poles: number; podiums: number; points: number; note: string;
  seasons: number[];
  h2hQualifying: { hamilton: number; rival: number } | null;
  h2hRace: { hamilton: number; rival: number } | null;
  seasonSplit?: { year: number; ham: { pts: number; wins: number; poles: number };
                  riv: { pts: number; wins: number; poles: number } }[];
}

export interface TelemetryPoint {
  Distance: number; Speed?: number; Throttle?: number; Brake?: number;
  nGear?: number; RPM?: number; X?: number; Y?: number;
}

export interface TelemetryResponse {
  available: boolean;
  reason?: string;
  synthetic?: boolean;
  driver?: string;
  lap?: { lapNumber: number | null; lapTime: number | null; sector1: number | null;
          sector2: number | null; sector3: number | null; compound?: string | null };
  trace?: TelemetryPoint[];
  source?: string;
}
