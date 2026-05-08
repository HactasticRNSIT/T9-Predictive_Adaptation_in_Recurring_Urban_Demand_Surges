from app.api.routes import anomalies, dashboard, forecast, simulate, zones, SimulationRequest
from app.database import init_db
from app.seed import seed_database


def run() -> None:
    init_db()
    seed_database()

    zone_data = zones()
    assert len(zone_data) >= 1
    assert "risk_level" in zone_data[0]

    zone_id = zone_data[0]["id"]
    forecast_data = forecast(zone_id=zone_id)
    assert len(forecast_data) >= 24
    assert "traffic_pred" in forecast_data[0]

    anomaly_data = anomalies(zone_id=zone_id)
    assert isinstance(anomaly_data, list)

    simulation = simulate(
        SimulationRequest(
            zone_id=zone_id,
            buses=4,
            sanitation_workers=8,
            water_redistribution=3,
            emergency_rerouting=1,
        )
    )
    assert simulation["after_risk"] <= simulation["before_risk"]

    dashboard_data = dashboard()
    assert dashboard_data["summary"]["active_zones"] >= 1
    assert len(dashboard_data["heatmap"]) >= 1


if __name__ == "__main__":
    run()
    print("Backend smoke tests passed")
