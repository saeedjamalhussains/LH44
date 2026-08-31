import type { MetadataRoute } from 'next';
import { championships, meta } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://legacy-of-44.example';
  const routes = [
    '', '/numbers', '/timeline', '/championships', '/data-lab', '/iconic-laps',
    '/rivalries', '/races', '/circuits', '/machines', '/ferrari', '/beyond-f1', '/sources',
  ];
  const lastModified = new Date(meta.updatedAt);
  return [
    ...routes.map((r) => ({ url: `${base}${r}`, lastModified, priority: r === '' ? 1 : 0.7 })),
    ...championships.map((c) => ({
      url: `${base}/championships/${c.year}`, lastModified, priority: 0.6,
    })),
  ];
}
