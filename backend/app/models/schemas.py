from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any

# Crop Recommendation Schemas
class CropRecommendRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude of field location in degrees")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude of field location in degrees")
    N: float = Field(..., ge=10.0, le=300.0, description="Available Soil Nitrogen content (10 - 300 kg/ha)")
    P: float = Field(..., ge=5.0, le=150.0, description="Available Soil Phosphorus content (5 - 150 kg/ha)")
    K: float = Field(..., ge=5.0, le=200.0, description="Available Soil Potassium content (5 - 200 kg/ha)")
    ph: float = Field(..., ge=4.5, le=9.0, description="Soil pH in water (4.5 - 9.0)")
    rainfall_override: Optional[float] = Field(None, ge=50.0, le=4000.0, description="Cumulative seasonal rainfall override in mm (50 - 4000 mm)")
    sowing_date: Optional[str] = Field(None, description="Planned sowing date (YYYY-MM-DD) for climate window alignment")
    season: Optional[str] = Field(None, description="Target season (Kharif, Rabi, Summer/Zaid, Whole Year)")
    session_id: Optional[str] = Field(None, description="Client session UUID")

    @field_validator("N", "P", "K", "ph", mode="before")
    @classmethod
    def validate_non_null(cls, v, info):
        if v is None:
            raise ValueError(f"Field '{info.field_name}' cannot be empty or null.")
        try:
            val = float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Field '{info.field_name}' must be a valid number.")
        return val

class RecommendedCrop(BaseModel):
    crop: str
    confidence: float  # Calibrated probability percentage (0 - 100)
    rank: int
    agro_suitability: str = "Optimal"  # Optimal, Moderate, Seasonality Warning
    suitability_notes: Optional[str] = None
    feature_contributions: Optional[Dict[str, float]] = None

class CropRecommendResponse(BaseModel):
    recommendations: List[RecommendedCrop]
    soil_summary: Dict[str, Any]
    weather_summary: Dict[str, Any]
    agronomic_advisory_flags: List[str] = []

# Yield Prediction Schemas
class YieldPredictRequest(BaseModel):
    crop: str = Field(..., min_length=2, description="Target crop name")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude")
    sowing_date: str = Field(..., description="ISO Date string (YYYY-MM-DD)")
    area_ha: float = Field(..., ge=0.05, le=10000.0, description="Farm area in hectares (min 0.05 ha)")
    state: Optional[str] = Field("Madhya Pradesh", description="State / Region for regional baseline")
    season: Optional[str] = Field("Kharif", description="Crop season (Kharif, Rabi, Summer, Whole Year)")
    fertilizer_kg: Optional[float] = Field(None, ge=0.0, description="Total fertilizer application in kg")
    pesticide_kg: Optional[float] = Field(None, ge=0.0, description="Total pesticide application in kg")
    session_id: Optional[str] = Field(None, description="Client session UUID")

class FactorImportance(BaseModel):
    factor: str
    importance_pct: float
    impact_direction: str = "positive"  # positive | negative | neutral
    description: str

class YieldPredictResponse(BaseModel):
    crop: str
    predicted_yield_t_ha: float
    confidence_range: Dict[str, float]  # {"min_t_ha": float, "max_t_ha": float}
    total_production_t: float
    top_factors: List[FactorImportance]
    model_disclaimer: str
    agro_zone_context: Optional[str] = None

# Advisory Schemas
class AdvisoryMessage(BaseModel):
    category: str  # Weather Alert, Irrigation, Drainage, Soil Health, Crop Protection
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
    temp_min_c: float
    temp_max_c: float
    humidity_pct: float
    rainfall_mm: float
    rainfall_seasonal_mm: float
    solar_radiation_mj: float
    description: str
    cached: bool
    source: str

class SoilResponse(BaseModel):
    ph: float
    clay_pct: float
    sand_pct: float
    silt_pct: float
    organic_matter_pct: float
    soil_texture_class: str
    estimated_N: float
    estimated_P: float
    estimated_K: float
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
