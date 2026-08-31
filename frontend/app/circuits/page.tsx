import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import WorldMap from '@/components/WorldMap';
import ImageCredit from '@/components/ImageCredit';
import RightsNote from '@/components/RightsNote';
import { Reveal, SectionHeader, SourceBadge } from '@/components/ui';
import { circuits, meta } from '@/lib/data';
import { trackFor } from '@/lib/images';
import { shapeFor } from '@/lib/shapes';
import CircuitSilhouette from '@/components/CircuitSilhouette';

export const metadata: Metadata = {
  title: 'Circuit Database',
  description:
    'Every circuit Lewis Hamilton has raced at, mapped: starts, wins, podiums, best finish and average grid at each, computed from the full race archive.',
};

export default function CircuitsPage() {
  const ranked = [...circuits].sort((a, b) => b.wins - a.wins || b.starts - a.starts);
  const gallery = ranked.filter((c) => trackFor(c.id)).slice(0, 12);
  const totalStarts = circuits.reduce((a, c) => a + c.starts, 0);
  const totalWins = circuits.reduce((a, c) => a + c.wins, 0);

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Circuit database" title="Where It Happened"
          sub={`${circuits.length} circuits, ${totalStarts} starts, ${totalWins} victories. Select any marker to open that circuit's record.`}
        />
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10">
        <WorldMap circuits={circuits} source="Jolpica F1 API — computed from every Hamilton race result" />
      </div>

      {/* TRACK GALLERY */}
      <section aria-labelledby="tracks" className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 id="tracks" className="display text-4xl md:text-6xl">The circuits</h2>
            <p className="mt-3 max-w-2xl text-tech">
              The twelve circuits where Hamilton has won most often.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((c, i) => {
              const track = trackFor(c.id)!;
              return (
                <li key={c.id}>
                  <Reveal delay={0.04 * (i % 6)}>
                    <article className="group">
                      <div className="relative aspect-[16/10] overflow-hidden border border-line">
                        <Image src={track.src} alt={track.alt} fill loading="lazy"
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                        <span aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/10 to-transparent" />
                        {shapeFor(c.id) && (
                          <div aria-hidden
                            className="pointer-events-none absolute right-3 top-3 h-16 w-16 opacity-70
                              transition-opacity duration-500 group-hover:opacity-100">
                            <CircuitSilhouette shape={shapeFor(c.id)!} accent="#C9A227"
                              showMarker={false} draw={false} />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-ink">{c.name}</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                              {c.country} · {c.firstYear}–{c.lastYear}
                            </p>
                          </div>
                          <p className="display shrink-0 pl-3 text-5xl text-gold">{c.wins}</p>
                        </div>
                      </div>
                      <ImageCredit image={track} />
                      <dl className="mt-3 flex gap-6 border-t border-line pt-3 font-mono text-[10px]">
                        {([['Starts', c.starts], ['Podiums', c.podiums],
                           ['P1 starts', c.p1Starts],
                           ['Best', c.bestFinish != null ? `P${c.bestFinish}` : '—']] as [string, string | number][])
                          .map(([k, v]) => (
                          <div key={k}>
                            <dt className="label">{k}</dt>
                            <dd className="mt-1 text-sm text-tech tabular">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* FULL TABLE */}
      <section aria-labelledby="all-circuits" className="border-t border-line py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 id="all-circuits" className="display text-4xl md:text-6xl">Every circuit</h2>
            <p className="mt-3 max-w-2xl text-tech">
              Ranked by victories. Every column is computed from the full race archive.
            </p>
          </Reveal>

          <div className="scroll-x mt-10 hidden md:block">
            <table className="w-full border-collapse">
              <caption className="sr-only">Hamilton record at each circuit</caption>
              <thead>
                <tr className="border-y border-line">
                  {['Circuit', 'Country', 'Years', 'Starts', 'Wins', 'Podiums', 'P1 starts',
                    'Best', 'Avg grid', 'Avg finish', 'Points'].map((h) => (
                    <th key={h} scope="col" className="label py-3 pr-4 text-left first:pl-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((c) => (
                  <tr key={c.id} className="border-b border-line transition-colors hover:bg-panel">
                    <th scope="row" className="py-3 pl-2 pr-4 text-left text-sm font-normal text-ink">{c.name}</th>
                    <td className="py-3 pr-4 font-mono text-[11px] text-muted">{c.country}</td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-muted tabular">{c.firstYear}–{c.lastYear}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-tech tabular">{c.starts}</td>
                    <td className="py-3 pr-4 font-display text-2xl text-gold tabular">{c.wins}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-tech tabular">{c.podiums}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-tech tabular">{c.p1Starts}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-tech tabular">
                      {c.bestFinish != null ? `P${c.bestFinish}` : '—'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-muted tabular">{c.avgGrid ?? '—'}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-muted tabular">{c.avgFinish ?? '—'}</td>
                    <td className="py-3 font-mono text-sm text-tech tabular">{c.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-10 grid gap-px border border-line bg-line md:hidden">
            {ranked.map((c) => (
              <li key={c.id} className="bg-noir p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-ink">{c.name}</span>
                  <span className="display shrink-0 text-3xl text-gold">{c.wins}</span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted">
                  {c.starts} starts · {c.podiums} podiums · P1×{c.p1Starts} ·
                  best {c.bestFinish != null ? `P${c.bestFinish}` : '—'} · {c.points} pts
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-2">
            <SourceBadge source="Jolpica F1 API — starts, wins, podiums, grid slots and averages computed from all 392 race results" />
            <p className="max-w-3xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
              &ldquo;P1 starts&rdquo; counts races begun from first on the grid. It is not a qualifying
              pole count — the two differ whenever a penalty is applied between qualifying and the race.
            </p>
          </div>

          <RightsNote className="mt-8" />

          <Reveal>
            <Link href="/races" className="btn btn-ghost mt-10">Search the race archive →</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
