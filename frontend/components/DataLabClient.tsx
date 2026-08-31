'use client';

import { useSearchParams } from 'next/navigation';
import DataLab from './DataLab';

/** Reads the preset query string so /iconic-laps can deep-link into a session. */
export default function DataLabClient() {
  const params = useSearchParams();
  const year = Number(params.get('year'));
  // Keyed on the query string so a deep link from another page remounts the lab
  // with the new preset rather than keeping the previous session's state.
  return (
    <DataLab
      key={params.toString()}
      initial={{
        year: Number.isFinite(year) && year > 1990 ? year : 2021,
        gp: params.get('gp') ?? 'Brazil',
        session: params.get('session') ?? 'Qualifying',
        driver: params.get('driver') ?? 'HAM',
        compare: params.get('compare') ?? 'VER',
      }}
    />
  );
}
