'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChartFrame, LineChart, StintBar, type Series } from './charts';
import CircuitMap from './CircuitMap';
import CircuitSilhouette from './CircuitSilhouette';
import ImageCredit from './ImageCredit';
import { ErrorState, LoadingState, SourceBadge } from './ui';
import { getComparison, getHealth, getTelemetry } from '@/lib/api';
import { simulatedDelta, simulatedResponse } from '@/lib/simulate';
import { shapeForGrandPrix } from '@/lib/shapes';
import { TYRE_COLORS, delta as fmtDelta, lapTime } from '@/lib/format';
import type { TelemetryPoint, TelemetryResponse } from '@/lib/types';

const SESSIONS = ['FP1', 'FP2', 'FP3', 'Sprint', 'Qualifying', 'Race'] as const;

const GRANDS_PRIX = [
  'Bahrain', 'Saudi Arabia', 'Australia', 'Japan', 'China', 'Miami', 'Emilia Romagna',
  'Monaco', 'Canada', 'Spain', 'Austria', 'Great Britain', 'Hungary', 'Belgium',
  'Netherlands', 'Italy', 'Azerbaijan', 'Singapore', 'United States', 'Mexico',
  'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi', 'Turkey', 'Portugal', 'France', 'Germany',
];

const DRIVERS = [
  { code: 'HAM', name: 'Lewis Hamilton' }, { code: 'VER', name: 'Max Verstappen' },
  { code: 'LEC', name: 'Charles Leclerc' }, { code: 'RUS', name: 'George Russell' },
  { code: 'NOR', name: 'Lando Norris' }, { code: 'ALO', name: 'Fernando Alonso' },
  { code: 'BOT', name: 'Valtteri Bottas' }, { code: 'PER', name: 'Sergio Pérez' },
  { code: 'ROS', name: 'Nico Rosberg' }, { code: 'VET', name: 'Sebastian Vettel' },
  { code: 'RIC', name: 'Daniel Ricciardo' }, { code: 'SAI', name: 'Carlos Sainz' },
  { code: 'PIA', name: 'Oscar Piastri' },
];

const HAM_COLOR = '#F4F4F4';
const RIVAL_COLOR = '#D40000';

const YEARS = Array.from({ length: 2026 - 2018 + 1 }, (_, i) => 2026 - i);

function Select({
  id, label, value, options, onChange, disabled,
}: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="label block">{label}</label>
      <select
        id={id} value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full truncate border border-line bg-panel px-3 py-2.5 font-mono text-xs
          text-ink focus:border-gold focus:outline-none disabled:opacity-40"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Readout({ label, value, unit, accent = 'text-ink' }: {
  label: string; value: string; unit?: string; accent?: string;
}) {
  return (
    <div className="border-l border-line pl-3">
      <p className="label">{label}</p>
      <p className={`mt-1 font-mono text-lg tabular ${accent}`}>
        {value}<span className="ml-1 text-[10px] text-muted">{unit}</span>
      </p>
    </div>
  );
}

export default function DataLab({
  initial,
}: {
  initial?: { year: number; gp: string; session: string; driver: string; compare: string };
}) {
  const [year, setYear] = useState(initial?.year ?? 2021);
  const [gp, setGp] = useState(initial?.gp ?? 'Brazil');
  const [session, setSession] = useState(initial?.session ?? 'Qualifying');
  const [driver, setDriver] = useState(initial?.driver ?? 'HAM');
  const [compare, setCompare] = useState(initial?.compare ?? 'VER');

  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'unavailable'>('idle');
  const [reason, setReason] = useState('');
  const [primary, setPrimary] = useState<TelemetryResponse | null>(null);
  const [secondary, setSecondary] = useState<TelemetryResponse | null>(null);
  const [deltaTrace, setDeltaTrace] = useState<{ Distance: number; delta: number }[]>([]);
  const [synthetic, setSynthetic] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => { getHealth().then((h) => setLive(h.ok)); }, []);

  const sessionKey = `${year}_${gp}_${session}`;

  const load = useCallback(async (useSimulated: boolean) => {
    setStatus('loading');
    setCursor(null);
    setPlaying(false);

    if (useSimulated) {
      // Pass the circuit's traced outline so the lap is simulated over its real
      // geometry rather than an invented corner sequence.
      const shape = shapeForGrandPrix(gp);
      const a = simulatedResponse(sessionKey, driver, shape);
      const b = compare && compare !== driver ? simulatedResponse(sessionKey, compare, shape) : null;
      setPrimary(a); setSecondary(b);
      setDeltaTrace(b ? simulatedDelta(a.trace!, b.trace!) : []);
      setSynthetic(true); setStatus('ok');
      return;
    }

    setSynthetic(false);
    if (compare && compare !== driver) {
      const cmp = await getComparison(year, gp, session.toLowerCase(), driver, compare);
      if (cmp.available && cmp.traces) {
        setPrimary({ available: true, driver, trace: cmp.traces[driver] as TelemetryPoint[],
          lap: cmp.laps?.[driver] as TelemetryResponse['lap'], source: 'FastF1 session data' });
        setSecondary({ available: true, driver: compare, trace: cmp.traces[compare] as TelemetryPoint[],
          lap: cmp.laps?.[compare] as TelemetryResponse['lap'], source: 'FastF1 session data' });
        setDeltaTrace(cmp.delta ?? []);
        setStatus('ok');
        return;
      }
      setReason(cmp.reason ?? 'Telemetry is unavailable for this session.');
      setStatus('unavailable');
      return;
    }

    const one = await getTelemetry(year, gp, session.toLowerCase(), driver);
    if (one.available) {
      setPrimary(one); setSecondary(null); setDeltaTrace([]); setStatus('ok');
    } else {
      setReason(one.reason ?? 'Telemetry is unavailable for this session.');
      setStatus('unavailable');
    }
  }, [year, gp, session, driver, compare, sessionKey]);

  useEffect(() => { load(false); }, [load]);

  const trace = primary?.trace ?? [];
  const trace2 = secondary?.trace ?? [];

  // Lap playback moves the shared cursor through the trace.
  useEffect(() => {
    if (!playing || !trace.length) return;
    let i = cursor ?? 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 24) {
        i = i + 1;
        last = now;
        if (i >= trace.length) { setPlaying(false); setCursor(trace.length - 1); return; }
        setCursor(i);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, trace.length]);

  const channel = useCallback((key: keyof TelemetryPoint, from: TelemetryPoint[]): Series['points'] =>
    from.filter((p) => p[key] != null).map((p) => ({ x: p.Distance, y: Number(p[key]) })), []);

  const series = useMemo(() => {
    const build = (key: keyof TelemetryPoint): Series[] => {
      const out: Series[] = [{ id: 'a', color: HAM_COLOR, points: channel(key, trace) }];
      if (trace2.length) out.push({ id: 'b', color: RIVAL_COLOR, points: channel(key, trace2), dashed: true });
      return out;
    };
    return {
      speed: build('Speed'), throttle: build('Throttle'), brake: build('Brake'),
      gear: build('nGear'), rpm: build('RPM'),
    };
  }, [trace, trace2, channel]);

  // Real session telemetry carries X/Y position, which *is* the circuit. When
  // that is absent (a simulated lap, or a session without position channels)
  // the traced outline for the Grand Prix is used instead, and the marker is
  // driven by the fraction of lap distance covered.
  // A simulated lap carries X/Y too, but those points come from the traced
  // outline rather than from timing data — so it is shown as the outline, with
  // the trace's own credit, and never labelled as position channels.
  const hasPositionChannels = !synthetic && trace.some((p) => p.X != null && p.Y != null);
  const outline = shapeForGrandPrix(gp);
  const lapProgress = cursor != null && trace.length > 1
    ? trace[Math.min(cursor, trace.length - 1)].Distance /
      (trace[trace.length - 1].Distance || 1)
    : null;

  const at = cursor != null ? trace[Math.min(cursor, trace.length - 1)] : null;
  const deltaAt = cursor != null && deltaTrace.length
    ? deltaTrace[Math.min(cursor, deltaTrace.length - 1)]?.delta : null;

  const lap = primary?.lap;
  const lap2 = secondary?.lap;

  return (
    <div>
      {/* CONTROL PANEL */}
      <section aria-label="Session controls" className="panel p-5 md:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <Select id="dl-year" label="Season" value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
          <Select id="dl-gp" label="Grand Prix" value={gp} onChange={setGp}
            options={GRANDS_PRIX.map((g) => ({ value: g, label: g }))} />
          <Select id="dl-session" label="Session" value={session} onChange={setSession}
            options={SESSIONS.map((s) => ({ value: s, label: s }))} />
          <Select id="dl-driver" label="Driver" value={driver} onChange={setDriver}
            options={DRIVERS.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }))} />
          <Select id="dl-compare" label="Compare with" value={compare} onChange={setCompare}
            options={[{ value: '', label: 'None' },
              ...DRIVERS.filter((d) => d.code !== driver).map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }))]} />
          <div className="flex gap-2">
            <button type="button" onClick={() => load(synthetic)}
              className="btn btn-ghost !px-4 !py-2.5">Reload</button>
            <button type="button" disabled={status !== 'ok' || !trace.length}
              onClick={() => { if (cursor === trace.length - 1) setCursor(0); setPlaying((p) => !p); }}
              className="btn btn-primary !px-4 !py-2.5 disabled:opacity-30">
              {playing ? 'Pause' : 'Play lap'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Service:{' '}
            <span className={live ? 'text-gold' : 'text-silver'}>
              {live === null ? 'checking…' : live ? 'connected' : 'offline'}
            </span>
          </span>
          {synthetic && (
            <span className="border border-ferrari/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ferrari-bright">
              Simulated trace — not session data
            </span>
          )}
          <span className="font-mono text-[10px] text-muted">Cache key: {sessionKey.toLowerCase()}_{driver.toLowerCase()}</span>
        </div>
      </section>

      {status === 'loading' && <LoadingState label="LOADING SESSION DATA" />}

      {status === 'unavailable' && (
        <div className="mt-6">
          <ErrorState
            title="TELEMETRY UNAVAILABLE"
            message={reason || 'Detailed telemetry is not available for this session.'}
            action={
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => load(true)} className="btn btn-ghost">
                  Load simulated trace
                </button>
                <button type="button" onClick={() => load(false)} className="btn btn-ghost">
                  Retry live session
                </button>
              </div>
            }
          />
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
            The simulated trace is generated locally so the Data Lab&apos;s interaction model can be
            explored without the backend. It is deterministic, clearly watermarked, and is not
            Formula 1 session data.
          </p>
        </div>
      )}

      {status === 'ok' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* LIVE READOUT */}
          <section aria-live="polite" aria-label="Telemetry readout"
            className="mt-6 grid grid-cols-2 gap-4 border border-line bg-panel p-5 sm:grid-cols-4 lg:grid-cols-7">
            <Readout label="Distance" value={at ? String(Math.round(at.Distance)) : '—'} unit="m" />
            <Readout label="Speed" value={at?.Speed != null ? String(Math.round(at.Speed)) : '—'} unit="km/h" />
            <Readout label="Throttle" value={at?.Throttle != null ? String(Math.round(at.Throttle)) : '—'} unit="%" />
            <Readout label="Brake" value={at?.Brake != null ? String(Math.round(at.Brake)) : '—'} unit="%"
              accent={at?.Brake ? 'text-ferrari-bright' : 'text-ink'} />
            <Readout label="Gear" value={at?.nGear != null ? String(at.nGear) : '—'} />
            <Readout label="RPM" value={at?.RPM != null ? String(Math.round(at.RPM)) : '—'} />
            <Readout label="Delta" value={deltaAt != null ? fmtDelta(deltaAt) : '—'} unit="s"
              accent={deltaAt == null ? 'text-ink' : deltaAt < 0 ? 'text-gold' : 'text-ferrari-bright'} />
          </section>

          {/* LAP TIME + SECTORS */}
          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="panel p-6">
              <p className="label">{synthetic ? 'Simulated lap' : 'Fastest lap'} · {driver}</p>
              <p className="display mt-2 text-6xl md:text-7xl">{lapTime(lap?.lapTime)}</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-4">
                {[['Sector 1', lap?.sector1], ['Sector 2', lap?.sector2], ['Sector 3', lap?.sector3]].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="label">{k}</dt>
                    <dd className="mt-1 font-mono text-lg text-tech tabular">
                      {v != null ? (v as number).toFixed(3) : '—'}
                    </dd>
                  </div>
                ))}
              </dl>
              {lap?.compound && (
                <div className="mt-6 border-t border-line pt-4">
                  <p className="label">Tyre</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full"
                      style={{ background: TYRE_COLORS[lap.compound] ?? TYRE_COLORS.Unknown }} />
                    <span className="font-mono text-sm text-tech">{lap.compound}</span>
                  </div>
                </div>
              )}
            </div>

            {secondary ? (
              <div className="panel p-6">
                <p className="label">Comparison · {compare}</p>
                <p className="display mt-2 text-6xl text-ferrari-bright md:text-7xl">{lapTime(lap2?.lapTime)}</p>
                <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-4">
                  {[['Sector 1', lap?.sector1, lap2?.sector1], ['Sector 2', lap?.sector2, lap2?.sector2],
                    ['Sector 3', lap?.sector3, lap2?.sector3]].map(([k, a, b]) => {
                    const d = a != null && b != null ? (a as number) - (b as number) : null;
                    return (
                      <div key={k as string}>
                        <dt className="label">{k as string}</dt>
                        <dd className={`mt-1 font-mono text-lg tabular ${
                          d == null ? 'text-tech' : d < 0 ? 'text-gold' : 'text-ferrari-bright'}`}>
                          {d != null ? fmtDelta(d) : '—'}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-6 border-t border-line pt-4 font-mono text-xs text-muted">
                  Negative values: {driver} ahead. Positive: {compare} ahead.
                </p>
              </div>
            ) : (
              <div className="panel flex items-center justify-center p-6">
                <p className="max-w-xs text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-muted">
                  Select a driver in &ldquo;compare with&rdquo; to add a second trace and a lap delta
                </p>
              </div>
            )}
          </section>

          {/* CHARTS */}
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-4">
              <ChartFrame title="Speed" unit="km/h" height={190}
                value={at?.Speed != null ? `${Math.round(at.Speed)} km/h` : undefined}
                yMax={Math.round(Math.max(...trace.map((p) => p.Speed ?? 0)))} yMin={0}>
                <LineChart ariaLabel="Speed against track distance" series={series.speed}
                  cursorIndex={cursor} onCursor={setCursor} forceZero />
              </ChartFrame>

              {deltaTrace.length > 0 && (
                <ChartFrame title={`Lap delta · ${driver} vs ${compare}`} unit="seconds" height={140}
                  value={deltaAt != null ? `${fmtDelta(deltaAt)}s` : undefined}>
                  <LineChart ariaLabel={`Cumulative lap time delta between ${driver} and ${compare}`}
                    series={[{ id: 'delta', color: '#C9A227',
                      points: deltaTrace.map((d) => ({ x: d.Distance, y: d.delta })), fill: true }]}
                    cursorIndex={cursor} onCursor={setCursor} zeroLine />
                </ChartFrame>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <ChartFrame title="Throttle" unit="%" height={120}
                  value={at?.Throttle != null ? `${Math.round(at.Throttle)}%` : undefined} yMax={100} yMin={0}>
                  <LineChart ariaLabel="Throttle application against distance" series={series.throttle}
                    cursorIndex={cursor} onCursor={setCursor} forceZero />
                </ChartFrame>
                <ChartFrame title="Brake" unit="%" height={120}
                  value={at?.Brake != null ? `${Math.round(at.Brake)}%` : undefined} yMax={100} yMin={0}>
                  <LineChart ariaLabel="Brake application against distance" series={series.brake}
                    cursorIndex={cursor} onCursor={setCursor} forceZero />
                </ChartFrame>
                <ChartFrame title="Gear" height={120}
                  value={at?.nGear != null ? `n${at.nGear}` : undefined} yMax={8} yMin={0}>
                  <LineChart ariaLabel="Gear selection against distance" series={series.gear}
                    cursorIndex={cursor} onCursor={setCursor} forceZero />
                </ChartFrame>
                <ChartFrame title="RPM" height={120}
                  value={at?.RPM != null ? String(Math.round(at.RPM)) : undefined}
                  yMax={Math.round(Math.max(...trace.map((p) => p.RPM ?? 0)))} yMin={0}>
                  <LineChart ariaLabel="Engine RPM against distance" series={series.rpm}
                    cursorIndex={cursor} onCursor={setCursor} forceZero />
                </ChartFrame>
              </div>
            </div>

            <div className="space-y-4">
              <figure className="panel p-4">
                <figcaption className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="label">Track position</span>
                  <span className="font-mono text-[10px] text-muted">
                    {lapProgress != null
                      ? `${Math.round(lapProgress * 100)}% of lap` : 'Hover a chart'}
                  </span>
                </figcaption>
                <div className="h-[280px]">
                  {hasPositionChannels ? (
                    <CircuitMap trace={trace} cursorIndex={cursor}
                      label={`${gp} circuit traced from the lap's own position channels, with the 44 marker at the cursor`} />
                  ) : outline ? (
                    <CircuitSilhouette shape={outline} progress={lapProgress} accent="#F4F4F4" />
                  ) : (
                    <div className="flex h-full items-center justify-center border border-line px-6">
                      <p className="text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted">
                        No position channels in this session, and no traced outline for {gp}
                      </p>
                    </div>
                  )}
                </div>
                {hasPositionChannels ? (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    Drawn from this lap&apos;s X/Y position channels
                  </p>
                ) : outline ? (
                  <ImageCredit image={{ ...outline, src: '', width: 0, height: 0, caption: outline.name, alt: outline.name }} />
                ) : null}
              </figure>

              <figure className="panel p-4">
                <figcaption className="mb-3"><span className="label">Tyre strategy</span></figcaption>
                {lap?.compound ? (
                  <StintBar
                    stints={[{ compound: lap.compound, from: 1, to: 1 }]}
                    totalLaps={1} colors={TYRE_COLORS}
                  />
                ) : (
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    Compound data unavailable for this lap
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3">
                  {Object.entries(TYRE_COLORS).filter(([k]) => k !== 'Unknown').map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: v }} />{k}
                    </span>
                  ))}
                </div>
              </figure>

              <div className="panel p-4">
                <p className="label">Reading this</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Move the cursor across any chart and every other chart, the readout row and the
                  44 marker follow it. Negative delta means {driver} is ahead at that point on track.
                </p>
              </div>
            </div>
          </section>

          <SourceBadge className="mt-6"
            source={synthetic ? 'Simulated locally — not session data' : (primary?.source ?? 'FastF1 session data')}
            calculated={Boolean(deltaTrace.length)} />
        </motion.div>
      )}
    </div>
  );
}
