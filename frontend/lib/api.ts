'use client';

import type { TelemetryResponse } from './types';

/**
 * Client access to the FastF1 service.
 *
 * Requests go through the Next rewrite at /api/f1/* so the browser never needs
 * the backend origin. If the service is absent the caller receives a structured
 * `available: false` result and renders the TELEMETRY UNAVAILABLE state — the
 * page never throws.
 */
const BASE = '/api/f1';

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[lh44] data service unreachable for ${path}:`, err);
    return fallback;
  }
}

const OFFLINE: TelemetryResponse = {
  available: false,
  reason:
    'The FastF1 data service is not running. Start the backend to load real session telemetry, or load the simulated trace below.',
};

export const getTelemetry = (year: number, gp: string, session: string, driver: string) =>
  get<TelemetryResponse>(
    `/telemetry/${year}/${encodeURIComponent(gp)}/${session}/${driver}`, OFFLINE);

export const getLapTelemetry = (
  year: number, gp: string, session: string, driver: string, lap: number,
) => get<TelemetryResponse>(
  `/telemetry/${year}/${encodeURIComponent(gp)}/${session}/${driver}/${lap}`, OFFLINE);

export const getComparison = (
  year: number, gp: string, session: string, d1: string, d2: string,
) => get<{
  available: boolean; reason?: string; gap?: number | null;
  laps?: Record<string, { lapTime: number | null; sector1: number | null;
                          sector2: number | null; sector3: number | null }>;
  traces?: Record<string, unknown[]>;
  delta?: { Distance: number; delta: number }[];
}>(`/compare/${year}/${encodeURIComponent(gp)}/${session}/${d1}/${d2}`, {
  available: false, reason: OFFLINE.reason,
});

export const getTyreStrategy = (year: number, gp: string, session: string, driver: string) =>
  get<{ available: boolean; reason?: string;
        stints?: { compound: string; from: number; to: number; laps: number }[] }>(
    `/session/${year}/${encodeURIComponent(gp)}/${session}`,
    { available: false, reason: OFFLINE.reason });

export const getHealth = () =>
  get<{ ok: boolean; fastf1: boolean; updatedAt?: string }>(
    '/health', { ok: false, fastf1: false });

export const getRaceArchive = () =>
  get<{ available: boolean; degraded?: boolean; reason?: string; count: number; races: unknown[] }>(
    '/driver/hamilton/races', { available: false, count: 0, races: [] });
