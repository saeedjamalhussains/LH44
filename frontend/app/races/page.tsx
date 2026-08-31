import type { Metadata } from 'next';
import { Suspense } from 'react';
import RaceArchive from '@/components/RaceArchive';
import { LoadingState, SectionHeader } from '@/components/ui';
import { career, featuredRaces, meta } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Race Archive',
  description:
    "Every Lewis Hamilton Formula 1 race: year, Grand Prix, team, grid, finish, points and fastest laps, searchable and filterable.",
};

export default function RacesPage() {
  const fallback = featuredRaces.map((r) => ({
    id: r.id, year: r.year, round: r.round, gp: r.gp, circuit: r.circuit,
    team: r.team, grid: r.grid, finish: r.finish, points: r.points,
    fastestLap: r.fastestLap, tyres: r.tyres,
  }));

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Complete record" title="The Race Archive"
          sub={`${career.starts} Grand Prix entries since 2007. Search by circuit, filter by team, result or year.`}
        />
      </header>
      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <Suspense fallback={<LoadingState label="LOADING RACE ARCHIVE" />}>
          <RaceArchive fallback={fallback} seedNote={meta.seedNote} />
        </Suspense>
      </div>
    </div>
  );
}
