"""Static seed snapshot.

Ships with the repository so the site renders with no network and no FastF1
install. Every value carries a source, and live sources supersede it.
"""
from __future__ import annotations

import functools
import json
import logging
from typing import Any, Dict, List

from .config import SEED_DIR

log = logging.getLogger("lh44.seed")


@functools.lru_cache(maxsize=None)
def load(name: str) -> Any:
    path = SEED_DIR / name
    try:
        with path.open() as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        log.error("seed file %s unreadable: %s", path, exc)
        return [] if name.endswith("s.json") else {}


def seasons() -> List[Dict[str, Any]]:
    return load("hamilton.seasons.json")


def meta() -> Dict[str, Any]:
    return load("hamilton.meta.json")


def championships() -> List[Dict[str, Any]]:
    return load("hamilton.championships.json")


def circuits() -> List[Dict[str, Any]]:
    return load("hamilton.circuits.json")


def featured_races() -> List[Dict[str, Any]]:
    return load("hamilton.races.featured.json")
