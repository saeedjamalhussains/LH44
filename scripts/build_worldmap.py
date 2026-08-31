#!/usr/bin/env python3
"""Build a real world landmass outline for the circuit map.

Source: Natural Earth 1:110m land, via the world-atlas TopoJSON build. Natural
Earth is public domain. The TopoJSON arcs are decoded and projected with the
same equirectangular transform the circuit markers use, so a marker's latitude
and longitude land exactly where they should on the coastline.

Usage:  python3 scripts/build_worldmap.py
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "world-map.json"
SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

# Must match the projection used by the map component.
W, H = 1000.0, 500.0


def project(lon: float, lat: float) -> tuple[float, float]:
    return ((lon + 180.0) / 360.0) * W, ((90.0 - lat) / 180.0) * H


def decode_arcs(topo: dict) -> list[list[tuple[float, float]]]:
    """Undo TopoJSON quantisation and delta encoding."""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    out = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append(project(x * sx + tx, y * sy + ty))
        out.append(pts)
    return out


def ring_to_points(indices, arcs):
    pts = []
    for i in indices:
        if i >= 0:
            seg = arcs[i]
        else:
            seg = arcs[~i][::-1]      # a negative index means the arc reversed
        pts.extend(seg if not pts else seg[1:])
    return pts


def ring_path(pts, precision=2) -> str:
    """One closed subpath. Points that collapse at this precision are dropped."""
    if len(pts) < 4:
        return ""
    out, last = [], None
    for x, y in pts:
        s = f"{x:.{precision}f} {y:.{precision}f}"
        if s == last:
            continue
        out.append(s)
        last = s
    if len(out) < 4:
        return ""
    return "M" + out[0] + "".join("L" + p for p in out[1:]) + "Z"


def ring_area(pts) -> float:
    """Shoelace area, used to reject slivers that render as stray fringes."""
    a = 0.0
    for i in range(len(pts) - 1):
        a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    return abs(a) / 2.0


def ring_bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def unwrap_ring(pts):
    """Make a ring continuous across the 180th meridian.

    Landmasses that straddle the antimeridian — Chukotka, Fiji, Wrangel Island —
    have consecutive vertices at opposite edges of an equirectangular map. Joined
    as-is they draw a line straight across the world; split into pieces, closing
    each piece draws a long diagonal chord between its endpoints instead. Both
    are wrong.

    Walking the ring and carrying an offset of ±W keeps it a single continuous
    polygon. It then extends beyond the map on one side, and `wrapped_copies`
    puts the overflow back on the other, where it belongs.
    """
    limit = W / 2
    out = [pts[0]]
    offset = 0.0
    for prev, nxt in zip(pts, pts[1:]):
        dx = nxt[0] - prev[0]
        if dx > limit:
            offset -= W
        elif dx < -limit:
            offset += W
        out.append((nxt[0] + offset, nxt[1]))
    return out


def wrapped_copies(pts):
    """The ring, plus a shifted copy for whatever hangs off either edge."""
    xs = [p[0] for p in pts]
    copies = [pts]
    if min(xs) < 0:
        copies.append([(x + W, y) for x, y in pts])
    if max(xs) > W:
        copies.append([(x - W, y) for x, y in pts])
    return copies


def main() -> None:
    raw = subprocess.run(
        ["curl", "-sL", "--max-time", "60", SRC], capture_output=True, text=True)
    topo = json.loads(raw.stdout)
    arcs = decode_arcs(topo)

    # Antarctica spans every longitude and, in this projection, renders as a
    # smear across the foot of the map. No Grand Prix has been held there.
    antarctic_y = project(0, -60)[1]

    paths = []
    for geom in topo["objects"]["land"]["geometries"]:
        polys = [geom["arcs"]] if geom["type"] == "Polygon" else geom["arcs"]
        for poly in polys:
            # All rings of one polygon go into a single path so that inner rings
            # cut holes under fill-rule="evenodd". Emitting them separately fills
            # inland seas as land and leaves visible fringes.
            subpaths = []
            for ring in poly:
                raw = ring_to_points(ring, arcs)
                if len(raw) < 4:
                    continue
                for pts in wrapped_copies(unwrap_ring(raw)):
                    minx, miny, maxx, maxy = ring_bbox(pts)
                    if miny >= antarctic_y:
                        continue
                    # Reject slivers: negligible area, or effectively a line.
                    if ring_area(pts) < 0.6:
                        continue
                    if (maxx - minx) < 0.4 or (maxy - miny) < 0.4:
                        continue
                    sp = ring_path(pts)
                    if sp:
                        subpaths.append(sp)
            if subpaths:
                paths.append("".join(subpaths))

    OUT.write_text(json.dumps({
        "viewBox": f"0 0 {int(W)} {int(H)}",
        "width": W, "height": H,
        "projection": "equirectangular, -180..180 lon, 90..-90 lat",
        "paths": paths,
        "fillRule": "evenodd",
        "source": "Natural Earth 1:110m land, via world-atlas",
        "sourceUrl": "https://www.naturalearthdata.com/",
        "licence": "Public domain",
    }, indent=1) + "\n")

    print(f"{len(paths)} landmass paths → {OUT.relative_to(ROOT)} "
          f"({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
