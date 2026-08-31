import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import RaceDetail from '@/components/RaceDetail';
import ImageCredit from '@/components/ImageCredit';
import CircuitSilhouette from '@/components/CircuitSilhouette';
import { SectionHeader } from '@/components/ui';
import { circuits, featuredRaces } from '@/lib/data';
import { trackFor } from '@/lib/images';
import { shapeFor } from '@/lib/shapes';

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function generateMetadata(
  { params }: { params: Promise<{ year: string; gp: string }> },
): Promise<Metadata> {
  const { year, gp } = await params;
  const circuit = circuits.find((c) => norm(c.id) === norm(gp) || norm(c.name).includes(norm(gp)));
  const name = circuit?.gp ?? gp.replace(/-/g, ' ');
  return {
    title: `${year} ${name}`,
    description: `Lewis Hamilton at the ${year} ${name}: qualifying, race result, points, tyre strategy and position progression.`,
  };
}

export default async function RaceDetailPage({
  params,
}: { params: Promise<{ year: string; gp: string }> }) {
  const { year, gp } = await params;
  const circuit = circuits.find(
    (c) => norm(c.id) === norm(gp) || norm(c.name).includes(norm(gp)) || norm(c.gp).includes(norm(gp)));
  const seed = featuredRaces.find(
    (r) => r.year === Number(year) && (norm(r.circuit) === norm(gp) || norm(r.gp).includes(norm(gp))));
  const track = circuit ? trackFor(circuit.id) : undefined;
  const outline = circuit ? shapeFor(circuit.id) : undefined;

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Link href="/races" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-ink">
          ← Race archive
        </Link>
        <SectionHeader
          as="h1"
          eyebrow={`Round · ${year}`}
          title={circuit?.gp ?? gp.replace(/-/g, ' ')}
          sub={circuit
            ? [circuit.name, circuit.country,
               circuit.length != null ? `${circuit.length} km` : null,
               circuit.turns != null ? `${circuit.turns} turns` : null,
              ].filter(Boolean).join(' · ')
            : undefined}
        />

        {outline && (
          <figure className="mb-10 flex flex-wrap items-center gap-8 border-y border-line py-8">
            <div className="h-44 w-44 shrink-0">
              <CircuitSilhouette shape={outline} accent="#C9A227" showMarker={false} />
            </div>
            <div className="min-w-0">
              <p className="label">Circuit layout</p>
              <p className="display mt-2 text-2xl md:text-3xl">{outline.name}</p>
              <p className="mt-3 max-w-md font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
                <span className="mr-1.5 border border-line px-1 py-px text-[8px] text-silver">TRACE</span>
                Traced from{' '}
                <a href={outline.source} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                  {outline.file}
                </a>{' '}by {outline.artist}
                <span className="mx-1 text-silver-dim">·</span>
                {outline.licenceUrl ? (
                  <a href={outline.licenceUrl} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                    {outline.licence}
                  </a>
                ) : outline.licence}
                <span className="mx-1 text-silver-dim">·</span>Wikimedia Commons
              </p>
            </div>
          </figure>
        )}

        {track && (
          <figure className="mb-12">
            <div className="relative aspect-[21/9] overflow-hidden border border-line">
              <Image src={track.src} alt={track.alt} fill priority
                sizes="(min-width: 1024px) 90vw, 100vw" className="object-cover" />
              <span aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-noir via-noir/25 to-transparent" />
              <span aria-hidden
                className="absolute bottom-4 right-6 font-display text-6xl leading-none text-ink/35">44</span>
            </div>
            <ImageCredit image={track} />
          </figure>
        )}
      </div>
      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <RaceDetail year={Number(year)} gp={gp} circuitName={circuit?.name} seed={seed ?? null} />
      </div>
    </div>
  );
}
