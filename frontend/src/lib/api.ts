import {
  CropRecommendResponse,
  YieldPredictResponse,
  AdvisoryResponse,
  HistoryResponse,
} from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

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
}): Promise<CropRecommendResponse> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(`${BACKEND_URL}/recommend-crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to recommend crop: ${err}`);
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
}): Promise<YieldPredictResponse> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(`${BACKEND_URL}/predict-yield`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to predict yield: ${err}`);
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
