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
    weather = get_weather_data(req.lat, req.lon)
    soil = get_soil_data(req.lat, req.lon)

    rainfall = req.rainfall_override if req.rainfall_override is not None else weather["rainfall_mm"]

    recommendations = ml_service.predict_crop_recommendation(
        N=req.N,
        P=req.P,
        K=req.K,
        temp=weather["temp_c"],
        humidity=weather["humidity_pct"],
        ph=req.ph,
        rainfall=rainfall
    )

    response_data = {
        "recommendations": recommendations,
        "soil_summary": {"N": req.N, "P": req.P, "K": req.K, "ph": req.ph, **soil},
        "weather_summary": {**weather, "rainfall_used_mm": rainfall}
    }

    # Save to history DB if session_id provided
    if req.session_id:
        record = PredictionHistory(
            session_id=req.session_id,
            type="recommendation",
            input_data=json.dumps(req.model_dump()),
            result_data=json.dumps(response_data)
        )
        db.add(record)
        db.commit()

    return response_data


@router.post("/predict-yield", response_model=YieldPredictResponse)
def predict_yield(req: YieldPredictRequest, db: Session = Depends(get_db)):
    weather = get_weather_data(req.lat, req.lon)

    response_data = ml_service.predict_crop_yield(
        crop=req.crop,
        state=req.state or "Assam",
        season=req.season or "Kharif",
        area_ha=req.area_ha,
        rainfall=weather["rainfall_mm"]
    )

    if req.session_id:
        record = PredictionHistory(
            session_id=req.session_id,
            type="yield_prediction",
            input_data=json.dumps(req.model_dump()),
            result_data=json.dumps(response_data)
        )
        db.add(record)
        db.commit()

    return response_data


@router.get("/advisory", response_model=AdvisoryResponse)
def get_advisory(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    crop: Optional[str] = Query(None, description="Optional crop name")
):
    weather = get_weather_data(lat, lon)
    soil = get_soil_data(lat, lon)
    weather["lat"] = lat
    weather["lon"] = lon

    return generate_advisory(weather=weather, soil=soil, crop=crop)


@router.get("/weather", response_model=WeatherResponse)
def get_weather(lat: float = Query(...), lon: float = Query(...)):
    return get_weather_data(lat, lon)


@router.get("/soil", response_model=SoilResponse)
def get_soil(lat: float = Query(...), lon: float = Query(...)):
    return get_soil_data(lat, lon)


@router.get("/history", response_model=HistoryResponse)
def get_history(session_id: str = Query(...), db: Session = Depends(get_db)):
    records = db.query(PredictionHistory).filter(PredictionHistory.session_id == session_id).order_by(PredictionHistory.created_at.desc()).all()

    formatted_records = []
    for r in records:
        formatted_records.append({
            "id": r.id,
            "session_id": r.session_id,
            "type": r.type,
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "input_data": json.loads(r.input_data) if r.input_data else {},
            "result_data": json.loads(r.result_data) if r.result_data else {}
        })

    return {
        "session_id": session_id,
        "records": formatted_records
    }
