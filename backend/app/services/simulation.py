from datetime import datetime

from app.database import get_connection


def run_simulation(zone_id: int, buses: int, sanitation_workers: int, water_redistribution: int, emergency_rerouting: int):
    with get_connection() as conn:
        zone = conn.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchone()
        if zone is None:
            raise ValueError("Zone not found")

        before_risk = float(zone["vulnerability_score"])
        congestion_reduction = min(68, buses * 3.7 + emergency_rerouting * 8.5 + sanitation_workers * 0.9)
        efficiency_increase = min(72, water_redistribution * 5.8 + sanitation_workers * 2.4 + buses * 1.2)
        after_risk = max(8, before_risk - congestion_reduction * 0.32 - efficiency_increase * 0.24)

        conn.execute(
            """
            INSERT INTO simulations
            (created_at, zone_id, buses, sanitation_workers, water_redistribution, emergency_rerouting, congestion_reduction, efficiency_increase, before_risk, after_risk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.utcnow().isoformat(),
                zone_id,
                buses,
                sanitation_workers,
                water_redistribution,
                emergency_rerouting,
                round(congestion_reduction, 1),
                round(efficiency_increase, 1),
                round(before_risk, 1),
                round(after_risk, 1),
            ),
        )

    return {
        "zone_id": zone_id,
        "congestion_reduction": round(congestion_reduction, 1),
        "efficiency_increase": round(efficiency_increase, 1),
        "before_risk": round(before_risk, 1),
        "after_risk": round(after_risk, 1),
        "recommendation": "Prioritize transit capacity and emergency rerouting" if after_risk > 45 else "Allocation stabilizes the zone for the next surge window",
    }
