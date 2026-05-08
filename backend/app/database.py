import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "surgesense.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS zones (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                population_density INTEGER NOT NULL,
                vulnerability_score REAL NOT NULL,
                baseline_traffic INTEGER NOT NULL,
                baseline_utility INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS demand_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                traffic INTEGER NOT NULL,
                utility INTEGER NOT NULL,
                weather_factor REAL NOT NULL,
                event_factor REAL NOT NULL,
                FOREIGN KEY(zone_id) REFERENCES zones(id)
            );

            CREATE TABLE IF NOT EXISTS forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                traffic_pred REAL NOT NULL,
                utility_pred REAL NOT NULL,
                horizon TEXT NOT NULL,
                FOREIGN KEY(zone_id) REFERENCES zones(id)
            );

            CREATE TABLE IF NOT EXISTS anomalies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                severity TEXT NOT NULL,
                reason TEXT NOT NULL,
                FOREIGN KEY(zone_id) REFERENCES zones(id)
            );

            CREATE TABLE IF NOT EXISTS simulations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                zone_id INTEGER NOT NULL,
                buses INTEGER NOT NULL,
                sanitation_workers INTEGER NOT NULL,
                water_redistribution INTEGER NOT NULL,
                emergency_rerouting INTEGER NOT NULL,
                congestion_reduction REAL NOT NULL,
                efficiency_increase REAL NOT NULL,
                before_risk REAL NOT NULL,
                after_risk REAL NOT NULL,
                FOREIGN KEY(zone_id) REFERENCES zones(id)
            );
            """
        )
