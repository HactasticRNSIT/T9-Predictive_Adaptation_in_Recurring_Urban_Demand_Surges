def vulnerability_score(population_density: int, baseline_traffic: int, baseline_utility: int) -> float:
    density_component = min(population_density / 36000, 1) * 42
    traffic_component = min(baseline_traffic / 1800, 1) * 34
    utility_component = min(baseline_utility / 1100, 1) * 24
    return round(density_component + traffic_component + utility_component, 1)


def classify_risk(score: float) -> str:
    if score >= 78:
        return "critical"
    if score >= 62:
        return "high"
    if score >= 44:
        return "elevated"
    return "stable"
