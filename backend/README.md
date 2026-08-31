# LH44 data service

FastAPI over FastF1 (session telemetry), the Jolpica F1 API (results and
standings) and a local seed snapshot (career and season aggregates).

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8044
```

The service runs without FastF1 installed and without network access: career,
season, championship and circuit endpoints are served from `../data`, and
telemetry endpoints return `{"available": false, "reason": ...}` which the
frontend renders as its TELEMETRY UNAVAILABLE state.

Career totals are summed from the season table rather than stored, so they can
never disagree with it. Derived rates are flagged `calculated: true`.

Cache: filesystem JSON under `cache/`, keyed `{season}_{grand_prix}_{session}_{driver}`.
Finished seasons cache for 30 days, the running season for 6 hours. If an
upstream call fails, a stale entry is served in preference to an error.
