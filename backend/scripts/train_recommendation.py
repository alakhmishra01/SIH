import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception as e:
    print(f"XGBoost unavailable ({e}), using Scikit-Learn RandomForestClassifier baseline.")
    HAS_XGB = False

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "Crop_recommendation.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    print("Loading Crop Recommendation Dataset...")
    df = pd.read_csv(DATA_PATH)

    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("\n--- Training Random Forest Baseline Classifier ---")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_cv_scores = cross_val_score(rf_model, X, y, cv=5)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    print(f"Random Forest 5-Fold CV Accuracy: {rf_cv_scores.mean():.4f} (+/- {rf_cv_scores.std()*2:.4f})")
    print(f"Random Forest Test Accuracy: {rf_acc:.4f}")

    if HAS_XGB:
        print("\n--- Training XGBoost Classifier ---")
        try:
            le = LabelEncoder()
            y_encoded = le.fit_transform(y)
            X_tr_xgb, X_te_xgb, y_tr_xgb, y_te_xgb = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
            xgb_model = XGBClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
            xgb_model.fit(X_tr_xgb, y_tr_xgb)
            xgb_preds = xgb_model.predict(X_te_xgb)
            xgb_acc = accuracy_score(y_te_xgb, xgb_preds)
            print(f"XGBoost Test Accuracy: {xgb_acc:.4f}")
        except Exception as err:
            print(f"XGBoost training skipped: {err}")

    # Use Random Forest as primary model (since it directly outputs calibrated class probabilities)
    save_payload = {
        "model": rf_model,
        "features": features,
        "classes": list(rf_model.classes_),
        "metrics": {
            "cv_accuracy_mean": float(rf_cv_scores.mean()),
            "cv_accuracy_std": float(rf_cv_scores.std()),
            "test_accuracy": float(rf_acc)
        }
    }

    model_file = os.path.join(MODEL_DIR, "crop_recommendation_rf.pkl")
    joblib.dump(save_payload, model_file)
    print(f"\nSaved crop recommendation model payload to {model_file}")

    return save_payload["metrics"]

if __name__ == "__main__":
    train()
