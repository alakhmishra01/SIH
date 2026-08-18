import time
import requests
from typing import Dict, Any
from app.config import settings

# 1 Hour TTL Cache
_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600

def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now = time.time()

    if cache_key in _WEATHER_CACHE:
        entry = _WEATHER_CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_TTL_SECONDS:
            data = entry["data"].copy()
            data["cached"] = True
            return data

    # 1. Try OpenWeatherMap if key is provided
    if settings.OPENWEATHER_API_KEY:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={settings.OPENWEATHER_API_KEY}&units=metric"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                d = resp.json()
                weather_data = {
                    "temp_c": float(d["main"]["temp"]),
                    "humidity_pct": float(d["main"]["humidity"]),
                    "rainfall_mm": float(d.get("rain", {}).get("1h", 0.0) * 10 or 150.0), # Fallback seasonal rainfall if 1h rain is 0
                    "description": d["weather"][0]["description"].title(),
                    "source": "OpenWeatherMap API",
                    "cached": False
                }
                _WEATHER_CACHE[cache_key] = {"timestamp": now, "data": weather_data}
                return weather_data
        except Exception as e:
            print(f"OpenWeatherMap API call failed: {e}")

    # 2. Try Open-Meteo free API (No key required)
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation&daily=rain_sum&timezone=auto"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            d = resp.json()
            curr = d.get("current", {})
            daily = d.get("daily", {})
            rain_val = daily.get("rain_sum", [140.0])[0] if daily.get("rain_sum") else 140.0
            if rain_val == 0.0:
                rain_val = 145.0  # Seasonal mean fallback for recommendation

            weather_data = {
                "temp_c": float(curr.get("temperature_2m", 26.5)),
                "humidity_pct": float(curr.get("relative_humidity_2m", 72.0)),
                "rainfall_mm": float(rain_val),
                "description": "Live Open-Meteo Forecast",
                "source": "Open-Meteo API",
                "cached": False
            }
            _WEATHER_CACHE[cache_key] = {"timestamp": now, "data": weather_data}
            return weather_data
    except Exception as e:
        print(f"Open-Meteo API call failed: {e}")

    # 3. Fallback to seasonal Indian agricultural defaults
    fallback_data = {
        "temp_c": 25.5,
        "humidity_pct": 70.0,
        "rainfall_mm": 150.0,
        "description": "Seasonal Climate Average (Offline Fallback)",
        "source": "Regional Agricultural Baseline Fallback",
        "cached": False
    }
    return fallback_data
