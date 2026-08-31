import Image from 'next/image';
import ImageCredit from './ImageCredit';
import { carFor, imageFor, trackFor } from '@/lib/images';

/**
 * Editorial image frame.
 *
 * Pass `slot` to render a licensed photograph from the Commons manifest, with
 * its author and licence shown on the plate. Slots with no image fall back to a
 * designed placeholder that names what belongs there, so the layout is identical
 * either way and nothing unlicensed is ever displayed.
 */
export default function ImagePlate({
  slot, track, car, caption, credit, aspect = '4 / 5', accent = '#9BA1A6',
  className = '', tone = 0, priority = false, sizes = '(min-width: 1024px) 40vw, 100vw',
}: {
  /** Editorial photography slot. */
  slot?: string;
  /** Circuit id — renders the track photograph for that circuit. */
  track?: string;
  /** Season year — renders the car Hamilton raced that year. */
  car?: number | string;
  caption?: string; credit?: string; aspect?: string; accent?: string;
  className?: string; tone?: number; priority?: boolean; sizes?: string;
}) {
  const img = car != null ? carFor(car) : track ? trackFor(track) : slot ? imageFor(slot) : undefined;

  if (img) {
    return (
      <figure className={className}>
        <div className="relative isolate overflow-hidden border border-line"
          style={{ aspectRatio: aspect }}>
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
          <span aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noir/85 via-transparent to-transparent" />
          <span aria-hidden className="absolute right-4 top-3 font-display text-5xl leading-none"
            style={{ color: accent, opacity: 0.22 }}>44</span>
          <figcaption className="absolute inset-x-0 bottom-0 p-3">
            <span className="block text-[11px] leading-snug text-ink">{caption ?? img.caption}</span>
          </figcaption>
        </div>
        <ImageCredit image={img} />
      </figure>
    );
  }

  return (
    <figure
      className={`relative isolate overflow-hidden border border-line ${className}`}
      style={{
        aspectRatio: aspect,
        backgroundImage: `radial-gradient(120% 90% at ${20 + tone * 12}% 0%, ${accent}22, transparent 62%),
          linear-gradient(160deg, #0B0B0B 0%, #050505 70%)`,
      }}
      role="img"
      aria-label={`Image placeholder: ${caption ?? 'photography'}`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={-60 + i * 58} y1={-40} x2={60 + i * 58} y2={540}
            stroke={accent} strokeWidth="0.5" opacity={0.16} />
        ))}
        <path d={`M0 ${330 + tone * 20} C 120 ${250 + tone * 10}, 240 ${400 - tone * 12}, 400 ${300 + tone * 8}`}
          fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
      </svg>
      <span aria-hidden className="absolute right-4 top-3 font-display text-5xl leading-none"
        style={{ color: accent, opacity: 0.14 }}>44</span>
      <figcaption className="absolute inset-x-0 bottom-0 border-t border-line bg-noir/80 p-3 backdrop-blur-sm">
        <span className="block font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-muted">
          Image placeholder
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-tech">{caption}</span>
        {credit && <span className="mt-1 block font-mono text-[9px] text-muted">{credit}</span>}
      </figcaption>
    </figure>
  );
}
