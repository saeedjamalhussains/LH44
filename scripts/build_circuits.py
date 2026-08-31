#!/usr/bin/env python3
"""Regenerate data/hamilton.circuits.json from real race results.

Results (starts, wins, podiums, grid slots, best finish, averages) are computed
from the complete Jolpica race archive rather than estimated. Circuit geography
(coordinates, length, turn count) is not in the results API and is carried from
the curated table in this file.

Note on "poles": the archive records *grid position*, so grid == 1 means the
driver started P1, which is not identical to taking pole in qualifying when a
penalty intervenes. The output therefore stores `p1Starts`, labelled as such in
the UI, and never claims it is a qualifying pole count.

Usage:  python3 scripts/build_circuits.py [--api http://localhost:8044]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "hamilton.circuits.json"

# Geography only — never results. Keyed by the results API's circuitId.
GEO = {
    "silverstone":   {"lat": 52.0786, "lng": -1.0169, "length": 5.891, "turns": 18},
    "hungaroring":   {"lat": 47.5789, "lng": 19.2486, "length": 4.381, "turns": 14},
    "shanghai":      {"lat": 31.3389, "lng": 121.2200, "length": 5.451, "turns": 16},
    "villeneuve":    {"lat": 45.5000, "lng": -73.5228, "length": 4.361, "turns": 14},
    "catalunya":     {"lat": 41.5700, "lng": 2.2611, "length": 4.657, "turns": 14},
    "spa":           {"lat": 50.4372, "lng": 5.9714, "length": 7.004, "turns": 19},
    "monza":         {"lat": 45.6156, "lng": 9.2811, "length": 5.793, "turns": 11},
    "americas":      {"lat": 30.1328, "lng": -97.6411, "length": 5.513, "turns": 20},
    "monaco":        {"lat": 43.7347, "lng": 7.4206, "length": 3.337, "turns": 19},
    "suzuka":        {"lat": 34.8431, "lng": 136.5411, "length": 5.807, "turns": 18},
    "interlagos":    {"lat": -23.7036, "lng": -46.6997, "length": 4.309, "turns": 15},
    "bahrain":       {"lat": 26.0325, "lng": 50.5106, "length": 5.412, "turns": 15},
    "yas_marina":    {"lat": 24.4672, "lng": 54.6031, "length": 5.281, "turns": 16},
    "albert_park":   {"lat": -37.8497, "lng": 144.9680, "length": 5.278, "turns": 14},
    "sochi":         {"lat": 43.4057, "lng": 39.9578, "length": 5.848, "turns": 18},
    "marina_bay":    {"lat": 1.2914, "lng": 103.8642, "length": 4.940, "turns": 19},
    "red_bull_ring": {"lat": 47.2197, "lng": 14.7647, "length": 4.318, "turns": 10},
    "hockenheimring": {"lat": 49.3278, "lng": 8.5658, "length": 4.574, "turns": 17},
    "istanbul":      {"lat": 40.9517, "lng": 29.4050, "length": 5.338, "turns": 14},
    "jeddah":        {"lat": 21.6319, "lng": 39.1044, "length": 6.174, "turns": 27},
    "miami":         {"lat": 25.9581, "lng": -80.2389, "length": 5.412, "turns": 19},
    "vegas":         {"lat": 36.1147, "lng": -115.1728, "length": 6.201, "turns": 17},
    "zandvoort":     {"lat": 52.3888, "lng": 4.5409, "length": 4.259, "turns": 14},
    "imola":         {"lat": 44.3439, "lng": 11.7167, "length": 4.909, "turns": 19},
    "baku":          {"lat": 40.3725, "lng": 49.8533, "length": 6.003, "turns": 20},
    "rodriguez":     {"lat": 19.4042, "lng": -99.0907, "length": 4.304, "turns": 17},
    "portimao":      {"lat": 37.2270, "lng": -8.6267, "length": 4.653, "turns": 15},
    "mugello":       {"lat": 43.9975, "lng": 11.3719, "length": 5.245, "turns": 15},
    "nurburgring":   {"lat": 50.3356, "lng": 6.9475, "length": 5.148, "turns": 16},
    "losail":        {"lat": 25.4900, "lng": 51.4542, "length": 5.419, "turns": 16},
    "ricard":        {"lat": 43.2506, "lng": 5.7911, "length": 5.842, "turns": 15},
    "valencia":      {"lat": 39.4589, "lng": -0.3312, "length": 5.419, "turns": 25},
    "fuji":          {"lat": 35.3717, "lng": 138.9267, "length": 4.563, "turns": 16},
    "sepang":        {"lat": 2.7608, "lng": 101.7381, "length": 5.543, "turns": 15},
    "indianapolis":  {"lat": 39.7950, "lng": -86.2347, "length": 4.192, "turns": 13},
    "magny_cours":   {"lat": 46.8642, "lng": 3.1636, "length": 4.411, "turns": 17},
    "yeongam":       {"lat": 34.7333, "lng": 126.4172, "length": 5.615, "turns": 18},
    "buddh":         {"lat": 28.3487, "lng": 77.5331, "length": 5.125, "turns": 16},
    "estoril":       {"lat": 38.7506, "lng": -9.3942, "length": 4.182, "turns": 13},
    "jerez":         {"lat": 36.7083, "lng": -6.0342, "length": 4.428, "turns": 13},
    "nurburg":       {"lat": 50.3356, "lng": 6.9475, "length": 5.148, "turns": 16},
}


def fetch(api: str) -> list[dict]:
    url = f"{api}/api/driver/hamilton/races"
    proc = subprocess.run(["curl", "-sL", "--max-time", "90", url],
                          capture_output=True, text=True)
    if proc.returncode != 0 or not proc.stdout:
        sys.exit(f"could not reach the data service at {api}")
    payload = json.loads(proc.stdout)
    if not payload.get("available"):
        sys.exit(f"results API unavailable: {payload.get('reason')}")
    return payload["races"]


def build(races: list[dict]) -> list[dict]:
    by = defaultdict(list)
    for r in races:
        by[r["circuit"]].append(r)

    out = []
    for cid, rows in by.items():
        finishes = [r["finish"] for r in rows if r.get("finish")]
        grids = [r["grid"] for r in rows if r.get("grid")]
        geo = GEO.get(cid, {})
        if not geo:
            print(f"  ! no geography for '{cid}' — omitting coordinates", file=sys.stderr)
        out.append({
            "id": cid,
            "name": rows[0]["circuitName"],
            "gp": rows[-1]["gp"],
            "country": rows[0]["country"],
            "lat": geo.get("lat"), "lng": geo.get("lng"),
            "length": geo.get("length"), "turns": geo.get("turns"),
            "starts": len(rows),
            "wins": sum(1 for f in finishes if f == 1),
            "podiums": sum(1 for f in finishes if f <= 3),
            "p1Starts": sum(1 for g in grids if g == 1),
            "frontRow": sum(1 for g in grids if g <= 2),
            "bestFinish": min(finishes) if finishes else None,
            "dnfs": len(rows) - len(finishes),
            "points": round(sum(r.get("points") or 0 for r in rows), 1),
            "avgGrid": round(sum(grids) / len(grids), 1) if grids else None,
            "avgFinish": round(sum(finishes) / len(finishes), 1) if finishes else None,
            "firstYear": min(r["year"] for r in rows),
            "lastYear": max(r["year"] for r in rows),
            "source": "Jolpica F1 API",
        })

    out.sort(key=lambda c: (-c["wins"], -c["starts"]))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:8044")
    args = ap.parse_args()

    races = fetch(args.api)
    circuits = build(races)
    OUT.write_text(json.dumps(circuits, indent=1, ensure_ascii=False) + "\n")

    print(f"{len(races)} races → {len(circuits)} circuits → {OUT.relative_to(ROOT)}")
    print(f"  totals check: starts={sum(c['starts'] for c in circuits)} "
          f"wins={sum(c['wins'] for c in circuits)} "
          f"podiums={sum(c['podiums'] for c in circuits)}")
    for c in circuits[:8]:
        print(f"  {c['name'][:34]:36} {c['starts']:3} starts  {c['wins']:2} wins  "
              f"{c['podiums']:2} podiums  P1×{c['p1Starts']}")


if __name__ == "__main__":
    main()
