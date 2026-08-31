"""Filesystem JSON cache.

Keys follow the documented scheme: ``{season}_{grand_prix}_{session}_{driver}``.
Redis can be swapped in behind the same ``get``/``set`` pair without touching
call sites.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from typing import Any, Callable, Optional

from .config import JSON_CACHE_DIR, TTL_CURRENT, TTL_HISTORIC, CURRENT_SEASON

log = logging.getLogger("lh44.cache")
_SAFE = re.compile(r"[^a-z0-9_.-]+")


def make_key(*parts: Any) -> str:
    joined = "_".join(str(p).strip().lower().replace(" ", "-") for p in parts if p is not None)
    return _SAFE.sub("", joined) or "root"


def ttl_for(year: Optional[int]) -> int:
    """Finished seasons are immutable; the live one is not."""
    if year is None or int(year) >= CURRENT_SEASON:
        return TTL_CURRENT
    return TTL_HISTORIC


def _path(key: str):
    digest = hashlib.sha1(key.encode()).hexdigest()[:10]
    return JSON_CACHE_DIR / f"{key[:80]}.{digest}.json"


def get(key: str, ttl: int) -> Optional[Any]:
    p = _path(key)
    if not p.exists():
        return None
    try:
        if ttl >= 0 and (time.time() - p.stat().st_mtime) > ttl:
            return None
        with p.open() as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("cache read failed for %s: %s", key, exc)
        return None


def set(key: str, value: Any) -> Any:  # noqa: A001 - mirrors a cache API
    try:
        tmp = _path(key).with_suffix(".tmp")
        with tmp.open("w") as fh:
            json.dump(value, fh)
        tmp.replace(_path(key))
    except (OSError, TypeError) as exc:
        log.warning("cache write failed for %s: %s", key, exc)
    return value


def cached(key: str, ttl: int, producer: Callable[[], Any], *, stale_ok: bool = True) -> Any:
    """Return cached value, else produce it.

    On producer failure a stale entry is preferred over an error — the site
    should degrade to older data rather than break.
    """
    hit = get(key, ttl)
    if hit is not None:
        return hit
    try:
        return set(key, producer())
    except Exception as exc:  # noqa: BLE001 - boundary: any upstream failure
        log.error("producer failed for %s: %s", key, exc)
        if stale_ok:
            stale = get(key, ttl=-1)
            if stale is not None:
                log.warning("serving stale cache for %s", key)
                if isinstance(stale, dict):
                    stale = {**stale, "stale": True}
                return stale
        raise
