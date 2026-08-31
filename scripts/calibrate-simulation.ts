/**
 * Fit the simulation's grip scalar and curvature smoothing.
 *
 * Sweeps the two free parameters and reports the combination with the lowest
 * mean absolute error against real lap times. Run after changing the vehicle
 * model or re-tracing circuit outlines.
 *
 *   node --experimental-strip-types scripts/calibrate-simulation.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { simulateFromShape } from '../frontend/lib/simulate.ts';

const here = dirname(fileURLToPath(import.meta.url));
const shapes = JSON.parse(
  readFileSync(resolve(here, '../data/circuit-shapes.json'), 'utf8'),
).shapes as Record<string, any>;

const REFERENCE: Record<string, number> = {
  silverstone: 87.0, monza: 81.0, catalunya: 73.5, spa: 104.0, suzuka: 89.0,
  interlagos: 70.5, monaco: 72.0, hungaroring: 76.5, shanghai: 93.0,
  villeneuve: 73.0, americas: 96.0, bahrain: 90.0, yas_marina: 84.0,
  albert_park: 77.0, red_bull_ring: 65.0, baku: 102.0, marina_bay: 91.0,
  rodriguez: 77.5, sochi: 93.0, hockenheimring: 72.0, ricard: 92.0,
  sepang: 95.0, jeddah: 89.0, losail: 84.0, istanbul: 85.0, miami: 89.0,
};

/**
 * Two things matter, not one: lap times must land in the right range, and the
 * slowest corner must be a realistic speed. A high minimum-radius floor can buy
 * accurate lap times while making every hairpin far too fast, so the fit is
 * scored on both.
 */
const TARGET_MIN_SPEED = 80;   // km/h, a representative slowest corner

function score(grip: number, window: number, minRadius: number) {
  const errs: number[] = [];
  const minSpeeds: number[] = [];
  for (const [id, real] of Object.entries(REFERENCE)) {
    const sh = shapes[id];
    if (!sh) continue;
    const sim = simulateFromShape(sh, '', { grip, window, minRadius });
    if (!sim) continue;
    errs.push(Math.abs(sim.lapTime / real - 1) * 100);
    minSpeeds.push(Math.min(...sim.trace.map((t) => t.Speed ?? 999)));
  }
  errs.sort((a, b) => a - b);
  minSpeeds.sort((a, b) => a - b);
  const medMin = minSpeeds[Math.floor(minSpeeds.length / 2)];
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  return {
    mean,
    worst: errs[errs.length - 1],
    medMin,
    // Penalise a slowest corner far from a plausible hairpin speed.
    objective: mean + Math.abs(medMin - TARGET_MIN_SPEED) * 0.25,
  };
}

let best: any = { objective: Infinity };
for (let grip = 0.5; grip <= 1.6; grip += 0.05) {
  for (const window of [3, 4, 5, 6, 8, 10]) {
    for (const minRadius of [8, 12, 16, 20, 25, 30, 35, 45]) {
      const s = score(grip, window, minRadius);
      if (s.objective < best.objective) best = { grip: +grip.toFixed(2), window, minRadius, ...s };
    }
  }
}
console.log('best fit:', best);

console.log('\nsensitivity around the fit (mean error % / median slowest corner km/h):');
for (const minRadius of [8, 12, 16, 20, 25, 30, 45]) {
  const s = score(best.grip, best.window, minRadius);
  console.log(`  minRadius ${String(minRadius).padStart(2)}m  mean ${s.mean.toFixed(1)}%  worst ${s.worst.toFixed(1)}%  slowest ${s.medMin}km/h`);
}
