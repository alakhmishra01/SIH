export interface RecommendedCrop {
  crop: string;
  confidence: number;
  rank: number;
  agro_suitability?: string;
  suitability_notes?: string;
  feature_contributions?: Record<string, number>;
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
    silt_pct?: number;
    organic_matter_pct?: number;
    soil_texture_class?: string;
    source?: string;
  };
  weather_summary: {
    temp_c: number;
    temp_min_c?: number;
    temp_max_c?: number;
    humidity_pct: number;
    rainfall_mm: number;
    rainfall_seasonal_mm?: number;
    solar_radiation_mj?: number;
    description: string;
    source: string;
  };
  agronomic_advisory_flags?: string[];
}

export interface FactorImportance {
  factor: string;
  importance_pct: number;
  impact_direction?: string;
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
  agro_zone_context?: string;
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
    temp_min_c?: number;
    temp_max_c?: number;
    humidity_pct: number;
    rainfall_mm: number;
    rainfall_seasonal_mm?: number;
    solar_radiation_mj?: number;
    description: string;
    source: string;
  };
  soil_snapshot: {
    ph: number;
    clay_pct: number;
    sand_pct: number;
    silt_pct?: number;
    organic_matter_pct: number;
    soil_texture_class?: string;
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
