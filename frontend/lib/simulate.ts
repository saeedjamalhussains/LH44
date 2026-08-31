/**
 * Lap simulation.
 *
 * This is NOT session data and is never presented as such. It exists so the
 * Data Lab's interaction model can be explored with the FastF1 backend switched
 * off, and every view that renders it carries a SIMULATED watermark and an
 * explicit `synthetic: true` flag.
 *
 * The model is a quasi-steady-state lap simulation run over the circuit's real
 * traced geometry:
 *
 *   1. flatten the traced outline to a polyline and resample it at even spacing
 *   2. scale it so its total length equals the circuit's true length
 *   3. take the corner radius at every point from the local curvature
 *   4. cap speed in each corner by the lateral grip available at that speed
 *   5. run a forward pass (power and traction limited) and a backward pass
 *      (braking limited) around the closed loop until they converge
 *   6. integrate time, and derive throttle, brake, gear and RPM from the
 *      longitudinal acceleration the car is actually being asked for
 *
 * Because the geometry is the real circuit, the resulting trace has its corners
 * in the right places and its lap time in the right range. It remains a model:
 * no tyre model, no fuel load, no elevation, no wind.
 */
import type { TelemetryPoint, TelemetryResponse } from './types';
import type { CircuitShape } from './shapes';

/* ------------------------------------------------------------------ *
 * Vehicle model — a current-generation Formula 1 car, approximately.
 * ------------------------------------------------------------------ */
const CAR = {
  mass: 798,              // kg, minimum weight including driver
  power: 735_000,         // W, ~1000 hp combined
  /** Lateral grip rises with speed as downforce builds: a = mech + k·v². */
  aLatMech: 20,           // m/s², mechanical grip alone (~2.0 g)
  aLatDownforce: 0.0055,  // m/s² per (m/s)²
  aLatMax: 55,            // m/s² ceiling (~5.6 g)
  /** Braking behaves the same way, and is grip- rather than brake-limited. */
  aBrakeMech: 18,
  aBrakeDownforce: 0.0060,
  aBrakeMax: 62,          // ~6.3 g
  aTraction: 15,          // m/s² traction ceiling off the line
  dragK: 0.000998,        // drag deceleration coefficient: a_drag = k·v²
  vMax: 97,               // m/s (~350 km/h) terminal speed guard
  vMin: 15,               // m/s (~54 km/h) slowest hairpin
};

/**
 * Calibration.
 *
 * The traced outlines are drawings, so their curvature does not match the real
 * racing surface exactly. These three constants are fitted against real lap
 * times across 26 circuits by scripts/calibrate-simulation.ts, which reports a
 * mean absolute error of about 6.6% across 26 circuits.
 *
 * The fit is scored on two things, not one: lap times must land in the right
 * range *and* the slowest corner must be a realistic speed. A higher radius
 * floor buys better lap times while making every hairpin 116 km/h, which is
 * wrong in a way a lap time alone would not reveal. These values keep the
 * median slowest corner at about 80 km/h.
 *
 * scripts/check-simulation.ts prints the per-circuit result. Re-run both after
 * changing the vehicle model or re-tracing the outlines.
 */
const GRIP_CALIBRATION = 0.9;

/**
 * Tracing noise makes some drawn corners far tighter than the real ones, which
 * dominates the lap time. The curvature window smooths that out and the floor
 * rejects radii no real corner has.
 */
const CURVATURE_WINDOW = 3;
const MIN_RADIUS_M = 20;

const SAMPLES = 500;

export interface SimOptions {
  grip?: number;
  window?: number;
  minRadius?: number;
}

/* ------------------------------------------------------------------ *
 * Deterministic randomness — stable across reloads.
 * ------------------------------------------------------------------ */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */
interface Pt { x: number; y: number }

/** Flatten an absolute SVG path (M/L/C/S/Q/T/Z) to a polyline. No DOM needed. */
export function flattenPath(d: string, perCurve = 16): Pt[] {
  const tokens = d.match(/[MLCSQTZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const pts: Pt[] = [];
  let i = 0;
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  let prevCtrl: Pt | null = null;
  let cmd = '';

  const num = () => Number(tokens[i++]);
  const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) => {
    for (let k = 1; k <= perCurve; k++) {
      const t = k / perCurve;
      const u = 1 - t;
      pts.push({
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
      });
    }
  };

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/[MLCSQTZ]/i.test(tok)) { cmd = tok.toUpperCase(); i++; }
    if (cmd === 'Z') { pts.push({ ...start }); cur = { ...start }; prevCtrl = null; cmd = ''; continue; }
    if (i >= tokens.length) break;

    if (cmd === 'M') {
      cur = { x: num(), y: num() };
      start = { ...cur };
      pts.push({ ...cur });
      prevCtrl = null;
      cmd = 'L';
    } else if (cmd === 'L') {
      cur = { x: num(), y: num() };
      pts.push({ ...cur });
      prevCtrl = null;
    } else if (cmd === 'C') {
      const p1 = { x: num(), y: num() };
      const p2 = { x: num(), y: num() };
      const p3 = { x: num(), y: num() };
      bezier(cur, p1, p2, p3);
      prevCtrl = p2; cur = p3;
    } else if (cmd === 'S') {
      // Smooth cubic: the first control point mirrors the previous one.
      const p1 = prevCtrl ? { x: 2 * cur.x - prevCtrl.x, y: 2 * cur.y - prevCtrl.y } : { ...cur };
      const p2 = { x: num(), y: num() };
      const p3 = { x: num(), y: num() };
      bezier(cur, p1, p2, p3);
      prevCtrl = p2; cur = p3;
    } else if (cmd === 'Q' || cmd === 'T') {
      const q: Pt = cmd === 'Q' ? { x: num(), y: num() }
        : (prevCtrl ? { x: 2 * cur.x - prevCtrl.x, y: 2 * cur.y - prevCtrl.y } : { ...cur });
      const p3 = { x: num(), y: num() };
      // Raise the quadratic to an equivalent cubic.
      bezier(cur,
        { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) },
        { x: p3.x + (2 / 3) * (q.x - p3.x), y: p3.y + (2 / 3) * (q.y - p3.y) },
        p3);
      prevCtrl = q; cur = p3;
    } else {
      i++;  // unrecognised token; skip rather than loop forever
    }
  }
  return pts;
}

/** Resample a polyline to `n` points at even arc-length spacing, scaled to `lengthM`. */
export function resample(pts: Pt[], n: number, lengthM: number): { points: Pt[]; ds: number } {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = cum[cum.length - 1];
  if (!total) return { points: [], ds: 0 };
  const scale = lengthM / total;

  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const span = cum[j + 1] - cum[j] || 1;
    const t = (target - cum[j]) / span;
    out.push({
      x: (pts[j].x + (pts[j + 1].x - pts[j].x) * t) * scale,
      y: (pts[j].y + (pts[j + 1].y - pts[j].y) * t) * scale,
    });
  }
  return { points: out, ds: lengthM / n };
}

/**
 * Corner radius at each point, from the circle through it and its neighbours.
 * Returns metres; straights come back as Infinity.
 */
export function curvatureRadii(pts: Pt[], smooth = CURVATURE_WINDOW, minRadius = MIN_RADIUS_M): number[] {
  const n = pts.length;
  const radii = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - smooth + n) % n];
    const b = pts[i];
    const c = pts[(i + smooth) % n];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const ca = Math.hypot(a.x - c.x, a.y - c.y);
    // Twice the triangle area, via the cross product.
    const area2 = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
    radii[i] = area2 < 1e-9 ? Infinity : (ab * bc * ca) / (2 * area2);
  }
  // A median filter removes single-point spikes from the tracing, and the floor
  // rejects radii tighter than any real Formula 1 corner.
  return radii.map((_, i) => {
    const w = [radii[(i - 2 + n) % n], radii[(i - 1 + n) % n], radii[i],
               radii[(i + 1) % n], radii[(i + 2) % n]].sort((x, y) => x - y);
    return Math.max(minRadius, w[2]);
  });
}

/* ------------------------------------------------------------------ *
 * Solver
 * ------------------------------------------------------------------ */
const aLat = (v: number, g: number) =>
  Math.min(CAR.aLatMax, CAR.aLatMech + CAR.aLatDownforce * v * v) * g;
const aBrake = (v: number, g: number) =>
  Math.min(CAR.aBrakeMax, CAR.aBrakeMech + CAR.aBrakeDownforce * v * v) * g;
const aDrag = (v: number) => CAR.dragK * v * v;
const aAccel = (v: number) =>
  Math.max(0, Math.min(CAR.aTraction, CAR.power / (CAR.mass * Math.max(v, 5))) - aDrag(v));

/** Speed at every point, in m/s. */
export function solveSpeeds(radii: number[], ds: number, grip: number): number[] {
  const n = radii.length;
  // Cornering limit.
  const v = radii.map((r) => {
    if (!Number.isFinite(r)) return CAR.vMax;
    // v = sqrt(a_lat(v) · r), solved directly since a_lat depends on v.
    const denom = 1 - CAR.aLatDownforce * grip * r;
    const vSq = denom > 0.05
      ? (CAR.aLatMech * grip * r) / denom          // downforce-limited regime
      : CAR.aLatMax * grip * r;                    // ceiling reached
    return Math.max(CAR.vMin, Math.min(CAR.vMax, Math.sqrt(Math.max(vSq, 0))));
  });

  // Two sweeps around the closed loop are enough to converge.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {         // forward: power and traction limit
      const p = (i - 1 + n) % n;
      const limit = Math.sqrt(v[p] * v[p] + 2 * aAccel(v[p]) * ds);
      if (limit < v[i]) v[i] = limit;
    }
    for (let i = n - 1; i >= 0; i--) {    // backward: braking limit
      const nx = (i + 1) % n;
      const limit = Math.sqrt(v[nx] * v[nx] + 2 * aBrake(v[nx], grip) * ds);
      if (limit < v[i]) v[i] = limit;
    }
  }
  return v;
}

/* ------------------------------------------------------------------ *
 * Gearbox
 * ------------------------------------------------------------------ */
const GEAR_TOP = 8;
const RPM_MIN = 9_500;
const RPM_MAX = 12_800;
/** Upshift speeds in m/s, giving eight ratios up to terminal speed. */
const SHIFT = [18, 27, 38, 50, 62, 75, 88];

function gearFor(v: number): number {
  let g = 1;
  while (g <= SHIFT.length && v > SHIFT[g - 1]) g++;
  return Math.min(GEAR_TOP, g);
}

function rpmFor(v: number, gear: number): number {
  const lo = gear === 1 ? 0 : SHIFT[gear - 2];
  const hi = gear > SHIFT.length ? CAR.vMax : SHIFT[gear - 1];
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1)));
  return Math.round(RPM_MIN + t * (RPM_MAX - RPM_MIN));
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
export interface SimResult {
  trace: TelemetryPoint[];
  lapTime: number;
  sectors: [number, number, number];
  geometry: boolean;
}

/** Simulate a lap over a circuit's real traced geometry. */
export function simulateFromShape(
  shape: CircuitShape, driverKey = '', opts: SimOptions = {},
): SimResult | null {
  const lengthM = (shape.lengthKm ?? 0) * 1000;
  if (!lengthM) return null;

  const flat = flattenPath(shape.d);
  if (flat.length < 20) return null;

  const { points, ds } = resample(flat, SAMPLES, lengthM);
  if (!points.length) return null;

  // Per-driver execution: a small grip scalar, not a speed multiplier, so the
  // resulting delta develops through the corners rather than uniformly.
  const dr = rng(hash(shape.file + driverKey));
  const base = opts.grip ?? GRIP_CALIBRATION;
  const grip = base * (driverKey ? 0.965 + dr() * 0.07 : 1);

  const radii = curvatureRadii(points, opts.window ?? CURVATURE_WINDOW,
                               opts.minRadius ?? MIN_RADIUS_M);
  const v = solveSpeeds(radii, ds, grip);

  return buildTrace(v, ds, points, grip);
}

function buildTrace(v: number[], ds: number, points?: Pt[], grip = GRIP_CALIBRATION): SimResult {
  const n = v.length;
  const trace: TelemetryPoint[] = [];
  let time = 0;
  const cumTime: number[] = [];

  for (let i = 0; i < n; i++) {
    const nx = (i + 1) % n;
    // Longitudinal acceleration actually demanded over this step.
    const a = (v[nx] * v[nx] - v[i] * v[i]) / (2 * ds);
    const speed = v[i];

    let throttle = 0;
    let brake = 0;
    if (a > 0.3) {
      throttle = Math.min(100, (a / Math.max(aAccel(speed), 0.1)) * 100);
    } else if (a < -0.3) {
      brake = Math.min(100, (-a / Math.max(aBrake(speed, grip), 0.1)) * 100);
    } else {
      // Holding speed still needs enough throttle to balance drag.
      throttle = Math.min(100, (aDrag(speed) / Math.max(aAccel(speed) + aDrag(speed), 0.1)) * 100);
    }

    const gear = gearFor(speed);
    trace.push({
      Distance: Math.round(i * ds),
      Speed: Math.round(speed * 3.6),
      Throttle: Math.round(throttle),
      Brake: Math.round(brake),
      nGear: gear,
      RPM: rpmFor(speed, gear),
      ...(points ? { X: Math.round(points[i].x), Y: Math.round(points[i].y) } : {}),
    });

    cumTime.push(time);
    time += ds / Math.max(speed, 1);
  }

  const at = (frac: number) => cumTime[Math.min(n - 1, Math.floor(frac * n))];
  const s1 = at(1 / 3);
  const s2 = at(2 / 3);
  return {
    trace,
    lapTime: Math.round(time * 1000) / 1000,
    // Sector splits are taken at thirds of lap distance; real timing lines sit
    // wherever the circuit puts them.
    sectors: [
      Math.round(s1 * 1000) / 1000,
      Math.round((s2 - s1) * 1000) / 1000,
      Math.round((time - s2) * 1000) / 1000,
    ],
    geometry: Boolean(points),
  };
}

/**
 * Fallback for circuits with no traced outline: a plausible corner sequence at
 * the right circuit length. Corner placement is invented, so this is only used
 * when real geometry is unavailable.
 */
export function simulateGeneric(key: string, lengthM = 5000, driverKey = ''): SimResult {
  const rand = rng(hash(key));
  const dr = rng(hash(key + driverKey));
  const grip = GRIP_CALIBRATION * (driverKey ? 0.99 + dr() * 0.02 : 1);

  const ds = lengthM / SAMPLES;
  // Corner count and corner length are scaled to the circuit so the straight /
  // corner balance matches a real lap, rather than leaving it almost all straight.
  const cornerCount = Math.max(10, Math.round(lengthM / 330));
  const corners = Array.from({ length: cornerCount }, (_, i) => ({
    at: ((i + 0.5 + (rand() - 0.5) * 0.6) / cornerCount) * lengthM,
    radius: 30 + rand() * 220,
    half: 70 + rand() * 90,
  }));

  const radii = Array.from({ length: SAMPLES }, (_, i) => {
    const d = i * ds;
    let r = Infinity;
    for (const c of corners) {
      // Wrap the comparison so a corner near the line still applies at both ends.
      const raw = Math.abs(d - c.at);
      const gap = Math.min(raw, lengthM - raw);
      if (gap < c.half) r = Math.min(r, c.radius * (1 + Math.pow(gap / c.half, 2) * 5));
    }
    return r;
  });

  return buildTrace(solveSpeeds(radii, ds, grip), ds, undefined, grip);
}

/* ------------------------------------------------------------------ *
 * Adapters used by the Data Lab
 * ------------------------------------------------------------------ */
export function simulatedResponse(
  key: string, driver: string, shape?: CircuitShape,
): TelemetryResponse {
  const sim = (shape && simulateFromShape(shape, driver))
    ?? simulateGeneric(key, (shape?.lengthKm ?? 5) * 1000, driver);

  return {
    available: true,
    synthetic: true,
    driver,
    lap: {
      lapNumber: null,
      lapTime: sim.lapTime,
      sector1: sim.sectors[0],
      sector2: sim.sectors[1],
      sector3: sim.sectors[2],
      compound: 'Soft',
    },
    trace: sim.trace,
    source: sim.geometry
      ? 'Simulated on the circuit’s traced geometry — not session data'
      : 'Simulated — not session data',
  };
}

/** Cumulative time delta between two simulated laps, aligned on distance. */
export function simulatedDelta(a: TelemetryPoint[], b: TelemetryPoint[]) {
  const out: { Distance: number; delta: number }[] = [];
  let ta = 0;
  let tb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const step = i === 0 ? 0 : a[i].Distance - a[i - 1].Distance;
    ta += step / Math.max((a[i].Speed ?? 1) / 3.6, 1);
    tb += step / Math.max((b[i].Speed ?? 1) / 3.6, 1);
    out.push({ Distance: a[i].Distance, delta: Math.round((ta - tb) * 1000) / 1000 });
  }
  return out;
}
