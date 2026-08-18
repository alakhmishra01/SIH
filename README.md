# Smart Crop Advisory & Yield Prediction System

A full-stack, software-only web application for Indian smallholder/SME farmers and agronomists. Given a location, soil test, crop, and sowing date, the system recommends optimal crops based on soil and climate conditions, predicts expected yield (t/ha) with confidence intervals and key driving factors, and delivers real-time agronomic advisories based on live weather (OpenWeatherMap / Open-Meteo) and soil data (ISRIC SoilGrids v2).

Styled using the **Field Ledger Design System** — inspired by an agronomist's working notebook.

---

## Repository Structure

```
/
├── backend/                  # Python FastAPI Backend
│   ├── app/                  # FastAPI Application Core
│   │   ├── api/              # Route Endpoints (/recommend-crop, /predict-yield, /advisory, /weather, /soil, /history)
│   │   ├── models/           # Pydantic Schemas & SQLAlchemy ORM Models
│   │   ├── services/         # ML Inference, Weather (OpenWeather/Open-Meteo), SoilGrids, Advisory Engine
│   │   ├── config.py         # App Configuration & Settings
│   │   ├── database.py       # SQLite Engine & Session Setup
│   │   └── main.py           # FastAPI Entry Point & CORS Setup
│   ├── data/
│   │   ├── raw/              # Downloaded Kaggle Datasets (Crop_recommendation.csv & crop_yield.csv)
│   │   └── models/           # Serialized Model Artifacts (.pkl)
│   ├── scripts/
│   │   ├── download_data.py  # Dataset downloader & inspector
│   │   ├── train_recommendation.py # Crop Classifier Training Script (Random Forest)
│   │   ├── train_yield.py   # Crop Yield Regressor Training Script (Random Forest Pipeline)
│   │   └── test_endpoints.py# End-to-end API test suite
│   ├── .env.example
│   ├── MODEL_CARD.md         # Model documentation, features, metrics & limitations
│   └── requirements.txt
└── frontend/                 # Next.js (App Router) Frontend
    ├── src/
    │   ├── app/              # Next.js Pages & Layout (Google Fonts: Fraunces, Public Sans, IBM Plex Mono)
    │   ├── components/       # Field Ledger Components (SoilHorizonStrip, Header, LocationSoilForm, etc.)
    │   └── lib/              # API Client & TypeScript Interfaces
    ├── .env.example
    ├── package.json
    └── tailwind.config.ts    # Configured with Field Ledger design tokens
```

---

## Key Features & Model Performance

1. **Crop Recommendation**: Multi-class Random Forest classifier trained on 2,200 Kaggle samples across 22 crops.
   - **Accuracy**: `99.55%`
2. **Yield Prediction**: Random Forest Regressor Pipeline trained on 19,689 Indian state-level crop yield records.
   - **R² Score**: `0.9801`
   - **MAE**: `9.47 t/ha`
3. **Live Weather & Soil Integration**:
   - OpenWeatherMap API with zero-config Open-Meteo fallback.
   - ISRIC SoilGrids v2 REST API (0-5cm depth).
   - 1-hour TTL in-memory caching.
4. **Agronomic Advisory Engine**: Rule-based warnings for heat stress, soil moisture deficit, pH acidity/alkalinity, and nitrogen management.
5. **SQLite Persistence**: Session history stored per client UUID in `agri_advisory.db`.

---

## Local Development & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download raw datasets and train ML models
python scripts/download_data.py
python scripts/train_recommendation.py
python scripts/train_yield.py

# Verify backend endpoints
PYTHONPATH=. python scripts/test_endpoints.py

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger docs will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run Next.js dev server
npx next dev -p 3000
```
Open `http://localhost:3000` in your browser.

---

## How to Retrain Models

To retrain the ML models on updated datasets:

```bash
cd backend
python scripts/download_data.py
python scripts/train_recommendation.py
python scripts/train_yield.py
```
New serialized `.pkl` payloads will be automatically saved to `backend/data/models/` and loaded by the FastAPI API on next restart.

---

## Deployment Instructions

### Deploy Backend (Render / Railway)
1. Set Root Directory to `backend`.
2. Build Command: `pip install -r requirements.txt && python scripts/download_data.py && python scripts/train_recommendation.py && python scripts/train_yield.py`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `OPENWEATHER_API_KEY` (optional)

### Deploy Frontend (Vercel)
1. Set Root Directory to `frontend`.
2. Framework Preset: Next.js.
3. Set Environment Variable:
   - `NEXT_PUBLIC_BACKEND_URL`: Your deployed backend API URL (e.g. `https://crop-advisory-backend.onrender.com/api`).
