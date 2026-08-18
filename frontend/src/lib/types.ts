export interface RecommendedCrop {
  crop: string;
  confidence: number;
  rank: number;
}

export interface CropRecommendResponse {
  recommendations: RecommendedCrop[];
  soil_summary: {
    N: number;
    P: number;
    K: number;
    ph: number;
    clay_pct?: number;
    sand_pct?: number;
    organic_matter_pct?: number;
  };
  weather_summary: {
    temp_c: number;
    humidity_pct: number;
    rainfall_mm: number;
    description: string;
    source: string;
  };
}

export interface FactorImportance {
  factor: string;
  importance_pct: number;
  description: string;
}

export interface YieldPredictResponse {
  crop: string;
  predicted_yield_t_ha: number;
  confidence_range: {
    min_t_ha: number;
    max_t_ha: number;
  };
  total_production_t: number;
  top_factors: FactorImportance[];
  model_disclaimer: string;
}

export interface AdvisoryMessage {
  category: string;
  severity: 'healthy' | 'warning' | 'critical';
  title: string;
  action_item: string;
}

export interface AdvisoryResponse {
  status: 'healthy' | 'warning' | 'critical';
  crop?: string;
  location: { lat: number; lon: number };
  messages: AdvisoryMessage[];
  weather_snapshot: {
    temp_c: number;
    humidity_pct: number;
    rainfall_mm: number;
    description: string;
    source: string;
  };
  soil_snapshot: {
    ph: number;
    clay_pct: number;
    sand_pct: number;
    organic_matter_pct: number;
    source: string;
  };
}

export interface HistoryRecord {
  id: number;
  session_id: string;
  type: 'recommendation' | 'yield_prediction';
  created_at: string;
  input_data: Record<string, any>;
  result_data: Record<string, any>;
}

export interface HistoryResponse {
  session_id: string;
  records: HistoryRecord[];
}
