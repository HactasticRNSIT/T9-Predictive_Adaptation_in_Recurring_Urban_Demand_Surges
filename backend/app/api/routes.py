from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_connection
from app.ml.scoring import classify_risk
from app.services.simulation import run_simulation

router = APIRouter()


class SimulationRequest(BaseModel):
    zone_id: int
    buses: int = 4
    sanitation_workers: int = 8
    water_redistribution: int = 3
    emergency_rerouting: int = 1


def rows(query: str, params=()):
    with get_connection() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]


@router.get("/zones")
def zones():
    data = rows("SELECT * FROM zones ORDER BY vulnerability_score DESC")
    for zone in data:
        zone["risk_level"] = classify_risk(zone["vulnerability_score"])
    return data


@router.get("/forecast")
def forecast(zone_id: int = 1):
    return rows("SELECT timestamp, traffic_pred, utility_pred, horizon FROM forecasts WHERE zone_id = ? ORDER BY timestamp", (zone_id,))


@router.get("/anomalies")
def anomalies(zone_id: int | None = None):
    if zone_id:
        return rows("SELECT a.*, z.name as zone_name FROM anomalies a JOIN zones z ON z.id = a.zone_id WHERE zone_id = ? ORDER BY timestamp DESC", (zone_id,))
    return rows("SELECT a.*, z.name as zone_name FROM anomalies a JOIN zones z ON z.id = a.zone_id ORDER BY timestamp DESC LIMIT 30")


@router.post("/simulate")
def simulate(payload: SimulationRequest):
    try:
        return run_simulation(**payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/dashboard")
def dashboard():
    zones_data = zones()
    anomaly_data = anomalies()
    with get_connection() as conn:
        latest = [dict(row) for row in conn.execute(
            """
            SELECT h.zone_id, z.name, h.timestamp, h.traffic, h.utility
            FROM demand_history h
            JOIN zones z ON z.id = h.zone_id
            WHERE h.id IN (SELECT MAX(id) FROM demand_history GROUP BY zone_id)
            ORDER BY h.traffic DESC
            """
        ).fetchall()]

    heatmap = []
    for zone in zones_data:
        intensity = min(1, zone["vulnerability_score"] / 100)
        heatmap.append({"lat": zone["latitude"], "lng": zone["longitude"], "intensity": intensity, "name": zone["name"]})

    return {
        "summary": {
            "active_zones": len(zones_data),
            "critical_zones": len([z for z in zones_data if z["risk_level"] in ("critical", "high")]),
            "open_anomalies": len(anomaly_data),
            "city_efficiency": 87,
        },
        "zones": zones_data,
        "latest": latest,
        "heatmap": heatmap,
        "activity": anomaly_data[:8],
    }
