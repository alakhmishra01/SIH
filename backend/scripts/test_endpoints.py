import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=================================================================")
    print("      RUNNING FIELD LEDGER AGRONOMIC & ML PIPELINE TESTS         ")
    print("=================================================================\n")

    # TEST 1: Root & Health Check
    print("TEST 1: API Service Health Check")
    resp = client.get("/")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    print("✓ Health Check Passed:", resp.json())

    # TEST 2: Weather Climate Normals Endpoint (Bhopal 23.2147°N, 77.3978°E)
    print("\nTEST 2: Weather & Climate Normals Query (Bhopal, MP)")
    resp = client.get("/api/weather?lat=23.2147&lon=77.3978")
    assert resp.status_code == 200
    w_data = resp.json()
    print(f"✓ Temp: {w_data['temp_c']}°C (Min: {w_data['temp_min_c']}°C, Max: {w_data['temp_max_c']}°C)")
    print(f"✓ Humidity: {w_data['humidity_pct']}%, Seasonal Rainfall: {w_data['rainfall_seasonal_mm']} mm")
    print(f"✓ Solar Radiation: {w_data['solar_radiation_mj']} MJ/m²/day")
    assert w_data['rainfall_seasonal_mm'] >= 50.0, "Seasonal rainfall should be >= 50 mm"

    # TEST 3: Soil Physical & Chemical Properties Endpoint
    print("\nTEST 3: SoilGrids v2 Texture & Organic Carbon Query")
    resp = client.get("/api/soil?lat=23.2147&lon=77.3978")
    assert resp.status_code == 200
    s_data = resp.json()
    print(f"✓ Soil Texture Class: {s_data['soil_texture_class']}")
    print(f"✓ Clay: {s_data['clay_pct']}%, Sand: {s_data['sand_pct']}%, Silt: {s_data['silt_pct']}%")
    print(f"✓ pH: {s_data['ph']}, SOC: {s_data['organic_matter_pct']}%")
    print(f"✓ Estimated N-P-K: {s_data['estimated_N']} - {s_data['estimated_P']} - {s_data['estimated_K']} kg/ha")
    assert s_data['ph'] >= 4.5 and s_data['ph'] <= 9.0

    # TEST 4: Pydantic Validation Guardrail (Null/Empty N test)
    print("\nTEST 4: Strict Pydantic Validation (Null/Out-of-Range N value)")
    bad_payload = {
        "lat": 23.2147,
        "lon": 77.3978,
        "N": None,  # Null test
        "P": 42.0,
        "K": 43.0,
        "ph": 6.5
    }
    resp = client.post("/api/recommend-crop", json=bad_payload)
    assert resp.status_code == 422, f"Expected 422 for null N, got {resp.status_code}"
    print("✓ Successfully blocked null Nitrogen with HTTP 422 error:", resp.json()["detail"][0]["msg"])

    # TEST 5: Crop Recommendation with Agro-Climatic Seasonality Filter
    print("\nTEST 5: Crop Recommendation with Central India Vertisol Seasonality Filter")
    rec_payload = {
        "lat": 23.2147,
        "lon": 77.3978,
        "N": 80.0,
        "P": 45.0,
        "K": 50.0,
        "ph": 7.2,
        "season": "Kharif",
        "sowing_date": "2026-08-19"
    }
    resp = client.post("/api/recommend-crop", json=rec_payload)
    assert resp.status_code == 200
    rec_data = resp.json()
    print("✓ Top 3 Calibrated Recommendations:")
    for rec in rec_data["recommendations"]:
        print(f"   - Rank {rec['rank']}: {rec['crop']} ({rec['confidence']}% confidence) [Status: {rec['agro_suitability']}]")
        if rec.get("suitability_notes"):
            print(f"     Note: {rec['suitability_notes'][:90]}...")
    if rec_data.get("agronomic_advisory_flags"):
        print("✓ Advisory Flags:", rec_data["agronomic_advisory_flags"])

    # TEST 6: Yield Prediction on Unsupported Horticulture Crop (Muskmelon)
    print("\nTEST 6: Yield Forecast Dispatcher for Unsupported Crop (Muskmelon)")
    musk_payload = {
        "crop": "Muskmelon",
        "lat": 23.2147,
        "lon": 77.3978,
        "sowing_date": "2026-08-19",
        "area_ha": 2.0,
        "state": "Madhya Pradesh",
        "season": "Kharif"
    }
    resp = client.post("/api/predict-yield", json=musk_payload)
    assert resp.status_code == 422, f"Expected 422 for Muskmelon, got {resp.status_code}"
    err_detail = resp.json()["detail"]
    print(f"✓ Clean rejection of uncalibrated crop (Error: {err_detail.get('error_code')}):")
    print(f"  Message: {err_detail.get('message')[:100]}...")

    # TEST 7: Valid Yield Prediction (Soyabean / Rice in MP)
    print("\nTEST 7: Valid Yield Prediction Pipeline (Soyabean in Madhya Pradesh)")
    soya_payload = {
        "crop": "Soyabean",
        "lat": 23.2147,
        "lon": 77.3978,
        "sowing_date": "2026-08-19",
        "area_ha": 3.0,
        "state": "Madhya Pradesh",
        "season": "Kharif"
    }
    resp = client.post("/api/predict-yield", json=soya_payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    yield_data = resp.json()
    print(f"✓ Crop Model Executed: {yield_data['crop']}")
    print(f"✓ Predicted Yield: {yield_data['predicted_yield_t_ha']} t/ha (Range: {yield_data['confidence_range']['min_t_ha']} - {yield_data['confidence_range']['max_t_ha']} t/ha)")
    print(f"✓ Total Production: {yield_data['total_production_t']} tonnes ({soya_payload['area_ha']} ha)")
    print("✓ Dynamic Tree-SHAP Feature Drivers:")
    for f in yield_data["top_factors"]:
        print(f"   - {f['factor']}: {f['importance_pct']}% impact")

    # TEST 8: Real-Time Field Advisory Engine
    print("\nTEST 8: Field Advisory Rule Engine (Bhopal, MP / Soyabean)")
    resp = client.get("/api/advisory?lat=23.2147&lon=77.3978&crop=Soyabean")
    assert resp.status_code == 200
    adv_data = resp.json()
    print(f"✓ Overall Advisory Status: {adv_data['status'].upper()}")
    for msg in adv_data["messages"]:
        print(f"   [{msg['severity'].upper()}] {msg['title']}: {msg['action_item'][:90]}...")

    print("\n=================================================================")
    print("        ALL 8 AGRONOMIC & ML PIPELINE TESTS PASSED!              ")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
