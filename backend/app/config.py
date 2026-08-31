"""Runtime configuration for the LH44 data service."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SEED_DIR = Path(os.getenv("LH44_SEED_DIR", BASE_DIR.parent / "data"))
CACHE_DIR = Path(os.getenv("LH44_CACHE_DIR", BASE_DIR / "cache"))
FASTF1_CACHE_DIR = CACHE_DIR / "fastf1"
JSON_CACHE_DIR = CACHE_DIR / "json"

# Seconds. Completed historical sessions never change; the running season does.
TTL_HISTORIC = int(os.getenv("LH44_TTL_HISTORIC", 60 * 60 * 24 * 30))
TTL_CURRENT = int(os.getenv("LH44_TTL_CURRENT", 60 * 60 * 6))

JOLPICA_BASE = os.getenv("LH44_JOLPICA_BASE", "https://api.jolpi.ca/ergast/f1")
DRIVER_ID = "hamilton"
DRIVER_CODE = "HAM"
CURRENT_SEASON = int(os.getenv("LH44_CURRENT_SEASON", 2026))

ALLOWED_ORIGINS = os.getenv(
    "LH44_ALLOWED_ORIGINS", "http://localhost:3044,http://127.0.0.1:3044"
).split(",")

for _d in (CACHE_DIR, FASTF1_CACHE_DIR, JSON_CACHE_DIR):
    _d.mkdir(parents=True, exist_ok=True)
