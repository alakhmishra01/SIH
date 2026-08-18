import time
import requests
from typing import Dict, Any

_SOIL_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600

def get_soil_data(lat: float, lon: float) -> Dict[str, Any]:
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now = time.time()

    if cache_key in _SOIL_CACHE:
        entry = _SOIL_CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_TTL_SECONDS:
            data = entry["data"].copy()
            data["cached"] = True
            return data

    # 1. Query SoilGrids REST API v2.0
    try:
        url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=phh2o&property=clay&property=sand&property=silt&property=soc&depth=0-5cm&value=mean"
        resp = requests.get(url, timeout=6)
        if resp.status_code == 200:
            d = resp.json()
            layers = d.get("properties", {}).get("layers", [])
            
            ph_val = 6.5
            clay_val = 25.0
            sand_val = 45.0
            silt_val = 30.0
            soc_val = 1.2

            for layer in layers:
                name = layer.get("name")
                depths = layer.get("depths", [])
                if depths:
                    val = depths[0].get("values", {}).get("mean")
                    if val is not None:
                        if name == "phh2o":
                            ph_val = round(val / 10.0, 1)  # SoilGrids pH is stored * 10
                        elif name == "clay":
                            clay_val = round(val / 10.0, 1)
                        elif name == "sand":
                            sand_val = round(val / 10.0, 1)
                        elif name == "silt":
                            silt_val = round(val / 10.0, 1)
                        elif name == "soc":
                            soc_val = round(val / 10.0, 2)

            soil_data = {
                "ph": ph_val,
                "clay_pct": clay_val,
                "sand_pct": sand_val,
                "silt_pct": silt_val,
                "organic_matter_pct": soc_val,
                "estimated_N": float(round(soc_val * 45 + 35, 1)),
                "estimated_P": float(round(ph_val * 6 + 15, 1)),
                "estimated_K": float(round(clay_val * 1.2 + 20, 1)),
                "source": "ISRIC SoilGrids v2.0 API",
                "cached": False
            }
            _SOIL_CACHE[cache_key] = {"timestamp": now, "data": soil_data}
            return soil_data
    except Exception as e:
        print(f"SoilGrids API call failed: {e}")

    # 2. Fallback to regional soil test averages
    fallback_data = {
        "ph": 6.5,
        "clay_pct": 28.0,
        "sand_pct": 42.0,
        "silt_pct": 30.0,
        "organic_matter_pct": 1.1,
        "estimated_N": 80.0,
        "estimated_P": 40.0,
        "estimated_K": 40.0,
        "source": "Indian Soil Health Card Regional Baseline (Fallback)",
        "cached": False
    }
    return fallback_data
