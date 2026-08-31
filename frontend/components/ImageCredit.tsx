import type { LicensedImage } from '@/lib/images';

/**
 * The small credit tag that sits under every photograph.
 *
 * Attribution is a licence condition, not decoration, so it renders as real
 * text beneath the image rather than as a hover-only overlay.
 */
export default function ImageCredit({
  image, className = '',
}: { image: LicensedImage; className?: string }) {
  return (
    <p className={`mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted ${className}`}>
      <span className="mr-1.5 border border-line px-1 py-px text-[8px] text-silver">PHOTO</span>
      <a href={image.source} target="_blank" rel="noreferrer noopener"
        className="hover:text-gold">{image.artist}</a>
      <span className="mx-1 text-silver-dim">·</span>
      {image.licenceUrl ? (
        <a href={image.licenceUrl} target="_blank" rel="noreferrer noopener"
          className="hover:text-gold">{image.licence}</a>
      ) : (
        <span>{image.licence}</span>
      )}
      <span className="mx-1 text-silver-dim">·</span>
      <span>Wikimedia Commons</span>
    </p>
  );
}
