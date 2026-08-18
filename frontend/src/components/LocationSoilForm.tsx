"use client";

import React, { useState } from "react";
import { MapPin, Sliders, Calendar, Layers, RefreshCw } from "lucide-react";

interface LocationSoilFormProps {
  onRecommend: (data: {
    lat: number;
    lon: number;
    N: number;
    P: number;
    K: number;
    ph: number;
    rainfall_override?: number;
  }) => void;
  onPredictYield: (data: {
    crop: string;
    lat: number;
    lon: number;
    sowing_date: string;
    area_ha: number;
    state: string;
    season: string;
  }) => void;
  loading: boolean;
}

const INDIAN_STATES = [
  "Assam", "Andhra Pradesh", "Bihar", "Chhattisgarh", "Gujarat", "Haryana",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
];

const CROPS_LIST = [
  "Rice", "Maize", "Chickpea", "Kidneybeans", "Pigeonpeas", "Mothbeans",
  "Mungbean", "Blackgram", "Lentil", "Pomegranate", "Banana", "Mango",
  "Grapes", "Watermelon", "Muskmelon", "Apple", "Orange", "Papaya",
  "Coconut", "Cotton", "Jute", "Coffee", "Wheat", "Sugarcane"
];

export const LocationSoilForm: React.FC<LocationSoilFormProps> = ({
  onRecommend,
  onPredictYield,
  loading
}) => {
  const [lat, setLat] = useState<number>(26.14);
  const [lon, setLon] = useState<number>(91.73);
  const [locationName, setLocationName] = useState<string>("Guwahati, Assam (Default)");
  const [geolocating, setGeolocating] = useState<boolean>(false);

  // Soil Nutrients
  const [N, setN] = useState<number>(90);
  const [P, setP] = useState<number>(42);
  const [K, setK] = useState<number>(43);
  const [ph, setPh] = useState<number>(6.5);
  const [rainfallOverride, setRainfallOverride] = useState<string>("");

  // Crop & Sowing fields
  const [crop, setCrop] = useState<string>("Rice");
  const [sowingDate, setSowingDate] = useState<string>("2024-06-15");
  const [areaHa, setAreaHa] = useState<number>(2.5);
  const [state, setState] = useState<string>("Assam");
  const [season, setSeason] = useState<string>("Kharif");

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = parseFloat(pos.coords.latitude.toFixed(4));
        const userLon = parseFloat(pos.coords.longitude.toFixed(4));
        setLat(userLat);
        setLon(userLon);
        setLocationName(`Lat: ${userLat}, Lon: ${userLon} (Detected)`);
        setGeolocating(false);
      },
      (err) => {
        console.warn("Geolocation denied/failed, falling back to defaults.", err);
        setGeolocating(false);
      }
    );
  };

  const handleRecommendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecommend({
      lat,
      lon,
      N,
      P,
      K,
      ph,
      rainfall_override: rainfallOverride ? parseFloat(rainfallOverride) : undefined
    });
  };

  const handleYieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredictYield({
      crop,
      lat,
      lon,
      sowing_date: sowingDate,
      area_ha: areaHa,
      state,
      season
    });
  };

  return (
    <div className="ledger-card p-6 rounded-md mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone mb-6 gap-2">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-ink/60">SECTION 01 — FIELD LOG ENTRY</span>
          <h2 className="font-display text-xl font-semibold text-ink">Field Location & Soil Metrics</h2>
        </div>
        
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={geolocating}
          className="btn-field-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 font-mono"
        >
          {geolocating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-field-green" />}
          <span>{geolocating ? "DETECTING GPS..." : "GEOLOCATE FIELD"}</span>
        </button>
      </div>

      <form className="space-y-6">
        {/* Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-paper/50 p-4 border border-stone rounded-sm">
          <div>
            <label className="block text-xs font-mono text-ink/70 mb-1">LATITUDE (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              className="ledger-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink/70 mb-1">LONGITUDE (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
              className="ledger-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-ink/70 mb-1">STATE / REGION</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="ledger-input w-full cursor-pointer bg-transparent"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Soil Test Nutrients Row */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-field-green" />
            <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wide">
              Soil Test Analysis (NPK & pH)
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-paper p-3 border border-stone rounded-sm">
              <label className="block text-xs font-mono text-ink/70 mb-1">NITROGEN (N)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={N}
                  onChange={(e) => setN(parseFloat(e.target.value) || 0)}
                  className="ledger-input w-full font-mono text-lg font-bold text-field-green"
                />
                <span className="text-xs font-mono text-ink/50">kg/ha</span>
              </div>
            </div>

            <div className="bg-paper p-3 border border-stone rounded-sm">
              <label className="block text-xs font-mono text-ink/70 mb-1">PHOSPHORUS (P)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={P}
                  onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                  className="ledger-input w-full font-mono text-lg font-bold text-field-green"
                />
                <span className="text-xs font-mono text-ink/50">kg/ha</span>
              </div>
            </div>

            <div className="bg-paper p-3 border border-stone rounded-sm">
              <label className="block text-xs font-mono text-ink/70 mb-1">POTASSIUM (K)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={K}
                  onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                  className="ledger-input w-full font-mono text-lg font-bold text-field-green"
                />
                <span className="text-xs font-mono text-ink/50">kg/ha</span>
              </div>
            </div>

            <div className="bg-paper p-3 border border-stone rounded-sm">
              <label className="block text-xs font-mono text-ink/70 mb-1">SOIL pH</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="10.0"
                  value={ph}
                  onChange={(e) => setPh(parseFloat(e.target.value) || 6.5)}
                  className="ledger-input w-full font-mono text-lg font-bold text-subsoil-clay"
                />
                <span className="text-xs font-mono text-ink/50">pH</span>
              </div>
            </div>

            <div className="bg-paper p-3 border border-stone rounded-sm col-span-2 md:col-span-1">
              <label className="block text-xs font-mono text-ink/70 mb-1">RAINFALL (MM)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Auto-fetch"
                  value={rainfallOverride}
                  onChange={(e) => setRainfallOverride(e.target.value)}
                  className="ledger-input w-full font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Crop Selection & Sowing Parameters for Yield */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-subsoil-clay" />
            <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wide">
              Selected Crop & Sowing Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-ink/70 mb-1">TARGET CROP</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="ledger-input w-full cursor-pointer font-body"
              >
                {CROPS_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-ink/70 mb-1">SOWING DATE</label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="ledger-input w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink/70 mb-1">FARM AREA (HA)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaHa}
                onChange={(e) => setAreaHa(parseFloat(e.target.value) || 1.0)}
                className="ledger-input w-full font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink/70 mb-1">SEASON</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="ledger-input w-full cursor-pointer"
              >
                <option value="Kharif">Kharif (Monsoon)</option>
                <option value="Rabi">Rabi (Winter)</option>
                <option value="Summer">Summer (Zaid)</option>
                <option value="Whole Year">Whole Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-stone">
          <button
            type="button"
            onClick={handleRecommendSubmit}
            disabled={loading}
            className="btn-field-primary w-full sm:w-auto px-6 py-3 text-xs flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>RECOMMEND OPTIMAL CROPS</span>
          </button>

          <button
            type="button"
            onClick={handleYieldSubmit}
            disabled={loading}
            className="btn-field-secondary w-full sm:w-auto px-6 py-3 text-xs flex items-center justify-center gap-2 border-subsoil-clay text-subsoil-clay hover:bg-subsoil-clay hover:text-paper"
          >
            <Calendar className="w-4 h-4" />
            <span>PREDICT YIELD FORECAST</span>
          </button>
        </div>
      </form>
    </div>
  );
};
