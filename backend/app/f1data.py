"""FastF1 access layer.

Every public function returns plain JSON-serialisable structures and never
raises to the caller — failures come back as ``{"available": False, "reason": ...}``
so the frontend can render its TELEMETRY UNAVAILABLE state instead of breaking.

FastF1 is an optional import: without it installed the service still serves
career, season and championship data from the seed snapshot.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from . import cache
from .config import FASTF1_CACHE_DIR

log = logging.getLogger("lh44.f1data")

try:  # pragma: no cover - depends on deployment
    import fastf1
    import numpy as np
    import pandas as pd

    fastf1.Cache.enable_cache(str(FASTF1_CACHE_DIR))
    FASTF1_AVAILABLE = True
except Exception as exc:  # noqa: BLE001
    log.warning("FastF1 unavailable (%s); telemetry endpoints will report unavailable", exc)
    FASTF1_AVAILABLE = False

SESSION_CODES = {
    "fp1": "FP1", "fp2": "FP2", "fp3": "FP3",
    "sprint": "Sprint", "sprint-qualifying": "Sprint Qualifying",
    "qualifying": "Q", "quali": "Q", "race": "R",
}

UNAVAILABLE = {
    "available": False,
    "reason": "Detailed telemetry is not available for this session.",
}


def _unavailable(reason: str) -> Dict[str, Any]:
    return {**UNAVAILABLE, "reason": reason}


def _downsample(frame, columns: List[str], target: int = 600) -> List[Dict[str, Any]]:
    """Reduce a telemetry frame to a payload a browser can chart.

    Heavy processing stays server side (spec §38): the client never receives the
    raw multi-thousand-row frame.
    """
    if frame is None or len(frame) == 0:
        return []
    step = max(1, len(frame) // target)
    thin = frame.iloc[::step]
    out = []
    for _, row in thin.iterrows():
        point: Dict[str, Any] = {}
        for col in columns:
            if col not in thin.columns:
                continue
            val = row[col]
            if pd.isna(val):
                continue
            point[col] = round(float(val), 2) if isinstance(val, (int, float, np.floating)) else val
        if point:
            out.append(point)
    return out


def get_session(year: int, grand_prix: str, session: str):
    """Load and return a FastF1 session, or None."""
    if not FASTF1_AVAILABLE:
        return None
    code = SESSION_CODES.get(str(session).lower(), session)
    try:
        ses = fastf1.get_session(int(year), grand_prix, code)
        ses.load(telemetry=True, laps=True, weather=True)
        return ses
    except Exception as exc:  # noqa: BLE001 - upstream/network/data boundary
        log.error("session load failed %s %s %s: %s", year, grand_prix, session, exc)
        return None


def _lap_payload(lap) -> Dict[str, Any]:
    def td(value):
        try:
            return None if pd.isna(value) else round(value.total_seconds(), 3)
        except Exception:  # noqa: BLE001
            return None

    return {
        "lapNumber": int(lap["LapNumber"]) if not pd.isna(lap["LapNumber"]) else None,
        "lapTime": td(lap["LapTime"]),
        "sector1": td(lap["Sector1Time"]),
        "sector2": td(lap["Sector2Time"]),
        "sector3": td(lap["Sector3Time"]),
        "compound": None if pd.isna(lap.get("Compound")) else str(lap.get("Compound")).title(),
        "tyreLife": None if pd.isna(lap.get("TyreLife")) else int(lap.get("TyreLife")),
        "position": None if pd.isna(lap.get("Position")) else int(lap.get("Position")),
    }


def get_lap_telemetry(
    year: int, grand_prix: str, session: str, driver: str, lap: Optional[int] = None
) -> Dict[str, Any]:
    """Speed / throttle / brake / gear / RPM / track position for one lap."""
    key = cache.make_key(year, grand_prix, session, driver, lap or "fastest")
    def produce():
        if not FASTF1_AVAILABLE:
            return _unavailable("FastF1 is not installed on this deployment.")
        ses = get_session(year, grand_prix, session)
        if ses is None:
            return _unavailable("The session could not be loaded from the timing archive.")
        try:
            laps = ses.laps.pick_drivers(driver)
            if laps is None or len(laps) == 0:
                return _unavailable(f"No laps recorded for {driver} in this session.")
            target = laps.pick_fastest() if lap is None else laps[laps["LapNumber"] == int(lap)].iloc[0]
            tel = target.get_telemetry().add_distance()
            return {
                "available": True,
                "driver": driver,
                "year": int(year),
                "grandPrix": grand_prix,
                "session": session,
                "lap": _lap_payload(target),
                "isFastest": lap is None,
                "trace": _downsample(
                    tel, ["Distance", "Speed", "Throttle", "Brake", "nGear", "RPM", "X", "Y"]
                ),
                "source": "FastF1 session data",
            }
        except Exception as exc:  # noqa: BLE001
            log.error("telemetry extraction failed: %s", exc)
            return _unavailable("Telemetry channels are incomplete for this session.")

    return cache.cached(key, cache.ttl_for(year), produce)


def get_fastest_lap(year: int, grand_prix: str, session: str, driver: str) -> Dict[str, Any]:
    return get_lap_telemetry(year, grand_prix, session, driver, None)


def get_sector_times(year: int, grand_prix: str, session: str, driver: str) -> Dict[str, Any]:
    data = get_fastest_lap(year, grand_prix, session, driver)
    if not data.get("available"):
        return data
    lap = data["lap"]
    return {"available": True, "sectors": [lap["sector1"], lap["sector2"], lap["sector3"]],
            "lapTime": lap["lapTime"], "source": "FastF1 session data"}


def get_tyre_strategy(year: int, grand_prix: str, session: str, driver: str) -> Dict[str, Any]:
    key = cache.make_key(year, grand_prix, session, driver, "stints")
    def produce():
        ses = get_session(year, grand_prix, session)
        if ses is None:
            return _unavailable("Stint data is not available for this session.")
        try:
            laps = ses.laps.pick_drivers(driver)
            stints: List[Dict[str, Any]] = []
            for (_, compound), grp in laps.groupby(["Stint", "Compound"]):
                stints.append({
                    "compound": str(compound).title(),
                    "from": int(grp["LapNumber"].min()),
                    "to": int(grp["LapNumber"].max()),
                    "laps": int(len(grp)),
                })
            stints.sort(key=lambda s: s["from"])
            return {"available": True, "stints": stints, "source": "FastF1 session data"}
        except Exception as exc:  # noqa: BLE001
            log.error("stint extraction failed: %s", exc)
            return _unavailable("Stint data could not be read for this session.")
    return cache.cached(key, cache.ttl_for(year), produce)


def get_weather(year: int, grand_prix: str, session: str) -> Dict[str, Any]:
    key = cache.make_key(year, grand_prix, session, "weather")
    def produce():
        ses = get_session(year, grand_prix, session)
        if ses is None or getattr(ses, "weather_data", None) is None:
            return _unavailable("Weather data is not available for this session.")
        try:
            w = ses.weather_data
            return {
                "available": True,
                "airTemp": round(float(w["AirTemp"].mean()), 1),
                "trackTemp": round(float(w["TrackTemp"].mean()), 1),
                "humidity": round(float(w["Humidity"].mean()), 1),
                "rainfall": bool(w["Rainfall"].any()),
                "windSpeed": round(float(w["WindSpeed"].mean()), 1),
                "source": "FastF1 session data",
            }
        except Exception as exc:  # noqa: BLE001
            log.error("weather extraction failed: %s", exc)
            return _unavailable("Weather channels are incomplete for this session.")
    return cache.cached(key, cache.ttl_for(year), produce)


def get_position_data(year: int, grand_prix: str, driver: str) -> Dict[str, Any]:
    """Race position by lap."""
    key = cache.make_key(year, grand_prix, "race", driver, "positions")
    def produce():
        ses = get_session(year, grand_prix, "race")
        if ses is None:
            return _unavailable("Race position data is not available.")
        try:
            laps = ses.laps.pick_drivers(driver)
            pts = [
                {"lap": int(r["LapNumber"]), "position": int(r["Position"])}
                for _, r in laps.iterrows()
                if not pd.isna(r["Position"])
            ]
            return {"available": True, "positions": pts, "source": "FastF1 session data"}
        except Exception as exc:  # noqa: BLE001
            log.error("position extraction failed: %s", exc)
            return _unavailable("Position data could not be read.")
    return cache.cached(key, cache.ttl_for(year), produce)


def compare_drivers(
    year: int, grand_prix: str, session: str, driver1: str, driver2: str
) -> Dict[str, Any]:
    """Two fastest laps plus a distance-aligned delta trace."""
    key = cache.make_key(year, grand_prix, session, driver1, driver2, "compare")

    def produce():
        a = get_fastest_lap(year, grand_prix, session, driver1)
        b = get_fastest_lap(year, grand_prix, session, driver2)
        if not a.get("available") or not b.get("available"):
            return _unavailable("Telemetry is unavailable for at least one of the selected drivers.")

        ta, tb = a["lap"]["lapTime"], b["lap"]["lapTime"]
        delta: List[Dict[str, Any]] = []
        if ta and tb:
            # Approximate a time delta by integrating 1/speed along distance for
            # each driver and scaling each integral onto its measured lap time.
            def cumulative(trace):
                acc, out, prev_d = 0.0, [], None
                for p in trace:
                    d, spd = p.get("Distance"), p.get("Speed")
                    if d is None or not spd:
                        continue
                    if prev_d is not None:
                        acc += (d - prev_d) / max(spd / 3.6, 1e-6)
                    out.append((d, acc))
                    prev_d = d
                return out

            ca, cb = cumulative(a["trace"]), cumulative(b["trace"])
            if ca and cb and ca[-1][1] and cb[-1][1]:
                sa, sb = ta / ca[-1][1], tb / cb[-1][1]
                bi = 0
                for d, va in ca:
                    while bi + 1 < len(cb) and cb[bi + 1][0] <= d:
                        bi += 1
                    delta.append({"Distance": d, "delta": round(va * sa - cb[bi][1] * sb, 3)})

        return {
            "available": True,
            "drivers": [driver1, driver2],
            "laps": {driver1: a["lap"], driver2: b["lap"]},
            "traces": {driver1: a["trace"], driver2: b["trace"]},
            "delta": delta,
            "gap": round(ta - tb, 3) if ta and tb else None,
            "source": "Calculated from FastF1 session data",
        }

    return cache.cached(key, cache.ttl_for(year), produce)
