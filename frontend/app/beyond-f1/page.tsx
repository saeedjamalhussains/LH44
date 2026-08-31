import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, SectionHeader } from '@/components/ui';
import { beyondF1 } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Beyond F1',
  description:
    "Lewis Hamilton's work beyond Formula 1: representation, the Hamilton Commission, Mission 44, activism and culture — fact and editorial interpretation kept separate.",
};

export default function BeyondF1Page() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Outside the lap" title="The Legacy Beyond the Lap"
          sub="Every entry below separates what is documented from what is interpretation. The two are labelled, and never merged."
        />
        <Reveal>
          <div className="panel flex flex-wrap gap-8 p-6">
            <div className="flex items-start gap-3">
              <span className="mt-1 border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink">Fact</span>
              <p className="max-w-xs text-xs leading-relaxed text-muted">
                Documented and attributable. Dates, organisations, published reports.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 border border-silver-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-silver">Editorial</span>
              <p className="max-w-xs text-xs leading-relaxed text-muted">
                This site&apos;s reading of what the fact means. Argued, not asserted.
              </p>
            </div>
          </div>
        </Reveal>
      </header>

      <ol className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
        {beyondF1.sections.map((s, i) => (
          <li key={s.id} className="border-t border-line last:border-b">
            <Reveal delay={0.03 * i}>
              <article className="grid gap-8 py-12 lg:grid-cols-[1fr_1fr_1fr] lg:gap-14">
                <h2 className="display text-3xl md:text-5xl">
                  <span className="mr-4 font-mono text-[10px] align-super text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.title}
                </h2>
                <div>
                  <p className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink w-fit">
                    Fact
                  </p>
                  <p className="mt-4 leading-[1.75] text-tech">{s.fact}</p>
                </div>
                <div>
                  <p className="border border-silver-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-silver w-fit">
                    Editorial
                  </p>
                  <p className="mt-4 leading-[1.75] text-muted">{s.editorial}</p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>

      <section className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="display text-3xl md:text-5xl">A note on this chapter</p>
            <p className="mt-5 max-w-2xl leading-relaxed text-tech">
              This section deliberately avoids ranking the significance of Hamilton&apos;s work
              outside the sport against his record inside it. The facts are stated with their
              organisations and dates so they can be checked; the interpretation is marked so it can
              be disagreed with.
            </p>
            <Link href="/sources" className="btn btn-ghost mt-8">Where this comes from →</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
