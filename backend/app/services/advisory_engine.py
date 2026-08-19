from typing import Dict, Any, List

def generate_advisory(
    weather: Dict[str, Any], soil: Dict[str, Any], crop: str = None
) -> Dict[str, Any]:
    """
    Generates domain-grounded agronomic advisories by combining meteorological forecasts,
    ISRIC soil physical/chemical properties, and crop physiological requirements.
    """
    messages = []
    has_critical = False
    has_warning = False

    temp = weather.get("temp_c", 26.5)
    temp_max = weather.get("temp_max_c", temp + 4.0)
    humidity = weather.get("humidity_pct", 72.0)
    seasonal_rain = weather.get("rainfall_seasonal_mm", weather.get("rainfall_mm", 850.0))
    solar_rad = weather.get("solar_radiation_mj", 18.5)

    ph = soil.get("ph", 6.8)
    organic_matter = soil.get("organic_matter_pct", 0.9)
    clay = soil.get("clay_pct", 28.0)
    texture_class = soil.get("soil_texture_class", "Medium Loam")

    clean_crop = crop.strip().lower() if crop else ""

    # 1. Thermal & Solar Radiation Stress Alerts
    if temp_max >= 39.0:
        has_critical = True
        messages.append({
            "category": "Weather Alert",
            "severity": "critical",
            "title": f"Extreme Heatwave Alert (Max {temp_max:.1f}°C)",
            "action_item": "Provide emergency micro-irrigation during early morning/evening hours to prevent pollen sterility, blossom drop, and canopy scorch."
        })
    elif temp_max >= 34.0:
        has_warning = True
        messages.append({
            "category": "Weather Alert",
            "severity": "warning",
            "title": f"High Thermal Stress (Max {temp_max:.1f}°C)",
            "action_item": "Apply straw or organic mulch across crop rows to lower root-zone temperature and reduce soil evaporation."
        })
    elif temp <= 10.0:
        has_warning = True
        messages.append({
            "category": "Weather Alert",
            "severity": "warning",
            "title": f"Low Temperature & Cold Stress ({temp:.1f}°C)",
            "action_item": "Halt heavy nitrate-nitrogen top dressing to avoid root cellular shock during low night temperatures."
        })

    # 2. Moisture, Precipitation & Vertisol Soil Drainage
    if clay >= 38.0:
        if seasonal_rain >= 800.0:
            has_warning = True
            messages.append({
                "category": "Drainage & Soil Management",
                "severity": "warning",
                "title": f"Vertisol Heavy Clay Waterlogging Risk (Clay: {clay:.1f}%)",
                "action_item": "Construct Broad Bed and Furrow (BBF) drainage channels. Heavy black cotton soils swell and hold excess water, creating anaerobic root rot conditions for shallow-rooted crops."
            })
        else:
            messages.append({
                "category": "Soil Physical Management",
                "severity": "healthy",
                "title": f"High Water-Holding Capacity Vertisol (Clay: {clay:.1f}%)",
                "action_item": "Black clay profile maintains sub-surface moisture reserves, enabling sustained crop growth between dry spells."
            })

    # 3. Moisture Deficit & Irrigation Needs
    if seasonal_rain < 400.0 and humidity < 50.0:
        has_critical = True
        messages.append({
            "category": "Irrigation Deficit",
            "severity": "critical",
            "title": "Severe Moisture Deficit Forecast (<400 mm)",
            "action_item": "Adopt pressurized drip/sprinkler irrigation immediately. Prioritize drought-hardy crops (Millets, Pulses, Sorghum) over high water-demand crops."
        })
    elif seasonal_rain < 650.0:
        has_warning = True
        messages.append({
            "category": "Irrigation Deficit",
            "severity": "warning",
            "title": "Moderate Seasonal Moisture Index",
            "action_item": "Plan critical stage irrigation (flowering and pod/grain formation). Ensure rainwater harvesting ponds are operational."
        })

    # 4. Crop Specific Agronomic Incompatibility & Pest Warnings
    if clean_crop in ["muskmelon", "watermelon"]:
        if seasonal_rain > 500.0 or clay >= 35.0:
            has_critical = True
            messages.append({
                "category": "Crop Protection & Pathology",
                "severity": "critical",
                "title": f"High Pathogen & Waterlogging Risk for {crop}",
                "action_item": "Muskmelon/Watermelon are prone to Pythium damping-off and downy mildew under humid monsoon conditions and clay soil. Switch to raised beds with plastic mulch or shift sowing to the dry Zaid season (Feb-April)."
            })
    elif clean_crop in ["rice", "paddy"]:
        if seasonal_rain < 600.0 and clay < 25.0:
            has_warning = True
            messages.append({
                "category": "Irrigation Requirement",
                "severity": "warning",
                "title": "High Water Requirement for Paddy",
                "action_item": "Direct Seeded Rice (DSR) or Alternate Wetting and Drying (AWD) is recommended to conserve up to 30% irrigation water in light soils."
            })
    elif clean_crop in ["cotton", "cotton(lint)"]:
        if humidity > 75.0 and temp > 28.0:
            has_warning = True
            messages.append({
                "category": "Pest & Disease Advisory",
                "severity": "warning",
                "title": "Bollworm & Sucking Pest Alert (Jassids/Whitefly)",
                "action_item": "Monitor yellow sticky traps (5 traps/acre) and install pheromone traps for pink bollworm. Apply neem-based formulation (Azadirachtin 1500 ppm) as preventive measure."
            })

    # 5. Soil Chemical Health & Organic Carbon Management
    if ph < 5.8:
        has_warning = True
        messages.append({
            "category": "Soil Chemistry",
            "severity": "warning",
            "title": f"Acidic Soil Profile (pH {ph:.1f})",
            "action_item": "Incorporate agricultural lime (CaCO₃) or dolomite at 250-400 kg/ha before final land preparation to restore cation exchange capacity."
        })
    elif ph > 8.0:
        has_warning = True
        messages.append({
            "category": "Soil Chemistry",
            "severity": "warning",
            "title": f"Alkaline / Calcareous Soil Profile (pH {ph:.1f})",
            "action_item": "Apply elemental sulfur or phospho-gypsum (200 kg/ha) along with zinc sulfate (25 kg/ha) to prevent iron and zinc chlorosis."
        })

    if organic_matter < 0.75:
        messages.append({
            "category": "Soil Organic Carbon",
            "severity": "warning",
            "title": f"Low Soil Organic Carbon ({organic_matter:.2f}%)",
            "action_item": "Incorporate well-decomposed Farm Yard Manure (FYM) or vermicompost at 4-6 tonnes/ha. Practice green manuring with Dhaincha (Sesbania) prior to sowing."
        })

    # Default healthy banner if no alerts
    if not messages:
        messages.append({
            "category": "Field Status",
            "severity": "healthy",
            "title": "Optimal Agro-Climatic & Edaphic Conditions",
            "action_item": "All climate normals, soil physical metrics, and pH indices align with ideal agronomic standards for balanced crop growth."
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
