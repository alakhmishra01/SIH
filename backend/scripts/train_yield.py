import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "crop_yield.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    print("Loading Crop Yield Dataset...")
    df = pd.read_csv(DATA_PATH)

    # Clean data if necessary
    df = df.dropna()

    cat_features = ['Crop', 'Season', 'State']
    num_features = ['Crop_Year', 'Area', 'Annual_Rainfall', 'Fertilizer', 'Pesticide']
    target = 'Yield'

    X = df[cat_features + num_features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
            ('num', 'passthrough', num_features)
        ]
    )

    print("\n--- Training Random Forest Regressor Pipeline ---")
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    print(f"Random Forest Regressor R² Score: {r2:.4f}")
    print(f"Random Forest Regressor RMSE: {rmse:.4f} t/ha")
    print(f"Random Forest Regressor MAE: {mae:.4f} t/ha")

    # Extract feature names & feature importances
    ohe_categories = pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(cat_features)
    all_feature_names = list(ohe_categories) + num_features
    importances = pipeline.named_steps['regressor'].feature_importances_

    feature_importance_map = dict(zip(all_feature_names, [float(i) for i in importances]))

    unique_crops = sorted(df['Crop'].unique().tolist())
    unique_seasons = sorted(df['Season'].unique().tolist())
    unique_states = sorted(df['State'].unique().tolist())

    save_payload = {
        "pipeline": pipeline,
        "cat_features": cat_features,
        "num_features": num_features,
        "unique_crops": unique_crops,
        "unique_seasons": unique_seasons,
        "unique_states": unique_states,
        "feature_importances": feature_importance_map,
        "metrics": {
            "r2_score": float(r2),
            "rmse": float(rmse),
            "mae": float(mae)
        }
    }

    model_file = os.path.join(MODEL_DIR, "crop_yield_rf.pkl")
    joblib.dump(save_payload, model_file)
    print(f"\nSaved crop yield model payload to {model_file}")

    return save_payload["metrics"]

if __name__ == "__main__":
    train()
