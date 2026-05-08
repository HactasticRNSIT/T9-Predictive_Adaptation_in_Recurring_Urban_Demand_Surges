from datetime import datetime, timedelta
import statistics

try:
    from prophet import Prophet
except Exception:
    Prophet = None


def _fallback_forecast(history):
    recent = history[-48:]
    traffic_avg = statistics.mean(item["traffic"] for item in recent)
    utility_avg = statistics.mean(item["utility"] for item in recent)
    last_time = datetime.fromisoformat(history[-1]["timestamp"])
    rows = []
    for hour in range(1, 49):
        ts = last_time + timedelta(hours=hour)
        rush = 1.28 if ts.hour in (8, 9, 17, 18, 19) else 1.0
        night = 0.68 if ts.hour in range(0, 6) else 1.0
        horizon = "hourly" if hour <= 24 else "daily"
        rows.append(
            {
                "timestamp": ts.isoformat(),
                "traffic_pred": round(traffic_avg * rush * night, 1),
                "utility_pred": round(utility_avg * (0.92 + rush * 0.08), 1),
                "horizon": horizon,
            }
        )
    return rows


def build_forecast(history):
    if not history or Prophet is None:
        return _fallback_forecast(history)
    return _fallback_forecast(history)
