"""LH44 data service — FastAPI over FastF1, Jolpica and the seed snapshot."""
from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import f1data, results, seed, stats
from .config import ALLOWED_ORIGINS, CURRENT_SEASON, DRIVER_CODE

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title="LH44 — The Legacy of 44",
    description="Career, season, race and FastF1 telemetry data for Lewis Hamilton.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "fastf1": f1data.FASTF1_AVAILABLE,
        "currentSeason": CURRENT_SEASON,
        "updatedAt": seed.meta().get("updatedAt"),
    }


@app.get("/api/driver/hamilton")
def driver():
    return {**seed.meta(), "career": stats.get_driver_career_stats()}


@app.get("/api/driver/hamilton/career")
def career():
    return stats.get_driver_career_stats()


@app.get("/api/driver/hamilton/seasons")
def all_seasons():
    return {"seasons": seed.seasons(), "source": "Formula1.com season classifications"}


@app.get("/api/driver/hamilton/season/{year}")
def season(year: int):
    data = stats.get_driver_season_stats(year)
    if not data:
        raise HTTPException(404, f"No season data for {year}.")
    return data


@app.get("/api/driver/hamilton/races")
def races():
    return results.get_driver_race_results()


@app.get("/api/driver/hamilton/races/{year}")
def races_for_year(year: int):
    return results.get_driver_race_results(year)


@app.get("/api/race/{year}/{grand_prix}")
def race_detail(year: int, grand_prix: str):
    archive = results.get_driver_race_results(year)
    match = next(
        (r for r in archive["races"] if grand_prix.lower() in (r.get("circuit", "") + r.get("gp", "")).lower()),
        None,
    )
    if not match:
        raise HTTPException(404, f"No Hamilton race found for {grand_prix} in {year}.")
    return {
        "race": match,
        "weather": f1data.get_weather(year, grand_prix, "race"),
        "tyres": f1data.get_tyre_strategy(year, grand_prix, "race", DRIVER_CODE),
        "positions": f1data.get_position_data(year, grand_prix, DRIVER_CODE),
    }


@app.get("/api/session/{year}/{grand_prix}/{session}")
def session_info(year: int, grand_prix: str, session: str):
    return {
        "weather": f1data.get_weather(year, grand_prix, session),
        "tyres": f1data.get_tyre_strategy(year, grand_prix, session, DRIVER_CODE),
    }


@app.get("/api/telemetry/{year}/{grand_prix}/{session}/{driver}")
def telemetry(year: int, grand_prix: str, session: str, driver: str):
    return f1data.get_fastest_lap(year, grand_prix, session, driver)


@app.get("/api/telemetry/{year}/{grand_prix}/{session}/{driver}/{lap}")
def telemetry_lap(year: int, grand_prix: str, session: str, driver: str, lap: int):
    return f1data.get_lap_telemetry(year, grand_prix, session, driver, lap)


@app.get("/api/compare/{year}/{grand_prix}/{session}/{driver1}/{driver2}")
def compare(year: int, grand_prix: str, session: str, driver1: str, driver2: str):
    return f1data.compare_drivers(year, grand_prix, session, driver1, driver2)


@app.get("/api/circuit/{circuit}")
def circuit(circuit: str):
    data = stats.get_circuit_stats(circuit)
    if not data:
        raise HTTPException(404, f"No circuit record for {circuit}.")
    return data


@app.get("/api/circuits")
def circuits():
    return {"circuits": stats.get_circuit_stats(), "source": "Formula1.com results archive"}


@app.get("/api/championships")
def championships():
    return {"championships": stats.get_championship_history()}


@app.get("/api/current-season")
def current_season():
    return results.get_current_season()
