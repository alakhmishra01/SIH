import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.models.schemas import (
    CropRecommendRequest, CropRecommendResponse,
    YieldPredictRequest, YieldPredictResponse,
    AdvisoryResponse, WeatherResponse, SoilResponse, HistoryResponse
)
from app.services.ml_service import ml_service
from app.services.weather_service import get_weather_data
from app.services.soil_service import get_soil_data
from app.services.advisory_engine import generate_advisory
from app.database import get_db
from app.models.db import PredictionHistory

router = APIRouter()

@router.post("/recommend-crop", response_model=CropRecommendResponse)
def recommend_crop(req: CropRecommendRequest, db: Session = Depends(get_db)):
    weather = get_weather_data(req.lat, req.lon, sowing_date_str=req.sowing_date)
    soil = get_soil_data(req.lat, req.lon)

    # Use cumulative seasonal rainfall (or user-specified seasonal override)
    rainfall = req.rainfall_override if req.rainfall_override is not None else weather["rainfall_seasonal_mm"]

    recommendations = ml_service.predict_crop_recommendation(
        N=req.N,
        P=req.P,
        K=req.K,
        temp=weather["temp_c"],
        humidity=weather["humidity_pct"],
        ph=req.ph,
        rainfall=rainfall,
        lat=req.lat,
        lon=req.lon,
        season=req.season or "Kharif",
        clay_pct=soil.get("clay_pct", 28.0)
    )

    advisory_flags = []
    if soil.get("clay_pct", 0) >= 38.0:
        advisory_flags.append(f"Heavy Vertisol clay soil ({soil['clay_pct']:.1f}% clay) detected. High water holding capacity; cucurbits/dry-season crops suppressed during monsoon.")
    if rainfall >= 1000.0:
        advisory_flags.append(f"High cumulative seasonal precipitation ({rainfall:.0f} mm). Prioritizes water-resilient Kharif crops.")

    response_data = {
        "recommendations": recommendations,
        "soil_summary": {"N": req.N, "P": req.P, "K": req.K, "ph": req.ph, **soil},
        "weather_summary": {**weather, "rainfall_used_mm": rainfall},
        "agronomic_advisory_flags": advisory_flags
    }

    # Save to history DB if session_id provided
    if req.session_id:
        try:
            record = PredictionHistory(
                session_id=req.session_id,
                type="recommendation",
                input_data=json.dumps(req.model_dump()),
                result_data=json.dumps(response_data)
            )
            db.add(record)
            db.commit()
        except Exception as e:
            print(f"Failed to persist history record: {e}")

    return response_data


@router.post("/predict-yield", response_model=YieldPredictResponse)
def predict_yield(req: YieldPredictRequest, db: Session = Depends(get_db)):
    weather = get_weather_data(req.lat, req.lon, sowing_date_str=req.sowing_date)
    soil = get_soil_data(req.lat, req.lon)

    response_data = ml_service.predict_crop_yield(
        crop=req.crop,
        state=req.state or "Madhya Pradesh",
        season=req.season or "Kharif",
        area_ha=req.area_ha,
        rainfall=weather["rainfall_seasonal_mm"],
        lat=req.lat,
        lon=req.lon,
        fertilizer_kg=req.fertilizer_kg,
        pesticide_kg=req.pesticide_kg
    )

    if req.session_id:
        try:
            record = PredictionHistory(
                session_id=req.session_id,
                type="yield_prediction",
                input_data=json.dumps(req.model_dump()),
                result_data=json.dumps(response_data)
            )
            db.add(record)
            db.commit()
        except Exception as e:
            print(f"Failed to persist history record: {e}")

    return response_data


@router.get("/advisory", response_model=AdvisoryResponse)
def get_advisory(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    crop: Optional[str] = Query(None, description="Optional crop name")
):
    weather = get_weather_data(lat, lon)
    soil = get_soil_data(lat, lon)
    weather["lat"] = lat
    weather["lon"] = lon

    return generate_advisory(weather=weather, soil=soil, crop=crop)


@router.get("/weather", response_model=WeatherResponse)
def get_weather(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    sowing_date: Optional[str] = Query(None)
):
    return get_weather_data(lat, lon, sowing_date_str=sowing_date)


@router.get("/soil", response_model=SoilResponse)
def get_soil(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    return get_soil_data(lat, lon)


@router.get("/history", response_model=HistoryResponse)
def get_history(session_id: str = Query(...), db: Session = Depends(get_db)):
    records = db.query(PredictionHistory).filter(PredictionHistory.session_id == session_id).order_by(PredictionHistory.created_at.desc()).all()

    formatted_records = []
    for r in records:
        try:
            formatted_records.append({
                "id": r.id,
                "session_id": r.session_id,
                "type": r.type,
                "created_at": r.created_at.isoformat() if r.created_at else "",
                "input_data": json.loads(r.input_data) if r.input_data else {},
                "result_data": json.loads(r.result_data) if r.result_data else {}
            })
        except Exception:
            continue

    return {
        "session_id": session_id,
        "records": formatted_records
    }
