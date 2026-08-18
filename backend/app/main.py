from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.endpoints import router as api_router

# Initialize DB tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Smart Crop Advisory & Yield Prediction System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs"
    }
