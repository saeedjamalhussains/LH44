/** Lap times arrive as seconds and are displayed as M:SS.mmm. */
export function lapTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, '0')}`;
}

export function delta(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function num(value: number | string): string {
  return typeof value === 'number' ? value.toLocaleString('en-GB') : value;
}

export const TYRE_COLORS: Record<string, string> = {
  Soft: '#D40000', Medium: '#C9A227', Hard: '#F4F4F4',
  Intermediate: '#43B02A', Wet: '#0067AD', Unknown: '#8A8A8A',
};

export const TEAM_ACCENT: Record<string, string> = {
  McLaren: '#9BA1A6', Mercedes: '#9BA1A6', Ferrari: '#D40000',
};

export function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
