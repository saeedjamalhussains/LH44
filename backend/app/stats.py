"""Career aggregation.

Career totals are *derived by summation over the season table* rather than
stored separately, so the two can never disagree. Derived rates are labelled
as calculated so the UI can badge them correctly.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from . import seed

SUMMED = ("starts", "wins", "poles", "podiums", "points", "fastestLaps", "dnfs")


def _stat(value: Any, label: str, source: str, updated: str, calculated: bool = False) -> Dict[str, Any]:
    """The single shape every displayed statistic uses (spec §53)."""
    return {
        "value": value,
        "label": label,
        "source": source,
        "updatedAt": updated,
        "calculated": calculated,
    }


def get_driver_career_stats() -> Dict[str, Any]:
    rows = seed.seasons()
    m = seed.meta()
    updated = m.get("updatedAt", "")
    src = m.get("sources", {}).get("career", {}).get("label", "Formula1.com")
    calc = m.get("sources", {}).get("derived", {}).get("label", "Calculated")

    if not rows:
        return {"error": "no season data available", "stats": []}

    totals = {k: round(sum(r.get(k, 0) for r in rows), 1) for k in SUMMED}
    titles = sum(1 for r in rows if r.get("champion"))
    starts = totals["starts"] or 1

    def pct(n: float) -> float:
        return round(100 * n / starts, 1)

    return {
        "driver": m.get("driver", {}),
        "updatedAt": updated,
        "headline": [
            _stat(titles, "World Titles", src, updated),
            _stat(int(totals["wins"]), "Grand Prix Wins", src, updated),
            _stat(int(totals["poles"]), "Pole Positions", src, updated),
            _stat(int(totals["podiums"]), "Podiums", src, updated),
        ],
        "totals": [
            _stat(int(totals["starts"]), "Grand Prix Entries", src, updated),
            _stat(totals["points"], "Career Points", src, updated),
            _stat(int(totals["fastestLaps"]), "Fastest Laps", calc, updated, True),
            _stat(int(totals["dnfs"]), "Retirements", calc, updated, True),
            _stat(len(rows), "Seasons", src, updated),
        ],
        "derived": [
            _stat(pct(totals["wins"]), "Win %", calc, updated, True),
            _stat(pct(totals["podiums"]), "Podium %", calc, updated, True),
            _stat(pct(totals["poles"]), "Pole %", calc, updated, True),
            # True pole conversion needs per-race grid/result pairs, which live in
            # the results API rather than the season table. This ratio is the
            # honest thing the season table alone can support.
            _stat(
                round(totals["wins"] / (totals["poles"] or 1), 2),
                "Wins per Pole", calc, updated, True,
            ),
            _stat(round(totals["points"] / starts, 2), "Points Per Entry", calc, updated, True),
            _stat(
                round(sum(r.get("avgGrid", 0) * r.get("starts", 0) for r in rows) / starts, 2),
                "Average Grid", calc, updated, True,
            ),
            _stat(
                round(sum(r.get("avgFinish", 0) * r.get("starts", 0) for r in rows) / starts, 2),
                "Average Finish", calc, updated, True,
            ),
        ],
    }


def get_driver_season_stats(year: int) -> Optional[Dict[str, Any]]:
    for row in seed.seasons():
        if int(row.get("year", 0)) == int(year):
            prev = get_previous(year)
            return {"season": row, "previous": prev, "delta": _delta(row, prev)}
    return None


def get_previous(year: int) -> Optional[Dict[str, Any]]:
    rows = [r for r in seed.seasons() if int(r["year"]) < int(year)]
    return rows[-1] if rows else None


def _delta(cur: Dict[str, Any], prev: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not prev:
        return {}
    keys = ("points", "wins", "poles", "podiums", "position")
    return {k: round(cur.get(k, 0) - prev.get(k, 0), 1) for k in keys}


def get_championship_history() -> List[Dict[str, Any]]:
    champs = {c["year"]: c for c in seed.championships()}
    out = []
    for row in seed.seasons():
        if row.get("champion"):
            out.append({**row, **champs.get(row["year"], {})})
    return out


def get_circuit_stats(circuit_id: Optional[str] = None):
    rows = seed.circuits()
    for r in rows:
        starts = r.get("starts") or 1
        r["winRate"] = round(100 * r.get("wins", 0) / starts, 1)
    if circuit_id:
        return next((r for r in rows if r["id"] == circuit_id), None)
    return rows
