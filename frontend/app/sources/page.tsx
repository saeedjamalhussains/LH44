import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, SectionHeader } from '@/components/ui';
import { career, meta, seasons } from '@/lib/data';
import { allImages, imageNote } from '@/lib/images';
import { allShapes } from '@/lib/shapes';
import world from '@/data/world-map.json';
import RightsNote from '@/components/RightsNote';

export const metadata: Metadata = {
  title: 'Sources',
  description:
    'Where every statistic on this site comes from: Formula1.com, FastF1, the Jolpica F1 API, and which figures are calculated rather than published.',
};

const PRIMARY = [
  {
    name: 'Formula1.com',
    url: 'https://www.formula1.com/en/drivers/lewis-hamilton',
    role: 'Career and season classifications',
    detail: 'The source of truth for championship positions, points, wins, poles, podiums and entries. Every headline figure on this site traces back here.',
  },
  {
    name: 'FastF1',
    url: 'https://docs.fastf1.dev',
    role: 'Session telemetry, laps, stints and weather',
    detail: 'Loads official F1 timing and telemetry data. Everything in the Data Lab — speed, throttle, brake, gear, RPM, sectors, tyre stints, track position — is read through it. Full telemetry channels are available from 2018 onward.',
  },
  {
    name: 'Jolpica F1 API',
    url: 'https://api.jolpi.ca/ergast/f1/',
    role: 'Race results and championship standings',
    detail: 'The Ergast-compatible results archive. Supplies the full race archive, per-race points and the live current-season standings.',
  },
  {
    name: 'FIA',
    url: 'https://www.fia.com',
    role: 'Regulations and official decisions',
    detail: 'Referenced where a result or a championship outcome turned on a regulatory decision.',
  },
];

export default function SourcesPage() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Provenance" title="Sources"
          sub="Every statistic on this site carries a source badge. This page explains what those badges mean and where the numbers come from."
        />
      </header>

      <section aria-labelledby="primary" className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10">
        <h2 id="primary" className="display text-4xl md:text-6xl">Primary sources</h2>
        <ul className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
          {PRIMARY.map((s, i) => (
            <li key={s.name} className="bg-noir p-7">
              <Reveal delay={0.04 * i}>
                <p className="label">{s.role}</p>
                <h3 className="display mt-3 text-3xl">{s.name}</h3>
                <p className="mt-4 text-sm leading-relaxed text-tech">{s.detail}</p>
                <a href={s.url} target="_blank" rel="noreferrer noopener"
                  className="mt-5 inline-block max-w-full break-all font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-gold">
                  {s.url} ↗
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="badges" className="border-y border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <h2 id="badges" className="display text-4xl md:text-6xl">Reading the badges</h2>
          <dl className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ['Source: Formula1.com', 'A published figure, taken as given. Championship positions, points, wins, poles, podiums, entries.'],
              ['CALC · Calculated', 'Not published anywhere. Computed on this site from the season table — win rates, averages, per-entry figures, lap deltas. Always marked.'],
              ['Reconstruction', 'Editorial narrative filling a gap where session data is not available, such as lap-by-lap detail for a race the archive has not yet published. Marked wherever it appears, and replaced by real data when the service is connected.'],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="imagery" className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
        <h2 id="imagery" className="display text-4xl md:text-6xl">Photography</h2>
        <p className="mt-6 max-w-3xl leading-relaxed text-tech">{imageNote}</p>
        <div className="scroll-x mt-10">
          <table className="w-full min-w-[720px] border-collapse">
            <caption className="sr-only">Photography credits and licences</caption>
            <thead>
              <tr className="border-y border-line">
                {['Kind', 'Used for', 'File', 'Author', 'Licence', 'Source'].map((h) => (
                  <th key={h} scope="col" className="label py-3 pr-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allImages.map((img) => (
                <tr key={`${img.kind}-${img.slot}`} className="border-b border-line align-top">
                  <td className="py-3 pr-4">
                    <span className="border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-silver">
                      {img.kind}
                    </span>
                  </td>
                  <th scope="row" className="py-3 pr-4 text-left font-mono text-[11px] font-normal text-ink">
                    {img.slot}
                  </th>
                  <td className="py-3 pr-4 text-xs text-tech">{img.file}</td>
                  <td className="py-3 pr-4 text-xs text-tech">{img.artist}</td>
                  <td className="py-3 pr-4">
                    {img.licenceUrl ? (
                      <a href={img.licenceUrl} target="_blank" rel="noreferrer noopener"
                        className="font-mono text-[11px] text-gold hover:underline">{img.licence}</a>
                    ) : (
                      <span className="font-mono text-[11px] text-tech">{img.licence}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <a href={img.source} target="_blank" rel="noreferrer noopener"
                      className="font-mono text-[11px] text-muted hover:text-gold">Commons ↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 pb-14 md:px-10">
        <RightsNote />
      </div>

      <section aria-labelledby="outlines" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
          <h2 id="outlines" className="display text-4xl md:text-6xl">Circuit outlines</h2>
          <p className="mt-6 max-w-3xl leading-relaxed text-tech">
            The {allShapes.length} circuit layouts on this site are traced from freely licensed
            vector maps on Wikimedia Commons — not drawn by hand and not approximated. The track
            path is extracted from the source file, converted to absolute coordinates and scaled
            into a common box; the geometry itself is unchanged. Lap playback positions the 44
            marker along that real path, so the car follows the circuit&apos;s actual shape.
          </p>
          <div className="scroll-x mt-10">
            <table className="w-full min-w-[680px] border-collapse">
              <caption className="sr-only">Circuit outline sources and licences</caption>
              <thead>
                <tr className="border-y border-line">
                  {['Circuit', 'Source file', 'Author', 'Licence', 'Source'].map((h) => (
                    <th key={h} scope="col" className="label py-3 pr-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allShapes.map((sh) => (
                  <tr key={sh.id} className="border-b border-line align-top">
                    <th scope="row" className="py-3 pr-4 text-left text-sm font-normal text-ink">{sh.name}</th>
                    <td className="py-3 pr-4 text-xs text-tech">{sh.file}</td>
                    <td className="py-3 pr-4 text-xs text-tech">{sh.artist}</td>
                    <td className="py-3 pr-4">
                      {sh.licenceUrl ? (
                        <a href={sh.licenceUrl} target="_blank" rel="noreferrer noopener"
                          className="font-mono text-[11px] text-gold hover:underline">{sh.licence}</a>
                      ) : (
                        <span className="font-mono text-[11px] text-tech">{sh.licence}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <a href={sh.source} target="_blank" rel="noreferrer noopener"
                        className="font-mono text-[11px] text-muted hover:text-gold">Commons ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="basemap" className="border-t border-line">
        <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
          <h2 id="basemap" className="display text-4xl md:text-6xl">The world map</h2>
          <p className="mt-6 max-w-3xl leading-relaxed text-tech">
            The coastline on the circuit map is real geography, not an illustration. It is built
            from {(world as { paths: string[] }).paths.length} landmass outlines decoded from{' '}
            <span className="text-ink">{(world as { source: string }).source}</span>, projected with
            the same equirectangular transform the circuit markers use — so a circuit&apos;s latitude
            and longitude land exactly where they belong on the coast.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <a href={(world as { sourceUrl: string }).sourceUrl} target="_blank" rel="noreferrer noopener"
              className="hover:text-gold">Natural Earth ↗</a>
            <span className="mx-2 text-silver-dim">·</span>
            {(world as { licence: string }).licence}
          </p>
        </div>
      </section>

      <section aria-labelledby="method" className="border-t border-line">
        <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
        <h2 id="method" className="display text-4xl md:text-6xl">Method and known limits</h2>
        <div className="prose-editorial mt-10 max-w-3xl">
          <p>
            <strong className="text-ink">Career totals are never stored.</strong> The figures at the
            top of every page — {career.titles} titles, {career.wins} wins, {career.poles} poles,{' '}
            {career.podiums} podiums, {career.starts} entries, {career.points} points — are summed
            from the {seasons.length}-row season table at render time. Adding a season updates every
            total on the site, and the headline and the detail can never disagree.
          </p>
          <p>
            <strong className="text-ink">The seed snapshot is a fallback, not the source.</strong>{' '}
            This repository ships a static snapshot dated {meta.updatedAt} so the site renders with
            no network and no backend. Whenever the data service is reachable it supersedes the
            snapshot entirely.
          </p>
          <p>
            <strong className="text-ink">Per-season fastest-lap counts are the one uncertain
            field</strong> in the snapshot, and are marked as snapshot values wherever they appear.
            Every circuit figure on this site is now computed from the complete 392-race archive
            rather than estimated, and the championship, win, pole, podium, entry and points totals
            are not subject to any caveat.
          </p>
          <p>
            <strong className="text-ink">&ldquo;P1 starts&rdquo; is not a pole count.</strong> The
            results archive records grid position, so the circuit pages report races started from
            first on the grid. That differs from a qualifying pole whenever a penalty is applied
            between qualifying and the race, so the two are never conflated.
          </p>
          <p>
            <strong className="text-ink">Lap deltas are calculated, not measured.</strong> The Data
            Lab integrates each driver&apos;s speed trace along track distance and scales the result
            onto their measured lap time. It is a close approximation of the official delta, not a
            copy of it, and is badged as calculated throughout.
          </p>
          <p>
            <strong className="text-ink">Rival career totals refresh from the results API.</strong>{' '}
            The values held in the snapshot for other drivers are approximate; the comparison pages
            replace them with live figures when the service is connected.
          </p>
          <p>
            <strong className="text-ink">Photography is freely licensed only.</strong> Every
            photograph on this site comes from Wikimedia Commons under a CC BY or CC BY-SA licence,
            credited to its author on the image itself and listed in full above. No press or agency
            imagery is used. That covers both the editorial photography and the circuit
            photography; a credit tag naming the author and licence sits beneath every image on the
            site. Slots with no freely licensed file render a designed placeholder rather than
            borrowing something unlicensed.
          </p>
          <p>
            <strong className="text-ink">Hamilton is an active driver.</strong> Nothing on this site
            is written as a completed record, and the data layer is built to keep moving.
          </p>
        </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/data-lab" className="btn btn-ghost">The Data Lab →</Link>
            <Link href="/numbers" className="btn btn-ghost">The Numbers →</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface py-12">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Snapshot dated {meta.updatedAt} · {seasons.length} seasons · {career.starts} entries
          </p>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
            This is an independent editorial project and is not officially affiliated with Formula 1,
            the FIA, Mercedes, McLaren, Ferrari or Lewis Hamilton. All trademarks belong to their
            respective owners.
          </p>
        </div>
      </section>
    </div>
  );
}
