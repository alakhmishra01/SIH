import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Crop Advisory & Yield Prediction System"
    API_V1_STR: str = "/api"
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.path.join(BASE_DIR, "data", "models")
    
    CROP_REC_MODEL_PATH: str = os.path.join(MODEL_DIR, "crop_recommendation_rf.pkl")
    CROP_YIELD_MODEL_PATH: str = os.path.join(MODEL_DIR, "crop_yield_rf.pkl")
    
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'agri_advisory.db')}"
    
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
