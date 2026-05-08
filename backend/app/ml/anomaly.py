import statistics

try:
    from sklearn.ensemble import IsolationForest
except Exception:
    IsolationForest = None


def detect_anomalies(history):
    if not history:
        return []

    values = [[item["traffic"], item["utility"]] for item in history]
    anomalies = []

    if IsolationForest is not None and len(values) > 20:
        model = IsolationForest(contamination=0.08, random_state=42)
        labels = model.fit_predict(values)
        for item, label in zip(history, labels):
            if label == -1:
                value = max(item["traffic"], item["utility"])
                anomalies.append(_format_anomaly(item, value))
    else:
        traffic_mean = statistics.mean(item["traffic"] for item in history)
        traffic_stdev = statistics.stdev(item["traffic"] for item in history)
        for item in history:
            if item["traffic"] > traffic_mean + 1.8 * traffic_stdev:
                anomalies.append(_format_anomaly(item, item["traffic"]))

    return anomalies[-14:]


def _format_anomaly(item, value):
    severity = "critical" if value > 1900 else "high" if value > 1500 else "medium"
    metric = "traffic" if item["traffic"] >= item["utility"] else "utility"
    return {
        "timestamp": item["timestamp"],
        "metric": metric,
        "value": round(value, 1),
        "severity": severity,
        "reason": "Isolation Forest flagged an unusual demand spike",
    }
