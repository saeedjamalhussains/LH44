import manifest from '@/data/images.json';

export interface LicensedImage {
  src: string; width: number; height: number;
  caption: string; alt: string;
  artist: string; licence: string; licenceUrl: string; source: string; file: string;
  category?: string;
}

export interface LicensedVideo {
  sources: { src: string; type: string; width: number; height: number }[];
  poster: string;
  caption: string; alt: string;
  artist: string; licence: string; licenceUrl: string; source: string; file: string;
  note?: string;
}

type Manifest = {
  note: string;
  images: Record<string, LicensedImage>;
  tracks: Record<string, LicensedImage>;
  cars: Record<string, LicensedImage>;
  /** Present only if a freely licensed clip is ever added. */
  video?: Record<string, LicensedVideo>;
};

const m = manifest as Manifest;

export const imageNote = m.note;

/** Editorial photography, keyed by slot. */
export const imageFor = (slot: string): LicensedImage | undefined => m.images[slot];

/** Circuit photography, keyed by the results API's circuitId. */
export const trackFor = (circuitId: string): LicensedImage | undefined => m.tracks[circuitId];

/** The car Hamilton raced that season, keyed by year. */
export const carFor = (year: number | string): LicensedImage | undefined => m.cars[String(year)];

/** Freely licensed footage, keyed by slot. */
export const videoFor = (slot: string): LicensedVideo | undefined => m.video?.[slot];

export const allVideo: (LicensedVideo & { slot: string })[] =
  Object.entries(m.video ?? {}).map(([slot, v]) => ({ slot, ...v }));

export const allImages:
  (LicensedImage & { slot: string; kind: 'Editorial' | 'Circuit' | 'Car' })[] = [
  ...Object.entries(m.images).map(([slot, v]) => ({ slot, kind: 'Editorial' as const, ...v })),
  ...Object.entries(m.cars).map(([slot, v]) => ({ slot, kind: 'Car' as const, ...v })),
  ...Object.entries(m.tracks).map(([slot, v]) => ({ slot, kind: 'Circuit' as const, ...v })),
];
