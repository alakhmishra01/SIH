import {
  CropRecommendResponse,
  YieldPredictResponse,
  AdvisoryResponse,
  HistoryResponse,
} from "./types";

// Remove any trailing slash from the URL to prevent double-slash issues
const RAW_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
const BACKEND_URL = RAW_URL.replace(/\/+$/, "");

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = localStorage.getItem("agri_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("agri_session_id", sessionId);
  }
  return sessionId;
}

export async function recommendCrop(data: {
  lat: number;
  lon: number;
  N: number;
  P: number;
  K: number;
  ph: number;
  rainfall_override?: number;
  sowing_date?: string;
  season?: string;
}): Promise<CropRecommendResponse> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(`${BACKEND_URL}/recommend-crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    const msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    throw new Error(`Crop Recommendation Error: ${msg}`);
  }
  return res.json();
}

export async function predictYield(data: {
  crop: string;
  lat: number;
  lon: number;
  sowing_date: string;
  area_ha: number;
  state?: string;
  season?: string;
  fertilizer_kg?: number;
  pesticide_kg?: number;
}): Promise<YieldPredictResponse> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(`${BACKEND_URL}/predict-yield`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    if (err.detail && err.detail.message) {
      throw new Error(err.detail.message);
    }
    const msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    throw new Error(`Yield Forecast Error: ${msg}`);
  }
  return res.json();
}

export async function getAdvisory(lat: number, lon: number, crop?: string): Promise<AdvisoryResponse> {
  const query = new URLSearchParams({ lat: lat.toString(), lon: lon.toString() });
  if (crop) query.append("crop", crop);
  
  const res = await fetch(`${BACKEND_URL}/advisory?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch field advisory");
  return res.json();
}

export async function getHistory(): Promise<HistoryResponse> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(`${BACKEND_URL}/history?session_id=${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch prediction history");
  return res.json();
}

// Fetch live soil data from backend for a given lat/lon
export async function fetchSoilData(lat: number, lon: number): Promise<{
  ph: number;
  clay_pct: number;
  sand_pct: number;
  silt_pct: number;
  organic_matter_pct: number;
  soil_texture_class: string;
  estimated_N: number;
  estimated_P: number;
  estimated_K: number;
  source: string;
}> {
  const res = await fetch(`${BACKEND_URL}/soil?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch soil data");
  return res.json();
}

// Fetch live weather & climate normals for a given lat/lon
export async function fetchWeatherClimate(lat: number, lon: number, sowingDate?: string): Promise<{
  temp_c: number;
  temp_min_c: number;
  temp_max_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  rainfall_seasonal_mm: number;
  solar_radiation_mj: number;
  description: string;
  source: string;
}> {
  const query = new URLSearchParams({ lat: lat.toString(), lon: lon.toString() });
  if (sowingDate) query.append("sowing_date", sowingDate);
  const res = await fetch(`${BACKEND_URL}/weather?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch weather climate normals");
  return res.json();
}

// Reverse geocode lat/lon to detect Indian state using free Nominatim API
export async function reverseGeocodeState(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=5&addressdetails=1`,
      { headers: { "User-Agent": "FieldLedger-AgriApp/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.address?.state || null;
  } catch {
    return null;
  }
}
