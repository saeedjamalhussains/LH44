/**
 * Server-side data layer.
 *
 * Reads the seed snapshot that ships with the repo, and overlays the live
 * FastAPI service when `LH44_API_URL` is set. Career totals are summed from the
 * season table rather than stored, so the headline numbers and the season table
 * can never disagree — and both move automatically when a new season is added.
 */
import seasonsJson from '@/data/hamilton.seasons.json';
import metaJson from '@/data/hamilton.meta.json';
import championshipsJson from '@/data/hamilton.championships.json';
import circuitsJson from '@/data/hamilton.circuits.json';
import featuredJson from '@/data/hamilton.races.featured.json';
import rivalsJson from '@/data/hamilton.rivals.json';
import iconicJson from '@/data/hamilton.iconiclaps.json';
import barcelonaJson from '@/data/barcelona2026.json';
import beyondJson from '@/data/beyondf1.json';
import numberJson from '@/data/number44.json';
import type { Championship, Circuit, FeaturedRace, Rival, Season, Stat } from './types';

export const meta = metaJson as {
  driver: { firstName: string; lastName: string; number: number; code: string;
            nationality: string; team: string; active: boolean };
  updatedAt: string;
  seedNote: string;
  sources: Record<string, { label: string; url: string | null }>;
};

export const seasons = (seasonsJson as Season[]).slice().sort((a, b) => a.year - b.year);
export const championships = championshipsJson as Championship[];
export const circuits = circuitsJson as Circuit[];
export const featuredRaces = featuredJson as FeaturedRace[];
export const rivals = rivalsJson as Rival[];
export const iconicLaps = iconicJson as {
  id: string; year: number; gp: string; gpSlug: string; session: string;
  driver: string; compare: string; title: string; why: string;
}[];
export const barcelona = barcelonaJson as {
  year: number; gp: string; circuit: string; circuitId: string; team: string;
  grid: number; finish: number; points: number; laps: number; gap: string; win: number;
  positionByLap: number[];
  stints: { compound: string; from: number; to: number }[];
  timeline: { lap: number; label: string; text: string }[];
};
export const beyondF1 = beyondJson as {
  sections: { id: string; title: string; fact: string; editorial: string }[];
};
export const number44 = numberJson as {
  origin: string; note: string;
  stages: { stage: string; year: string; text: string }[];
};

const SRC = {
  career: meta.sources.career?.label ?? 'Formula1.com',
  season: meta.sources.seasons?.label ?? 'Formula1.com',
  derived: meta.sources.derived?.label ?? 'Calculated from the season table',
};

const sum = (key: keyof Season) =>
  Math.round(seasons.reduce((acc, s) => acc + (Number(s[key]) || 0), 0) * 10) / 10;

export const career = {
  titles: seasons.filter((s) => s.champion).length,
  starts: sum('starts'),
  wins: sum('wins'),
  poles: sum('poles'),
  podiums: sum('podiums'),
  points: sum('points'),
  fastestLaps: sum('fastestLaps'),
  dnfs: sum('dnfs'),
  seasons: seasons.length,
};

const stat = (value: number | string, label: string, source: string, calculated = false): Stat =>
  ({ value, label, source, updatedAt: meta.updatedAt, calculated });

const rate = (n: number) => Math.round((1000 * n) / career.starts) / 10;

/** The four hero numbers. Derived, never typed into the UI. */
export const headlineStats: Stat[] = [
  stat(career.titles, 'World Titles', SRC.career),
  stat(career.wins, 'Grand Prix Wins', SRC.career),
  stat(career.poles, 'Pole Positions', SRC.career),
  stat(career.podiums, 'Podiums', SRC.career),
];

export const totalStats: Stat[] = [
  stat(career.starts, 'Grand Prix Entries', SRC.career),
  stat(career.points, 'Career Points', SRC.career),
  stat(career.fastestLaps, 'Fastest Laps', SRC.derived, true),
  stat(career.dnfs, 'Retirements', SRC.derived, true),
  stat(career.seasons, 'Seasons Contested', SRC.career),
];

export const derivedStats: Stat[] = [
  stat(rate(career.wins), 'Win %', SRC.derived, true),
  stat(rate(career.podiums), 'Podium %', SRC.derived, true),
  stat(rate(career.poles), 'Pole %', SRC.derived, true),
  stat(Math.round((100 * career.wins) / career.poles) / 100, 'Wins per Pole', SRC.derived, true),
  stat(Math.round((100 * career.points) / career.starts) / 100, 'Points per Entry', SRC.derived, true),
  stat(
    Math.round((100 * seasons.reduce((a, s) => a + s.avgGrid * s.starts, 0)) / career.starts) / 100,
    'Average Grid', SRC.derived, true,
  ),
  stat(
    Math.round((100 * seasons.reduce((a, s) => a + s.avgFinish * s.starts, 0)) / career.starts) / 100,
    'Average Finish', SRC.derived, true,
  ),
];

export const currentSeason = seasons[seasons.length - 1];
export const seasonFor = (year: number) => seasons.find((s) => s.year === year);
export const championshipFor = (year: number) => championships.find((c) => c.year === year);
export const circuitFor = (id: string) => circuits.find((c) => c.id === id);

export const eras = [
  { id: 'mclaren' as const, index: '01', team: 'McLAREN', span: '2007–2012',
    line: 'THE ARRIVAL',
    text: 'A rookie season that ended one point short, a championship the following year decided at the last corner of the last lap, and five seasons of extracting more than the car had in it.' },
  { id: 'mercedes' as const, index: '02', team: 'MERCEDES', span: '2013–2024',
    line: 'PRECISION BECAME DOMINANCE',
    text: 'Twelve seasons, six world championships and the most sustained period of success any driver has had with one team. It began with a move almost nobody in the paddock endorsed.' },
  { id: 'ferrari' as const, index: '03', team: 'FERRARI', span: '2025–PRESENT',
    line: 'A DIFFERENT ERA. A DIFFERENT CHALLENGE.',
    text: 'A first season without a Grand Prix podium, followed by a regulation change and a first victory in red at Barcelona. The chapter is still open.' },
];

export const eraSeasons = (era: Season['era']) => seasons.filter((s) => s.era === era);

export const eraTotals = (era: Season['era']) => {
  const rows = eraSeasons(era);
  const add = (k: keyof Season) => rows.reduce((a, s) => a + (Number(s[k]) || 0), 0);
  return {
    seasons: rows.length, starts: add('starts'), wins: add('wins'), poles: add('poles'),
    podiums: add('podiums'), points: Math.round(add('points') * 10) / 10,
    titles: rows.filter((s) => s.champion).length,
  };
};
