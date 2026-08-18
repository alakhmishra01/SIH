import os
import pandas as pd
import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
os.makedirs(DATA_DIR, exist_ok=True)

CROP_REC_URL = "https://raw.githubusercontent.com/sakethlingerker/Minor-Project/main/Crop_recommendation.csv"
CROP_YIELD_URL = "https://raw.githubusercontent.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset/main/crop_yield.csv"

def download_file(url: str, filename: str) -> str:
    filepath = os.path.join(DATA_DIR, filename)
    print(f"Downloading {url} -> {filepath}")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
    resp.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(resp.content)
    print(f"Saved {filename} ({os.path.getsize(filepath)} bytes)")
    return filepath

def inspect_datasets():
    rec_path = download_file(CROP_REC_URL, "Crop_recommendation.csv")
    yield_path = download_file(CROP_YIELD_URL, "crop_yield.csv")

    print("\n--- Crop Recommendation Dataset ---")
    df_rec = pd.read_csv(rec_path)
    print("Shape:", df_rec.shape)
    print("Columns:", list(df_rec.columns))
    print("Head:\n", df_rec.head(3))
    print("Unique crops count:", df_rec["label"].nunique())
    print("Crops:", sorted(df_rec["label"].unique()))
    print("Missing values:\n", df_rec.isnull().sum())

    print("\n--- Crop Yield Dataset ---")
    df_yield = pd.read_csv(yield_path)
    print("Shape:", df_yield.shape)
    print("Columns:", list(df_yield.columns))
    print("Head:\n", df_yield.head(3))
    print("Missing values:\n", df_yield.isnull().sum())
    print("Unique crops in yield data:", df_yield["Crop"].nunique())

if __name__ == "__main__":
    inspect_datasets()
