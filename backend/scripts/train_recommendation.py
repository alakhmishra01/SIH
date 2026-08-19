import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, log_loss

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "Crop_recommendation.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    print("Loading Crop Recommendation Dataset...")
    df = pd.read_csv(DATA_PATH)

    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df['label'].str.strip().str.lower()

    # Stratified split to preserve class distribution across all 22 crops
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\n--- Training Base Random Forest Classifier ---")
    base_rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=15,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    base_rf.fit(X_train, y_train)
    raw_acc = accuracy_score(y_test, base_rf.predict(X_test))
    print(f"Base Random Forest Test Accuracy: {raw_acc:.4f}")

    print("\n--- Calibrating Probabilities with CalibratedClassifierCV (Sigmoid/Platt Scaling) ---")
    # Calibrate on stratified folds to eliminate overconfident probability spikes
    calibrated_clf = CalibratedClassifierCV(estimator=base_rf, method='sigmoid', cv=5)
    calibrated_clf.fit(X_train, y_train)

    cal_preds = calibrated_clf.predict(X_test)
    cal_probs = calibrated_clf.predict_proba(X_test)
    cal_acc = accuracy_score(y_test, cal_preds)
    loss = log_loss(y_test, cal_probs)

    print(f"Calibrated Classifier Test Accuracy: {cal_acc:.4f}")
    print(f"Calibrated Log Loss (Brier/Cross-Entropy): {loss:.4f}")

    # Compute baseline feature distributions for SHAP / Tree attribution
    feature_stats = {}
    for col in features:
        feature_stats[col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "p25": float(df[col].quantile(0.25)),
            "p50": float(df[col].quantile(0.50)),
            "p75": float(df[col].quantile(0.75))
        }

    # Per-crop optimal physiological profiles
    crop_profiles = {}
    for crop in df['label'].unique():
        sub = df[df['label'] == crop]
        crop_profiles[crop.lower()] = {
            "N_mean": float(sub['N'].mean()),
            "P_mean": float(sub['P'].mean()),
            "K_mean": float(sub['K'].mean()),
            "ph_mean": float(sub['ph'].mean()),
            "rainfall_mean": float(sub['rainfall'].mean()),
            "temp_mean": float(sub['temperature'].mean()),
            "humidity_mean": float(sub['humidity'].mean())
        }

    save_payload = {
        "calibrated_model": calibrated_clf,
        "base_model": base_rf,
        "features": features,
        "classes": list(calibrated_clf.classes_),
        "feature_stats": feature_stats,
        "crop_profiles": crop_profiles,
        "metrics": {
            "test_accuracy": float(cal_acc),
            "log_loss": float(loss)
        }
    }

    model_file = os.path.join(MODEL_DIR, "crop_recommendation_rf.pkl")
    joblib.dump(save_payload, model_file)
    print(f"\nSaved calibrated crop recommendation model to {model_file}")

    return save_payload["metrics"]

if __name__ == "__main__":
    train()
