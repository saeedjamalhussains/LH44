import Link from 'next/link';
import { meta } from '@/lib/data';

const LINKS = [
  { href: '/', label: 'Legacy' },
  { href: '/numbers', label: 'Numbers' },
  { href: '/data-lab', label: 'Data Lab' },
  { href: '/races', label: 'Races' },
  { href: '/circuits', label: 'Circuits' },
  { href: '/ferrari', label: 'Ferrari' },
  { href: '/beyond-f1', label: 'Beyond F1' },
  { href: '/sources', label: 'Sources' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="display text-[22vw] leading-[0.78] text-ink md:text-[10rem]">44</p>
            <p className="display mt-2 text-2xl text-muted md:text-4xl">THE LEGACY CONTINUES.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 md:grid-cols-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="rule mt-14 pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            This is an independent editorial project and is not officially affiliated with
            Formula 1, the FIA, Mercedes, McLaren, Ferrari or Lewis Hamilton. All trademarks
            belong to their respective owners.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            <span>Data: Formula1.com</span>
            <span>Telemetry: FastF1</span>
            <span>Results: Jolpica F1 API</span>
            <span>Photography: Wikimedia Commons (CC BY / CC BY-SA)</span>
            <span className="text-tech">Snapshot: {meta.updatedAt}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
