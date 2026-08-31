#!/usr/bin/env python3
"""Render every extracted circuit outline to one HTML sheet for visual checking.

The path picker is a heuristic, so each result has to be looked at: a wrong pick
shows up immediately as a blob, a border rectangle or a fragment. Markers at
0/25/50/75% of path length confirm the path runs once around the lap rather
than out-and-back along a filled ribbon.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
shapes = json.loads((ROOT / "data" / "circuit-shapes.json").read_text())["shapes"]

cards = []
for cid, s in sorted(shapes.items()):
    cards.append(f"""
    <figure class="card">
      <svg viewBox="{s['viewBox']}" class="trk" data-id="{cid}">
        <path d="{s['d']}" fill="none" stroke="#222" stroke-width="2.6"
              stroke-linejoin="round" stroke-linecap="round"/>
        <path class="line" d="{s['d']}" fill="none" stroke="#C9A227" stroke-width="0.9"
              stroke-linejoin="round" stroke-linecap="round"/>
        <g class="marks"></g>
      </svg>
      <figcaption><b>{cid}</b><span>{s['name']}</span>
        <em>{s['commands']} pts · {s['licence']}</em></figcaption>
    </figure>""")

html = f"""<!doctype html><meta charset="utf-8"><title>Circuit outline check</title>
<style>
 body{{background:#050505;color:#F4F4F4;font:13px/1.5 system-ui;margin:0;padding:24px}}
 h1{{font-size:18px;font-weight:600;margin:0 0 4px}}
 p.sub{{color:#8A8A8A;margin:0 0 20px}}
 .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}}
 .card{{margin:0;border:1px solid #222;padding:10px;background:#0B0B0B}}
 .trk{{width:100%;height:170px;display:block}}
 figcaption{{margin-top:8px;display:flex;flex-direction:column;gap:2px}}
 figcaption b{{font-size:12px}}
 figcaption span{{color:#B8B8B8;font-size:11px}}
 figcaption em{{color:#8A8A8A;font-size:10px;font-style:normal}}
</style>
<h1>Circuit outline check — {len(shapes)} traced</h1>
<p class="sub">Red markers sit at 0 / 25 / 50 / 75% of path length. Even spacing around the loop means the path runs the lap once.</p>
<div class="grid">{''.join(cards)}</div>
<script>
for (const svg of document.querySelectorAll('.trk')) {{
  const p = svg.querySelector('.line'), g = svg.querySelector('.marks');
  const total = p.getTotalLength();
  [0,.25,.5,.75].forEach((f,i) => {{
    const pt = p.getPointAtLength(f*total);
    g.insertAdjacentHTML('beforeend',
      `<circle cx="${{pt.x}}" cy="${{pt.y}}" r="2.2" fill="#050505" stroke="#D40000" stroke-width="0.55"/>`
      + `<text x="${{pt.x}}" y="${{pt.y+0.8}}" font-size="2.2" fill="#D40000" text-anchor="middle">${{i}}</text>`);
  }});
}}
</script>"""

out = ROOT / "frontend" / "public" / "shape-check.html"
out.write_text(html)
print(f"{len(shapes)} shapes → {out.relative_to(ROOT)}")
