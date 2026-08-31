#!/usr/bin/env python3
"""Extract real circuit outlines from Wikimedia Commons SVG track maps.

For each circuit the script downloads the chosen SVG, discards label/decoration
elements, picks the path that actually describes the track, normalises it into a
local coordinate box and records the file's author and licence.

The output feeds CircuitSilhouette, which positions the 44 marker with
getPointAtLength() on this path — so lap playback follows the circuit's real
geometry rather than an approximation of it.

Only files under a verified free licence are accepted.

Usage:  python3 scripts/build_shapes.py
"""
from __future__ import annotations

import json
import math
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "circuit-shapes.json"
API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia's User-Agent policy requires a contact. Requests without one are
# served an HTML error page instead of the file.
UA = "LH44-LegacyOf44/1.0 (https://github.com/lh44-legacy; projectsjh18@gmail.com)"
FREE = re.compile(r"^(cc[ -]by([ -]sa)?([ -][\d.]+)?|cc0|public domain|pd-)", re.I)
SVG_NS = "{http://www.w3.org/2000/svg}"

TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE]-?\d+)?")
ARGC = {"m": 2, "l": 2, "h": 1, "v": 1, "c": 6, "s": 4, "q": 4, "t": 2, "a": 7, "z": 0}


def curl(url: str, tries: int = 5):
    """Fetch with backoff.

    Wikimedia rate-limits aggressively and answers with plain text rather than
    an HTTP error, so that case is detected explicitly. Requests without a
    contact in the User-Agent are served an HTML error page instead of the file.
    """
    for i in range(tries):
        r = subprocess.run(["curl", "-sL", "--max-time", "45", "-A", UA, url],
                           capture_output=True)
        if r.returncode == 0 and r.stdout:
            head = r.stdout[:120].decode("utf-8", "replace").lower()
            if "too many requests" in head:
                wait = 30 * (i + 1)
                print(f"    rate limited; waiting {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            if "<!doctype html" in head:
                print("    served an HTML error page, retrying", file=sys.stderr)
                time.sleep(10)
                continue
            return r.stdout.decode("utf-8", "replace")
        time.sleep(5 * (i + 1))
    return None


def api(params: dict) -> dict:
    raw = curl(API + "?" + urllib.parse.urlencode(params))
    if not raw or not raw.lstrip().startswith("{"):
        return {}
    return json.loads(raw)


def parse_path(d: str):
    """Parse path data into absolute segments.

    Circuit SVGs are written with relative polybezier commands, so the raw
    numbers in the `d` string are deltas, not coordinates. Everything is
    converted to absolute here; treating the deltas as positions is what makes a
    naive extraction come out as noise.
    """
    tokens = TOKEN.findall(d)
    segs, i = [], 0
    cx = cy = sx = sy = 0.0
    cmd = None
    while i < len(tokens):
        t = tokens[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t
            i += 1
            if cmd.lower() == "z":
                segs.append(("Z", []))
                cx, cy = sx, sy
                continue
        if cmd is None:
            return []
        n = ARGC[cmd.lower()]
        if n == 0:
            continue
        if i + n > len(tokens):
            break
        try:
            args = [float(x) for x in tokens[i:i + n]]
        except ValueError:
            break
        i += n
        rel = cmd.islower()
        c = cmd.lower()

        if c == "m":
            x, y = (cx + args[0], cy + args[1]) if rel else (args[0], args[1])
            segs.append(("M", [x, y]))
            cx, cy, sx, sy = x, y, x, y
            cmd = "l" if rel else "L"      # subsequent pairs are implicit lineto
        elif c == "l":
            x, y = (cx + args[0], cy + args[1]) if rel else (args[0], args[1])
            segs.append(("L", [x, y])); cx, cy = x, y
        elif c == "h":
            x = cx + args[0] if rel else args[0]
            segs.append(("L", [x, cy])); cx = x
        elif c == "v":
            y = cy + args[0] if rel else args[0]
            segs.append(("L", [cx, y])); cy = y
        elif c == "c":
            pts = [(cx + args[j] if rel else args[j], cy + args[j + 1] if rel else args[j + 1])
                   for j in (0, 2, 4)]
            segs.append(("C", [v for p in pts for v in p]))
            cx, cy = pts[2]
        elif c == "s":
            pts = [(cx + args[j] if rel else args[j], cy + args[j + 1] if rel else args[j + 1])
                   for j in (0, 2)]
            segs.append(("S", [v for p in pts for v in p]))
            cx, cy = pts[1]
        elif c == "q":
            pts = [(cx + args[j] if rel else args[j], cy + args[j + 1] if rel else args[j + 1])
                   for j in (0, 2)]
            segs.append(("Q", [v for p in pts for v in p]))
            cx, cy = pts[1]
        elif c == "t":
            x, y = (cx + args[0], cy + args[1]) if rel else (args[0], args[1])
            segs.append(("T", [x, y])); cx, cy = x, y
        elif c == "a":
            x, y = (cx + args[5], cy + args[6]) if rel else (args[5], args[6])
            segs.append(("A", [args[0], args[1], args[2], args[3], args[4], x, y]))
            cx, cy = x, y
    return segs


def seg_points(segs):
    """Every on-curve and control point, for the bounding box."""
    pts = []
    for cmd, a in segs:
        if cmd == "Z":
            continue
        if cmd == "A":
            pts.append((a[5], a[6]))
        else:
            pts += [(a[j], a[j + 1]) for j in range(0, len(a), 2)]
    return pts


def longest_subpath(d: str) -> str:
    """Keep only the circuit itself.

    Some track maps draw the pit lane or an access road as extra subpaths inside
    the same path element. Left in, they inflate the total path length, so
    scaling the result to the circuit's real length shrinks every corner radius
    and the simulated lap comes out far too slow. The racing surface is always
    the longest subpath.
    """
    parts = [p for p in re.split(r"(?=[Mm])", d) if p.strip()]
    if len(parts) <= 1:
        return d
    best, best_len = d, -1.0
    for part in parts:
        pts = seg_points(parse_path(part))
        if len(pts) < 4:
            continue
        length = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        if length > best_len:
            best, best_len = part, length
    return best


def path_bbox(d: str):
    pts = seg_points(parse_path(d))
    if len(pts) < 4:
        return None
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def complexity(d: str) -> int:
    """Count on-curve points, not command letters — these paths are written as
    a single `c` with hundreds of coordinate pairs."""
    return len(seg_points(parse_path(d)))


def normalise(d: str, bbox, size: float = 100.0, pad: float = 5.0):
    """Emit an absolute path scaled into a clean square box."""
    minx, miny, maxx, maxy = bbox
    w, h = maxx - minx, maxy - miny
    if w <= 0 or h <= 0:
        return ""
    scale = (size - 2 * pad) / max(w, h)
    ox = pad + ((size - 2 * pad) - w * scale) / 2
    oy = pad + ((size - 2 * pad) - h * scale) / 2
    fx = lambda x: (x - minx) * scale + ox
    fy = lambda y: (y - miny) * scale + oy

    out = []
    for cmd, a in parse_path(d):
        if cmd == "Z":
            out.append("Z")
        elif cmd == "A":
            out.append("A" + " ".join(
                f"{v:.2f}" for v in
                [a[0] * scale, a[1] * scale, a[2], a[3], a[4], fx(a[5]), fy(a[6])]))
        else:
            coords = []
            for j in range(0, len(a), 2):
                coords += [f"{fx(a[j]):.2f}", f"{fy(a[j + 1]):.2f}"]
            out.append(cmd + " ".join(coords))
    return " ".join(out)


def pick_track_path(svg_text: str):
    """Return the path most likely to be the circuit outline.

    Track maps put the circuit in the most complex path in the file; labels,
    arrows and pit markers are far simpler. Paths that are nearly a straight
    line or that have too few commands are rejected.
    """
    try:
        root = ET.fromstring(svg_text.encode("utf-8"))
    except ET.ParseError:
        return None

    best = None
    for el in root.iter():
        if not el.tag.endswith("}path") and not el.tag.endswith("path"):
            continue
        d = el.get("d")
        if not d:
            continue
        c = complexity(d)
        if c < 30:
            continue
        bbox = path_bbox(d)
        if not bbox:
            continue
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if w <= 0 or h <= 0:
            continue
        ratio = max(w, h) / min(w, h)
        if ratio > 8:            # a long thin sliver is a border or an axis
            continue
        area = w * h
        score = c * (area ** 0.25)
        if best is None or score > best[0]:
            best = (score, d, bbox)
    return best


def strip(x: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", x or "")).strip()


def main() -> None:
    picks = json.loads(Path("/tmp/picks.json").read_text())
    circuits = json.loads((ROOT / "data" / "hamilton.circuits.json").read_text())
    names = {c["id"]: c["name"] for c in circuits}
    lengths = {c["id"]: c.get("length") for c in circuits}

    shapes, rejected = {}, []

    # A single batched query covers every file: 1 API request, not 30.
    titles = list(picks.values())
    meta = {}
    for i in range(0, len(titles), 25):
        chunk = titles[i:i + 25]
        info = api({"action": "query", "titles": "|".join(chunk), "prop": "imageinfo",
                    "iiprop": "url|extmetadata", "format": "json"})
        for page in info.get("query", {}).get("pages", {}).values():
            if "imageinfo" in page:
                meta[page["title"]] = page["imageinfo"][0]
        time.sleep(3)

    print(f"metadata for {len(meta)}/{len(titles)} files")

    for cid, title in picks.items():
        ii = meta.get(title)
        if not ii:
            rejected.append({"circuit": cid, "why": "metadata unavailable"})
            continue
        md = ii.get("extmetadata", {})
        lic = strip(md.get("LicenseShortName", {}).get("value", ""))
        if not FREE.match(lic):
            rejected.append({"circuit": cid, "why": f"licence not free: {lic}"})
            continue

        # Files come from upload.wikimedia.org, which is not the rate-limited API.
        svg = curl(ii["url"])
        if not svg:
            rejected.append({"circuit": cid, "why": "download failed"})
            continue
        picked = pick_track_path(svg)
        if not picked:
            rejected.append({"circuit": cid, "why": "no track path found in the SVG"})
            continue

        _, d, _ = picked
        d = longest_subpath(d)
        bbox = path_bbox(d)
        nd = normalise(d, bbox)
        shapes[cid] = {
            "name": names.get(cid, cid),
            # Real circuit length in km. The traced outline is geometry only;
            # scaling it to true metres is what makes the lap simulation valid.
            "lengthKm": lengths.get(cid),
            "d": nd,
            "viewBox": "0 0 100 100",
            "width": 100, "height": 100,
            "start": None,
            "file": title.replace("File:", ""),
            "artist": strip(md.get("Artist", {}).get("value", "")) or "Unknown",
            "licence": lic,
            "licenceUrl": md.get("LicenseUrl", {}).get("value", ""),
            "source": ii["descriptionurl"],
            "commands": complexity(nd),
        }
        print(f"  {cid:16} {lic:14} {complexity(nd):4} cmds  {title[:46]}")
        time.sleep(0.8)

    OUT.write_text(json.dumps({"shapes": shapes}, indent=1, ensure_ascii=False) + "\n")
    print(f"\n{len(shapes)} circuit outlines → {OUT.relative_to(ROOT)}")
    for r in rejected:
        print(f"  skipped {r['circuit']}: {r['why']}")


if __name__ == "__main__":
    main()
