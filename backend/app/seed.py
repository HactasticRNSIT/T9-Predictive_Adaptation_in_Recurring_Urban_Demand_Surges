from datetime import datetime, timedelta
import math
import random

from app.database import get_connection
from app.ml.anomaly import detect_anomalies
from app.ml.forecasting import build_forecast
from app.ml.scoring import vulnerability_score

ZONES = [
    {"id": 1, "name": "Whitefield", "lat": 12.9698, "lng": 77.7500, "density": 23600, "traffic": 1780, "utility": 1080, "type": "it"},
    {"id": 2, "name": "Indiranagar", "lat": 12.9784, "lng": 77.6408, "density": 28400, "traffic": 1420, "utility": 930, "type": "nightlife"},
    {"id": 3, "name": "Electronic City", "lat": 12.8452, "lng": 77.6602, "density": 19800, "traffic": 1680, "utility": 1040, "type": "tech"},
    {"id": 4, "name": "Koramangala", "lat": 12.9352, "lng": 77.6245, "density": 30200, "traffic": 1510, "utility": 960, "type": "mixed"},
    {"id": 5, "name": "Majestic", "lat": 12.9766, "lng": 77.5713, "density": 34600, "traffic": 1900, "utility": 990, "type": "transport"},
    {"id": 6, "name": "Yelahanka", "lat": 13.1007, "lng": 77.5963, "density": 15400, "traffic": 1020, "utility": 720, "type": "residential"},
    {"id": 7, "name": "Hebbal", "lat": 13.0358, "lng": 77.5970, "density": 22600, "traffic": 1560, "utility": 840, "type": "bottleneck"},
    {"id": 8, "name": "Jayanagar", "lat": 12.9250, "lng": 77.5938, "density": 27100, "traffic": 1160, "utility": 860, "type": "residential"},
    {"id": 9, "name": "Marathahalli", "lat": 12.9569, "lng": 77.7011, "density": 26500, "traffic": 1710, "utility": 980, "type": "it"},
    {"id": 10, "name": "MG Road", "lat": 12.9759, "lng": 77.6069, "density": 31800, "traffic": 1600, "utility": 960, "type": "commercial"},
    {"id": 11, "name": "KR Puram", "lat": 13.0076, "lng": 77.6959, "density": 24400, "traffic": 1840, "utility": 910, "type": "bottleneck"},
    {"id": 12, "name": "Banashankari", "lat": 12.9255, "lng": 77.5468, "density": 23800, "traffic": 1110, "utility": 800, "type": "residential"},
]


def _locality_rush(zone_type: str, ts: datetime) -> float:
    if zone_type in ("it", "tech"):
        return 1.55 if ts.hour in (8, 9, 10, 17, 18, 19) and ts.weekday() < 5 else 1.0
    if zone_type == "transport":
        return 1.62 if ts.hour in (7, 8, 9, 17, 18, 19, 20) else 1.18
    if zone_type == "bottleneck":
        return 1.70 if ts.hour in (8, 9, 10, 18, 19, 20) else 1.08
    if zone_type == "nightlife":
        return 1.52 if ts.hour in (20, 21, 22, 23) else 1.22 if ts.hour in (8, 9, 18, 19) else 1.0
    if zone_type == "commercial":
        return 1.48 if ts.hour in (11, 12, 17, 18, 19, 20) else 1.0
    if zone_type == "mixed":
        return 1.42 if ts.hour in (9, 10, 18, 19, 20, 21) else 1.0
    return 1.25 if ts.hour in (8, 9, 18, 19) else 1.0


def _locality_event(zone_type: str, ts: datetime, hour: int) -> float:
    if zone_type in ("it", "tech") and ts.weekday() < 5 and ts.hour in (9, 18):
        return 1.34
    if zone_type == "transport" and ts.hour in (7, 8, 18, 19):
        return 1.48
    if zone_type == "nightlife" and ts.weekday() in (4, 5, 6) and ts.hour in (21, 22, 23):
        return 1.72
    if zone_type == "bottleneck" and hour in (37, 88, 132):
        return 1.82
    if zone_type == "commercial" and ts.weekday() >= 5 and ts.hour in (16, 17, 18, 19):
        return 1.45
    return 1.0


def seed_database() -> None:
    with get_connection() as conn:
        current = conn.execute("SELECT COUNT(*), COALESCE(MIN(name), '') FROM zones").fetchone()
        if current[0] == len(ZONES) and current[1] != "Central Grid":
            return
        conn.executescript(
            """
            DELETE FROM simulations;
            DELETE FROM anomalies;
            DELETE FROM forecasts;
            DELETE FROM demand_history;
            DELETE FROM zones;
            """
        )

        now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        start = now - timedelta(hours=168)

        for zone in ZONES:
            zone_id = zone["id"]
            name = zone["name"]
            lat = zone["lat"]
            lng = zone["lng"]
            density = zone["density"]
            base_traffic = zone["traffic"]
            base_utility = zone["utility"]
            score = vulnerability_score(density, base_traffic, base_utility)
            conn.execute(
                "INSERT INTO zones VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (zone_id, name, lat, lng, density, score, base_traffic, base_utility),
            )

            history = []
            for hour in range(168):
                ts = start + timedelta(hours=hour)
                rush = _locality_rush(zone["type"], ts)
                night = 0.62 if ts.hour in range(0, 6) else 1.0
                weekend = 0.84 if ts.weekday() >= 5 else 1.0
                weather = random.choice([0.92, 1.0, 1.08, 1.18])
                event = _locality_event(zone["type"], ts, hour)
                wave = 1 + 0.12 * math.sin(hour / 5)
                traffic = int(base_traffic * rush * night * weekend * weather * event * wave + random.randint(-75, 90))
                utility = int(base_utility * (0.86 + rush * 0.12 + weather * 0.18 + event * 0.10) + random.randint(-45, 60))
                history.append({"timestamp": ts.isoformat(), "traffic": max(120, traffic), "utility": max(80, utility)})
                conn.execute(
                    "INSERT INTO demand_history (zone_id, timestamp, traffic, utility, weather_factor, event_factor) VALUES (?, ?, ?, ?, ?, ?)",
                    (zone_id, ts.isoformat(), max(120, traffic), max(80, utility), weather, event),
                )

            forecasts = build_forecast(history)
            for item in forecasts:
                conn.execute(
                    "INSERT INTO forecasts (zone_id, timestamp, traffic_pred, utility_pred, horizon) VALUES (?, ?, ?, ?, ?)",
                    (zone_id, item["timestamp"], item["traffic_pred"], item["utility_pred"], item["horizon"]),
                )

            anomalies = detect_anomalies(history)
            for item in anomalies:
                conn.execute(
                    "INSERT INTO anomalies (zone_id, timestamp, metric, value, severity, reason) VALUES (?, ?, ?, ?, ?, ?)",
                    (zone_id, item["timestamp"], item["metric"], item["value"], item["severity"], item["reason"]),
                )
