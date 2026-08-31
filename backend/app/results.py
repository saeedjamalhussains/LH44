"""Jolpica F1 (Ergast-compatible) results client.

Supplies the full race archive and live current-season standings. Every call is
cached and every failure degrades to the seed snapshot rather than an error page.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from . import cache, seed
from .config import CURRENT_SEASON, DRIVER_ID, JOLPICA_BASE

log = logging.getLogger("lh44.results")
TIMEOUT = httpx.Timeout(15.0)


def _get(path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{JOLPICA_BASE}/{path.lstrip('/')}.json"
    with httpx.Client(timeout=TIMEOUT, follow_redirects=True) as client:
        r = client.get(url, params=params or {"limit": 100})
        r.raise_for_status()
        return r.json()["MRData"]


def _race_row(race: Dict[str, Any]) -> Dict[str, Any]:
    res = (race.get("Results") or [{}])[0]
    fl = res.get("FastestLap") or {}
    return {
        "id": f"{race['season']}-{race['Circuit']['circuitId']}",
        "year": int(race["season"]),
        "round": int(race["round"]),
        "gp": race["raceName"],
        "circuit": race["Circuit"]["circuitId"],
        "circuitName": race["Circuit"]["circuitName"],
        "country": race["Circuit"]["Location"]["country"],
        "date": race.get("date"),
        "team": (res.get("Constructor") or {}).get("name"),
        "grid": int(res["grid"]) if res.get("grid") else None,
        "finish": int(res["position"]) if res.get("position") else None,
        "status": res.get("status"),
        "points": float(res["points"]) if res.get("points") else 0.0,
        "laps": int(res["laps"]) if res.get("laps") else None,
        "fastestLap": fl.get("rank") == "1",
        "fastestLapTime": (fl.get("Time") or {}).get("time"),
        "source": "Jolpica F1 API",
    }


def get_driver_race_results(year: Optional[int] = None) -> Dict[str, Any]:
    key = cache.make_key("races", DRIVER_ID, year or "all")

    def produce() -> Dict[str, Any]:
        rows: List[Dict[str, Any]] = []
        base = f"{year}/drivers/{DRIVER_ID}/results" if year else f"drivers/{DRIVER_ID}/results"
        offset, total = 0, 1
        while offset < total and offset < 500:
            data = _get(base, {"limit": 100, "offset": offset})
            total = int(data["total"])
            rows.extend(_race_row(r) for r in data["RaceTable"]["Races"])
            offset += 100
        return {"available": True, "count": len(rows), "races": rows, "source": "Jolpica F1 API"}

    try:
        return cache.cached(key, cache.ttl_for(year), produce)
    except Exception as exc:  # noqa: BLE001
        log.error("race archive unavailable: %s", exc)
        featured = seed.featured_races()
        if year:
            featured = [r for r in featured if r["year"] == year]
        return {
            "available": False,
            "degraded": True,
            "reason": "The results API is unreachable. Showing the featured races from the local snapshot.",
            "count": len(featured),
            "races": featured,
            "source": "Local seed snapshot",
        }


def get_current_season() -> Dict[str, Any]:
    key = cache.make_key("standings", CURRENT_SEASON)

    def produce() -> Dict[str, Any]:
        data = _get(f"{CURRENT_SEASON}/drivers/{DRIVER_ID}/driverStandings")
        lists = data["StandingsTable"]["StandingsLists"]
        if not lists:
            raise ValueError("no standings published yet")
        s = lists[0]["DriverStandings"][0]
        return {
            "available": True,
            "year": CURRENT_SEASON,
            "position": int(s["position"]),
            "points": float(s["points"]),
            "wins": int(s["wins"]),
            "team": s["Constructors"][-1]["name"],
            "round": int(lists[0]["round"]),
            "source": "Jolpica F1 API",
        }

    try:
        return cache.cached(key, cache.ttl_for(CURRENT_SEASON), produce)
    except Exception as exc:  # noqa: BLE001
        log.warning("live standings unavailable, using seed: %s", exc)
        row = next((r for r in seed.seasons() if r["year"] == CURRENT_SEASON), None)
        if not row:
            return {"available": False, "reason": "No data for the current season."}
        return {
            "available": True, "degraded": True, "year": CURRENT_SEASON,
            "position": row["position"], "points": row["points"], "wins": row["wins"],
            "team": row["team"], "round": row["starts"],
            "source": f"{seed.meta().get('sources', {}).get('career', {}).get('label', 'Formula1.com')} (snapshot)",
        }
