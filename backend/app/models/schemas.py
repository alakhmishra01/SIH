from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Crop Recommendation Schemas
class CropRecommendRequest(BaseModel):
    lat: float = Field(..., description="Latitude of field location")
    lon: float = Field(..., description="Longitude of field location")
    N: float = Field(..., ge=0, le=200, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=0, le=200, description="Potassium content (kg/ha)")
    ph: float = Field(..., ge=3.0, le=11.0, description="Soil pH")
    rainfall_override: Optional[float] = Field(None, description="Optional custom rainfall override in mm")
    session_id: Optional[str] = Field(None, description="Client session UUID")

class RecommendedCrop(BaseModel):
    crop: str
    confidence: float  # Percentage 0 - 100
    rank: int

class CropRecommendResponse(BaseModel):
    recommendations: List[RecommendedCrop]
    soil_summary: Dict[str, Any]
    weather_summary: Dict[str, Any]

# Yield Prediction Schemas
class YieldPredictRequest(BaseModel):
    crop: str = Field(..., description="Selected crop name")
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")
    sowing_date: str = Field(..., description="ISO Date string (YYYY-MM-DD)")
    area_ha: float = Field(..., gt=0, description="Farm area in hectares")
    state: Optional[str] = Field("Assam", description="State name for yield baseline context")
    season: Optional[str] = Field("Kharif", description="Crop season (Kharif, Rabi, Whole Year, etc.)")
    session_id: Optional[str] = Field(None, description="Client session UUID")

class FactorImportance(BaseModel):
    factor: str
    importance_pct: float
    description: str

class YieldPredictResponse(BaseModel):
    crop: str
    predicted_yield_t_ha: float
    confidence_range: Dict[str, float]  # e.g., {"min_t_ha": 3.8, "max_t_ha": 4.4}
    total_production_t: float
    top_factors: List[FactorImportance]
    model_disclaimer: str

# Advisory Schemas
class AdvisoryMessage(BaseModel):
    category: str  # Weather, Irrigation, Soil, Pests
    severity: str  # healthy | warning | critical
    title: str
    action_item: str

class AdvisoryResponse(BaseModel):
    status: str  # healthy | warning | critical
    crop: Optional[str]
    location: Dict[str, float]
    messages: List[AdvisoryMessage]
    weather_snapshot: Dict[str, Any]
    soil_snapshot: Dict[str, Any]

# Weather & Soil Schemas
class WeatherResponse(BaseModel):
    temp_c: float
    humidity_pct: float
    rainfall_mm: float
    description: str
    cached: bool
    source: str

class SoilResponse(BaseModel):
    ph: float
    clay_pct: float
    sand_pct: float
    silt_pct: float
    organic_matter_pct: float
    cached: bool
    source: str

# History Schemas
class HistoryItem(BaseModel):
    id: int
    session_id: str
    type: str  # 'recommendation' | 'yield_prediction'
    created_at: str
    input_data: Dict[str, Any]
    result_data: Dict[str, Any]

class HistoryResponse(BaseModel):
    session_id: str
    records: List[HistoryItem]
