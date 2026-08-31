import type { Metadata } from 'next';
import Link from 'next/link';
import CircuitSilhouette from '@/components/CircuitSilhouette';
import { Reveal, SectionHeader } from '@/components/ui';
import { iconicLaps } from '@/lib/data';
import { shapeForGrandPrix } from '@/lib/shapes';

export const metadata: Metadata = {
  title: 'The Laps That Mattered',
  description:
    'Eight Lewis Hamilton performances worth analysing in detail, each one opening the Data Lab pre-configured for that session.',
};

export default function IconicLapsPage() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Session archive" title="The Laps That Mattered"
          sub="Not the most famous races — the ones where the telemetry explains something the result does not."
        />
      </header>

      <ul className="mx-auto max-w-[1600px] px-5 pb-20 md:px-10">
        {iconicLaps.map((l, i) => (
          <li key={l.id} className="border-t border-line last:border-b">
            <Reveal delay={0.04 * i}>
              <Link
                href={`/data-lab?year=${l.year}&gp=${encodeURIComponent(l.gpSlug)}&session=${l.session}&driver=${l.driver}&compare=${l.compare}`}
                className="group grid gap-6 py-10 transition-colors hover:bg-panel/40 md:grid-cols-[7rem_9rem_1fr_auto] md:items-center md:gap-10"
              >
                <span className="display text-6xl text-ink md:text-7xl">{l.year}</span>
                <span className="hidden h-24 w-24 md:block">
                  {shapeForGrandPrix(l.gpSlug) && (
                    <CircuitSilhouette shape={shapeForGrandPrix(l.gpSlug)!} accent="#8A8A8A"
                      showMarker={false} draw={false} />
                  )}
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    {l.gp} · {l.session} · {l.driver} vs {l.compare}
                  </p>
                  <h2 className="display mt-2 text-3xl md:text-5xl">{l.title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-tech">{l.why}</p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted group-hover:text-gold">
                  Analyse lap →
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>

      <section className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Full telemetry channels are available from 2018 onward. For earlier sessions the Data Lab
            reports what it cannot load rather than substituting anything for it.
          </p>
        </div>
      </section>
    </div>
  );
}
