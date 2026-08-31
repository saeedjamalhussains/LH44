/**
 * Validate the lap simulation against real Formula 1 lap times.
 *
 * Reference times are representative modern race/qualifying laps — the model is
 * expected to land in the right range, not to reproduce any specific lap.
 *
 *   node --experimental-strip-types scripts/check-simulation.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { simulateFromShape, simulateGeneric } from '../frontend/lib/simulate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const shapes = JSON.parse(
  readFileSync(resolve(here, '../data/circuit-shapes.json'), 'utf8'),
).shapes as Record<string, any>;

/** circuitId -> representative real lap time in seconds. */
const REFERENCE: Record<string, number> = {
  silverstone: 87.0, monza: 81.0, catalunya: 73.5, spa: 104.0, suzuka: 89.0,
  interlagos: 70.5, monaco: 72.0, hungaroring: 76.5, shanghai: 93.0,
  villeneuve: 73.0, americas: 96.0, bahrain: 90.0, yas_marina: 84.0,
  albert_park: 77.0, red_bull_ring: 65.0, baku: 102.0, marina_bay: 91.0,
  rodriguez: 77.5, sochi: 93.0, hockenheimring: 72.0, ricard: 92.0,
  sepang: 95.0, jeddah: 89.0, losail: 84.0, istanbul: 85.0, miami: 89.0,
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;

const rows: { id: string; sim: number; real: number; err: number }[] = [];

console.log('circuit           length    simulated      real     error   full-throttle');
console.log('─'.repeat(78));

for (const [id, real] of Object.entries(REFERENCE)) {
  const shape = shapes[id];
  if (!shape) continue;
  const sim = simulateFromShape(shape, 'HAM');
  if (!sim) { console.log(`${id.padEnd(17)} no geometry`); continue; }

  const err = (sim.lapTime / real - 1) * 100;
  rows.push({ id, sim: sim.lapTime, real, err });

  const th = sim.trace.map((t) => t.Throttle ?? 0);
  const full = (100 * th.filter((v) => v >= 99).length) / th.length;

  console.log(
    `${id.padEnd(17)} ${String(shape.lengthKm).padStart(5)}km ` +
    `${fmt(sim.lapTime).padStart(10)} ${fmt(real).padStart(9)} ` +
    `${(err >= 0 ? '+' : '') + err.toFixed(1).padStart(5)}%  ${full.toFixed(0).padStart(4)}%`,
  );
}

const errs = rows.map((r) => Math.abs(r.err)).sort((a, b) => a - b);
const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
console.log('─'.repeat(78));
console.log(`circuits ${rows.length} | mean |error| ${mean.toFixed(1)}% | median ${errs[Math.floor(errs.length / 2)].toFixed(1)}% | worst ${errs[errs.length - 1].toFixed(1)}%`);

// Sanity checks on the physics, using one circuit.
const s = simulateFromShape(shapes.silverstone, 'HAM')!;
const sp = s.trace.map((t) => t.Speed ?? 0);
const th = s.trace.map((t) => t.Throttle ?? 0);
const br = s.trace.map((t) => t.Brake ?? 0);
const gr = s.trace.map((t) => t.nGear ?? 0);
console.log('\nSilverstone trace shape');
console.log(`  speed        ${Math.min(...sp)}–${Math.max(...sp)} km/h, avg ${(sp.reduce((a, b) => a + b, 0) / sp.length).toFixed(0)}`);
console.log(`  throttle     ${(100 * th.filter((v) => v >= 99).length / th.length).toFixed(0)}% of lap at full`);
console.log(`  braking      ${(100 * br.filter((v) => v > 0).length / br.length).toFixed(0)}% of lap`);
console.log(`  gears used   ${Math.min(...gr)}–${Math.max(...gr)}`);
console.log(`  sectors      ${s.sectors.map((x) => x.toFixed(3)).join('  ')}  (sum ${s.sectors.reduce((a, b) => a + b, 0).toFixed(3)} vs lap ${s.lapTime.toFixed(3)})`);

// Driver-to-driver delta should be small but non-zero.
const a = simulateFromShape(shapes.silverstone, 'HAM')!;
const b = simulateFromShape(shapes.silverstone, 'VER')!;
console.log(`\nteammate delta  HAM ${fmt(a.lapTime)}  VER ${fmt(b.lapTime)}  Δ ${(a.lapTime - b.lapTime).toFixed(3)}s`);

const g = simulateGeneric('2024_Nowhere_Race', 5000, 'HAM');
console.log(`generic fallback (5.0km, no geometry): ${fmt(g.lapTime)}`);
