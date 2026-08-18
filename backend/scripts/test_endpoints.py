from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=========================================")
    print("   Testing FastAPI Backend Endpoints     ")
    print("=========================================\n")

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("✅ Root endpoint response:", res.json())

    # 2. Test /api/recommend-crop with 3 sample inputs
    sample_recs = [
        {"lat": 26.14, "lon": 91.73, "N": 90, "P": 42, "K": 43, "ph": 6.5, "session_id": "test_sess_001"},
        {"lat": 18.52, "lon": 73.85, "N": 20, "P": 70, "K": 80, "ph": 7.2, "session_id": "test_sess_001"},
        {"lat": 28.61, "lon": 77.20, "N": 120, "P": 35, "K": 30, "ph": 6.0, "rainfall_override": 210.5, "session_id": "test_sess_002"}
    ]

    print("\n--- 2. Testing /api/recommend-crop ---")
    for i, payload in enumerate(sample_recs, 1):
        res = client.post("/api/recommend-crop", json=payload)
        assert res.status_code == 200, f"Recommend crop #{i} failed: {res.text}"
        data = res.json()
        print(f"Sample #{i} (N={payload['N']}, P={payload['P']}, K={payload['K']}) Top Recommendation:")
        for r in data["recommendations"]:
            print(f"   #{r['rank']}: {r['crop']} ({r['confidence']}%)")

    # 3. Test /api/predict-yield with 3 sample inputs
    sample_yields = [
        {"crop": "Rice", "lat": 26.14, "lon": 91.73, "sowing_date": "2024-06-15", "area_ha": 2.5, "state": "Assam", "session_id": "test_sess_001"},
        {"crop": "Cotton", "lat": 18.52, "lon": 73.85, "sowing_date": "2024-05-10", "area_ha": 5.0, "state": "Maharashtra", "session_id": "test_sess_001"},
        {"crop": "Maize", "lat": 28.61, "lon": 77.20, "sowing_date": "2024-07-01", "area_ha": 1.2, "state": "Punjab", "session_id": "test_sess_002"}
    ]

    print("\n--- 3. Testing /api/predict-yield ---")
    for i, payload in enumerate(sample_yields, 1):
        res = client.post("/api/predict-yield", json=payload)
        assert res.status_code == 200, f"Predict yield #{i} failed: {res.text}"
        data = res.json()
        print(f"Sample #{i} ({payload['crop']}, {payload['area_ha']} ha in {payload['state']}):")
        print(f"   Predicted Yield: {data['predicted_yield_t_ha']} t/ha (Range: {data['confidence_range']['min_t_ha']} - {data['confidence_range']['max_t_ha']} t/ha)")
        print(f"   Total Production: {data['total_production_t']} tonnes")

    # 4. Test /api/weather
    print("\n--- 4. Testing /api/weather ---")
    res = client.get("/api/weather?lat=26.14&lon=91.73")
    assert res.status_code == 200
    print("✅ Weather Response:", res.json())

    # 5. Test /api/soil
    print("\n--- 5. Testing /api/soil ---")
    res = client.get("/api/soil?lat=26.14&lon=91.73")
    assert res.status_code == 200
    print("✅ Soil Response:", res.json())

    # 6. Test /api/advisory
    print("\n--- 6. Testing /api/advisory ---")
    res = client.get("/api/advisory?lat=26.14&lon=91.73&crop=Rice")
    assert res.status_code == 200
    adv = res.json()
    print(f"✅ Advisory Status: {adv['status'].upper()}")
    for m in adv['messages']:
        print(f"   - [{m['severity'].upper()}] {m['title']}: {m['action_item']}")

    # 7. Test /api/history
    print("\n--- 7. Testing /api/history ---")
    res = client.get("/api/history?session_id=test_sess_001")
    assert res.status_code == 200
    hist = res.json()
    print(f"✅ History retrieved for session test_sess_001: {len(hist['records'])} records found.")

    print("\n=========================================")
    print("   ALL BACKEND API TESTS PASSED 100%!    ")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
