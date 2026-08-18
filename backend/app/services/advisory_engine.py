from typing import Dict, Any, List

def generate_advisory(
    weather: Dict[str, Any], soil: Dict[str, Any], crop: str = None
) -> Dict[str, Any]:
    messages = []
    has_critical = False
    has_warning = False

    temp = weather.get("temp_c", 25.0)
    humidity = weather.get("humidity_pct", 70.0)
    rainfall = weather.get("rainfall_mm", 150.0)
    ph = soil.get("ph", 6.5)
    organic_matter = soil.get("organic_matter_pct", 1.0)
    clay = soil.get("clay_pct", 25.0)

    # 1. Temperature & Heat Stress Checks
    if temp > 38.0:
        has_critical = True
        messages.append({
            "category": "Weather Alert",
            "severity": "critical",
            "title": "Severe Heat Stress Warning (>38°C)",
            "action_item": "Provide emergency light irrigation during early morning or evening to reduce crop canopy temperature."
        })
    elif temp > 33.0:
        has_warning = True
        messages.append({
            "category": "Weather Alert",
            "severity": "warning",
            "title": "High Heat Stress Warning (>33°C)",
            "action_item": "Monitor field moisture levels closely. Apply mulching to retain soil moisture."
        })
    elif temp < 10.0:
        has_warning = True
        messages.append({
            "category": "Weather Alert",
            "severity": "warning",
            "title": "Low Temperature / Cold Stress (<10°C)",
            "action_item": "Avoid heavy nitrogen application during cold spells to prevent root tissue damage."
        })

    # 2. Moisture & Irrigation Rules
    if humidity < 40.0 and rainfall < 50.0:
        has_critical = True
        messages.append({
            "category": "Irrigation",
            "severity": "critical",
            "title": "Low Soil & Canopy Moisture Deficit",
            "action_item": "Immediate irrigation recommended within 48 hours to prevent wilting and yield reduction."
        })
    elif rainfall < 80.0:
        has_warning = True
        messages.append({
            "category": "Irrigation",
            "severity": "warning",
            "title": "Moderate Moisture Deficiency Forecast",
            "action_item": "Schedule field irrigation within 3-5 days. Check drip/sprinkler lines."
        })
    elif rainfall > 300.0:
        has_warning = True
        messages.append({
            "category": "Drainage",
            "severity": "warning",
            "title": "Excess Rainfall & Waterlogging Risk",
            "action_item": "Ensure field drainage channels are clear to prevent water stagnation around root zones."
        })

    # 3. Soil pH & Nutrient Rules
    if ph < 5.5:
        has_warning = True
        messages.append({
            "category": "Soil Condition",
            "severity": "warning",
            "title": "Acidic Soil Condition (pH < 5.5)",
            "action_item": "Apply agricultural lime (calcium carbonate) at 200-300 kg/ha to raise soil pH for optimal nutrient uptake."
        })
    elif ph > 8.2:
        has_warning = True
        messages.append({
            "category": "Soil Condition",
            "severity": "warning",
            "title": "Alkaline / Saline Soil Condition (pH > 8.2)",
            "action_item": "Apply agricultural gypsum or elemental sulfur to improve soil structure and reduce alkalinity."
        })

    # 4. Organic Matter & Soil Structure
    if organic_matter < 0.75:
        messages.append({
            "category": "Soil Health",
            "severity": "warning",
            "title": "Low Organic Carbon Content (<0.75%)",
            "action_item": "Incorporate farmyard manure (FYM) or compost at 5 tonnes/ha prior to sowing to improve soil organic carbon."
        })

    # Default healthy message if no critical or warning flags
    if not messages:
        messages.append({
            "category": "Field Status",
            "severity": "healthy",
            "title": "Optimal Field & Environmental Conditions",
            "action_item": "All weather and soil parameters are within healthy agronomic ranges for crop development."
        })

    status = "critical" if has_critical else ("warning" if has_warning else "healthy")

    return {
        "status": status,
        "crop": crop,
        "location": {"lat": weather.get("lat", 0.0), "lon": weather.get("lon", 0.0)},
        "messages": messages,
        "weather_snapshot": weather,
        "soil_snapshot": soil
    }
