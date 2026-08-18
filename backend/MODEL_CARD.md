# Model Cards — Smart Crop Advisory & Yield Prediction

## Model 1: Crop Recommendation Classifier

- **Task**: Multi-class Classification (22 Crop Types)
- **Algorithm**: Random Forest Classifier (`n_estimators=100`)
- **Dataset**: Kaggle Crop Recommendation Dataset (`Crop_recommendation.csv`, 2,200 samples)
- **Input Features**:
  - `N` (Nitrogen content in soil, kg/ha)
  - `P` (Phosphorus content in soil, kg/ha)
  - `K` (Potassium content in soil, kg/ha)
  - `temperature` (°C)
  - `humidity` (%)
  - `ph` (Soil pH value)
  - `rainfall` (Annual/seasonal rainfall in mm)
- **Target Variable**: `label` (22 crops: apple, banana, blackgram, chickpea, coconut, coffee, cotton, grapes, jute, kidneybeans, lentil, maize, mango, mothbeans, mungbean, muskmelon, orange, papaya, pigeonpeas, pomegranate, rice, watermelon)
- **Performance Metrics**:
  - **5-Fold Cross-Validation Accuracy**: `99.45% ± 0.68%`
  - **Test Set Accuracy**: `99.55%`
- **Known Limitations**:
  - Training data consists of idealized, synthetic crop condition ranges.
  - Does not directly account for microclimatic extreme events (frost, sudden floods).
  - Recommendations should be validated by regional agronomists for local soil nuances.

---

## Model 2: Crop Yield Regressor

- **Task**: Continuous Yield Prediction (tonnes per hectare, t/ha)
- **Algorithm**: Random Forest Regressor Pipeline with OneHotEncoder
- **Dataset**: Indian Agricultural Crop Yield Dataset (`crop_yield.csv`, 19,689 district/state records)
- **Input Features**:
  - Categorical: `Crop`, `Season`, `State`
  - Numerical: `Crop_Year`, `Area` (hectares), `Annual_Rainfall` (mm), `Fertilizer` (kg), `Pesticide` (kg)
- **Target Variable**: `Yield` (Production / Area, t/ha)
- **Performance Metrics**:
  - **R² Score**: `0.9801`
  - **Mean Absolute Error (MAE)**: `9.47 t/ha`
  - **Root Mean Squared Error (RMSE)**: `126.32 t/ha` (heavily influenced by high-yielding perennial crops like Sugarcane and Coconut)
- **Top Predictive Features**:
  1. `Crop` (Type of crop planted)
  2. `State` (Geographic region/climate zone)
  3. `Annual_Rainfall`
  4. `Fertilizer` & `Pesticide` usage per hectare
- **Known Limitations**:
  - High variance across multi-year state-level aggregated data.
  - Highly dependent on accurate land area (ha) and seasonal weather inputs.
  - Predictions represent regional potential averages rather than hyperlocal farm-level guarantees.
