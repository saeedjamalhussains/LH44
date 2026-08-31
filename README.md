# LEWIS HAMILTON — THE LEGACY OF 44

An interactive editorial and data project documenting Lewis Hamilton's Formula 1
career. Two tiers: a Next.js front end and a Python data service over FastF1 and
the Jolpica F1 results API.

*Independent project. Not affiliated with Formula 1, the FIA, Mercedes, McLaren,
Ferrari or Lewis Hamilton.*

---

## Run it

```bash
cd frontend && npm install && npm run dev
```

That is enough — the site renders fully from the seed snapshot in `data/`,
showing its documented unavailable states wherever live data would go.

For live results and telemetry, run the data service alongside it:

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8044
```

The front end reads `LH44_API_URL` (default `http://localhost:8044`) at request
time, so the backend can be repointed without a rebuild.

| | |
|---|---|
| Site | http://localhost:3044 |
| API | http://localhost:8044/api/health |
| API docs | http://localhost:8044/docs |

---

## Architecture

```
FastF1 ─┐
        ├─► Python processing ─► normalise ─► cache ─► FastAPI ─► Next.js ─► charts
Jolpica ┘                                                  ▲
                                                    seed snapshot (data/)
```

- **`scripts/`** — data generators (circuit stats, circuit outlines, preview).
- **`data/`** — the seed snapshot. One source of truth, copied into the frontend
  bundle by `prepare-data.mjs` on `predev`/`prebuild` and read directly by the
  backend. Editing a season here updates both tiers.
- **`backend/`** — FastAPI. `f1data.py` wraps FastF1, `results.py` wraps Jolpica,
  `stats.py` aggregates, `cache.py` is a filesystem JSON cache keyed
  `{season}_{grand_prix}_{session}_{driver}`.
- **`frontend/`** — Next.js App Router, TypeScript, Tailwind, Framer Motion.
  Charts are hand-built SVG rather than a charting library, so they match the
  engineering-documentation visual language and add no bundle weight.

### Regenerating the data

```bash
python3 scripts/build_circuits.py   # per-circuit stats from the results API
python3 scripts/build_shapes.py     # circuit outlines from Commons vectors
python3 scripts/preview_shapes.py   # visual check sheet for the outlines
python3 scripts/build_worldmap.py   # coastline from Natural Earth
```

`build_circuits.py` needs the backend running; the others reach Commons
directly. Both are safe to re-run — they overwrite their own output only.

### Two rules the codebase holds to

**Career totals are derived, never stored.** The headline figures — 7 titles,
106 wins, 104 poles, 207 podiums, 392 entries, 5201.5 points — are summed from
the 20-row season table at render time, in `lib/data.ts` and again in
`stats.py`. Add a season and every total on the site moves. The headline and the
detail cannot disagree. Both were cross-checked against the live results API,
which returns the same 392 / 106 / 207.

**Nothing is invented to fill a gap.** Where data is unavailable the interface
says so — `TELEMETRY UNAVAILABLE`, `POINTS PROGRESSION UNAVAILABLE`, a partial
archive notice — rather than substituting a plausible-looking number. The Data
Lab offers a deterministic simulated trace so the interaction can still be
explored; it is watermarked *SIMULATED — NOT SESSION DATA* and flagged
`synthetic: true` in the payload. Editorial reconstructions carry a
`Reconstruction` badge. Calculated metrics carry `CALC`. `/sources` documents
all of it, including which seed fields are least certain.

---

## Routes

`/` · `/numbers` · `/timeline` · `/championships` · `/championships/[year]` ·
`/data-lab` · `/iconic-laps` · `/rivalries` · `/races` · `/races/[year]/[gp]` ·
`/circuits` · `/machines` · `/ferrari` · `/beyond-f1` · `/sources`

## API

```
GET /api/health
GET /api/driver/hamilton              /career  /seasons  /season/{year}
GET /api/driver/hamilton/races        /races/{year}
GET /api/race/{year}/{grand_prix}
GET /api/session/{year}/{grand_prix}/{session}
GET /api/telemetry/{year}/{grand_prix}/{session}/{driver}[/{lap}]
GET /api/compare/{year}/{grand_prix}/{session}/{driver1}/{driver2}
GET /api/circuits  /api/circuit/{circuit}
GET /api/championships
GET /api/current-season
```

Telemetry endpoints never throw: they return
`{"available": false, "reason": "..."}` for the UI to render.

---

## Notes and limits

- **Photography is freely licensed only.** The 32 photographs in
  `frontend/public/images/` (12 editorial, 20 circuits) come from Wikimedia
  Commons under CC BY / CC BY-SA / CC0, fetched with their licence verified
  programmatically against an allowlist. `data/images.json` records author,
  licence and source URL for each; a credit tag sits beneath every image and the
  full list is on `/sources`. No press or agency imagery is used. `ImagePlate`
  falls back to a designed placeholder for any slot with no licensed file.

- **The world map is real geography.** `scripts/build_worldmap.py` decodes
  Natural Earth 1:110m land (public domain) and projects it with the same
  equirectangular transform the circuit markers use, so a circuit's coordinates
  land exactly on the right coastline.

- **Rights are stated, not assumed.** Copyright in every photograph stays with
  its author; the free licence grants use, and the author and licence are named
  beneath each image with a `RightsNote` on image-heavy pages covering liveries,
  team names and trademarks.

- **Circuit outlines are traced, not drawn.** `scripts/build_shapes.py` pulls 30
  circuit layouts from freely licensed vector maps on Commons, extracts the
  track path, converts relative polybezier commands to absolute coordinates and
  scales them into a common box — the geometry is unchanged. Every outline was
  checked visually via `scripts/preview_shapes.py`, which renders them all with
  markers at 0/25/50/75% of path length to confirm each path runs the lap once.
  `CircuitSilhouette` positions the 44 marker with `getPointAtLength()` on that
  real path, so lap playback follows the circuit's true shape.

- **Nothing about the track is fabricated.** When a session has real X/Y
  telemetry, that *is* the circuit and it is drawn directly. Otherwise the
  traced outline is used, and it is labelled as the outline rather than as
  position channels.

### The lap simulation

`frontend/lib/simulate.ts` is a quasi-steady-state lap simulation run over the
circuit's real traced geometry — not a random speed curve. It flattens the
outline to a polyline, scales it so its length equals the circuit's true length,
takes the corner radius at every point from local curvature, caps corner speed
by the lateral grip available at that speed, then runs forward (power/traction
limited) and backward (braking limited) passes around the closed loop. Throttle,
brake, gear and RPM are derived from the longitudinal acceleration the car is
actually being asked for.

It is validated, not assumed:

```bash
node --experimental-strip-types scripts/check-simulation.ts      # per-circuit error
node --experimental-strip-types scripts/calibrate-simulation.ts  # refit the constants
```

Against 26 real lap times the mean absolute error is **4.6%** (median 3.9%,
worst 15.8%) — Silverstone simulates 1:28.6 against a real ~1:27. The fit is
scored on lap time *and* slowest-corner speed together, because a higher
curvature floor buys better lap times while making every hairpin 116 km/h.

It remains a model, and is always watermarked *SIMULATED*: no tyre model, no
fuel load, no elevation, no wind, and sector splits taken at thirds of lap
distance rather than at real timing lines.
- **Telemetry coverage** begins around 2018 for full channels. Earlier sessions
  return the unavailable state.
- **Race-archive points** sum Grand Prix classifications only; the results API
  records sprint results separately, so that figure sits below the career total.
- **Hamilton is an active driver.** No page describes the career as finished.
