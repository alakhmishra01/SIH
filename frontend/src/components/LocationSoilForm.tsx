"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Sliders, Calendar, Layers, RefreshCw, CloudSun, Thermometer, Droplets, Sun } from "lucide-react";
import { fetchSoilData, fetchWeatherClimate, reverseGeocodeState } from "@/lib/api";

interface LocationSoilFormProps {
  onRecommend: (data: {
    lat: number;
    lon: number;
    N: number;
    P: number;
    K: number;
    ph: number;
    rainfall_override?: number;
    sowing_date?: string;
    season?: string;
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
  "Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Rajasthan", "Gujarat",
  "Punjab", "Haryana", "Bihar", "West Bengal", "Odisha", "Chhattisgarh",
  "Karnataka", "Andhra Pradesh", "Telangana", "Tamil Nadu", "Kerala", "Assam"
];

// Calibrated field crops supported across models
const CROPS_LIST = [
  { name: "Soyabean", category: "Oilseeds & Legumes" },
  { name: "Rice", category: "Cereals & Grains" },
  { name: "Wheat", category: "Cereals & Grains" },
  { name: "Maize", category: "Cereals & Grains" },
  { name: "Cotton", category: "Commercial & Fiber" },
  { name: "Sugarcane", category: "Commercial & Sugar" },
  { name: "Chickpea", category: "Pulses & Legumes" },
  { name: "Pigeonpeas", category: "Pulses & Legumes" },
  { name: "Groundnut", category: "Oilseeds" },
  { name: "Potato", category: "Tubers & Vegetables" },
  { name: "Onion", category: "Vegetables & Condiments" },
  { name: "Banana", category: "Fruit Crops" },
  { name: "Jute", category: "Fiber Crops" },
  { name: "Sunflower", category: "Oilseeds" },
  { name: "Turmeric", category: "Spices" },
  { name: "Ginger", category: "Spices" },
  { name: "Garlic", category: "Spices" },
  { name: "Bajra", category: "Millets" },
  { name: "Jowar", category: "Millets" },
  { name: "Ragi", category: "Millets" },
  { name: "Muskmelon", category: "Horticulture (Zaid / Dry Season Only)" },
  { name: "Watermelon", category: "Horticulture (Zaid / Dry Season Only)" }
];

function getTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeNum(val: unknown, fallback: number): number {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

export const LocationSoilForm: React.FC<LocationSoilFormProps> = ({
  onRecommend,
  onPredictYield,
  loading
}) => {
  const [lat, setLat] = useState<number>(23.2147);
  const [lon, setLon] = useState<number>(77.3978);
  const [geolocating, setGeolocating] = useState<boolean>(false);

  // Soil Nutrients
  const [N, setN] = useState<number>(85);
  const [P, setP] = useState<number>(45);
  const [K, setK] = useState<number>(50);
  const [ph, setPh] = useState<number>(7.2);
  const [soilTexture, setSoilTexture] = useState<string>("Vertisol / Heavy Black Clay");
  const [socPct, setSocPct] = useState<number>(0.95);

  // Climate Normals (Seasonal projection)
  const [rainfallSeasonal, setRainfallSeasonal] = useState<number>(1450);
  const [rainfallOverride, setRainfallOverride] = useState<string>("");
  const [tempC, setTempC] = useState<number>(26.5);
  const [humidityPct, setHumidityPct] = useState<number>(82);
  const [solarRad, setSolarRad] = useState<number>(18.5);

  // Crop & Sowing parameters
  const [crop, setCrop] = useState<string>("Soyabean");
  const [sowingDate, setSowingDate] = useState<string>(getTodayDate());
  const [areaHa, setAreaHa] = useState<number>(2.5);
  const [state, setState] = useState<string>("Madhya Pradesh");
  const [season, setSeason] = useState<string>("Kharif");

  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeolocating(true);
    setStatusMessage("Querying GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = parseFloat(pos.coords.latitude.toFixed(4));
        const userLon = parseFloat(pos.coords.longitude.toFixed(4));
        setLat(userLat);
        setLon(userLon);

        // 1. Auto-detect State
        try {
          const detectedState = await reverseGeocodeState(userLat, userLon);
          if (detectedState) {
            const matched = INDIAN_STATES.find(
              (s) => s.toLowerCase() === detectedState.toLowerCase()
            );
            if (matched) setState(matched);
          }
        } catch (e) {
          console.warn("Reverse geocode warning:", e);
        }

        // 2. Auto-fetch Climate Normals & Seasonal Precipitation
        try {
          const weather = await fetchWeatherClimate(userLat, userLon, sowingDate);
          if (weather) {
            setTempC(weather.temp_c);
            setHumidityPct(weather.humidity_pct);
            setRainfallSeasonal(weather.rainfall_seasonal_mm || weather.rainfall_mm);
            setSolarRad(weather.solar_radiation_mj || 18.5);
          }
        } catch (e) {
          console.warn("Weather fetch warning:", e);
        }

        // 3. Auto-fetch ISRIC SoilGrids v2 Profile
        try {
          const soil = await fetchSoilData(userLat, userLon);
          if (soil) {
            setN(Math.round(safeNum(soil.estimated_N, 85)));
            setP(Math.round(safeNum(soil.estimated_P, 45)));
            setK(Math.round(safeNum(soil.estimated_K, 50)));
            setPh(safeNum(soil.ph, 7.2));
            setSoilTexture(soil.soil_texture_class || "Vertisol / Heavy Black Clay");
            setSocPct(soil.organic_matter_pct || 0.95);
            setStatusMessage(`✓ GPS, Climate Normals & SoilGrids v2 Profile Synced for (${userLat}°N, ${userLon}°E)`);
          }
        } catch (e) {
          console.warn("Soil fetch warning:", e);
          setStatusMessage("✓ GPS synced (Soil/Climate used calibrated regional baselines)");
        }

        setGeolocating(false);
      },
      (err) => {
        console.warn("Geolocation fallback:", err);
        setStatusMessage("⚠ Geolocation denied — calibrated regional baseline loaded.");
        setGeolocating(false);
      }
    );
  };

  const handleRecommendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecommend({
      lat: safeNum(lat, 23.2147),
      lon: safeNum(lon, 77.3978),
      N: safeNum(N, 85),
      P: safeNum(P, 45),
      K: safeNum(K, 50),
      ph: safeNum(ph, 7.2),
      rainfall_override: rainfallOverride ? parseFloat(rainfallOverride) : rainfallSeasonal,
      sowing_date: sowingDate,
      season
    });
  };

  const handleYieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredictYield({
      crop,
      lat: safeNum(lat, 23.2147),
      lon: safeNum(lon, 77.3978),
      sowing_date: sowingDate,
      area_ha: safeNum(areaHa, 2.5),
      state,
      season
    });
  };

  return (
    <div className="ledger-card p-6 rounded-md mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone mb-6 gap-2">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-ink/60">
            SECTION 01 — FIELD LOG & AGRONOMIC ENTRY
          </span>
          <h2 className="font-display text-xl font-semibold text-ink">
            Field Location, Climate Normals & Soil Profile
          </h2>
        </div>
        
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={geolocating}
          className="btn-field-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 font-mono"
        >
          {geolocating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-field-green" />}
          <span>{geolocating ? "FETCHING CLIMATE & SOIL..." : "GEOLOCATE FIELD"}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="mb-4 px-3 py-2 text-xs font-mono bg-paper border border-stone rounded-sm text-ink/80 flex items-center gap-2">
          <span>{statusMessage}</span>
        </div>
      )}

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

        {/* Live Environmental Normals Display Bar */}
        <div className="bg-paper p-3.5 border border-stone rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="w-4 h-4 text-harvest-gold" />
            <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
              Projected Climate Normals (~120-Day Crop Cycle Window)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 bg-stone/10 rounded">
              <span className="text-ink/60 block text-[10px]">CUMULATIVE RAINFALL</span>
              <strong className="text-sm font-bold text-field-green">{rainfallSeasonal} mm</strong>
            </div>
            <div className="p-2 bg-stone/10 rounded">
              <span className="text-ink/60 block text-[10px]">MEAN TEMPERATURE</span>
              <strong className="text-sm font-bold text-ink">{tempC}°C</strong>
            </div>
            <div className="p-2 bg-stone/10 rounded">
              <span className="text-ink/60 block text-[10px]">RELATIVE HUMIDITY</span>
              <strong className="text-sm font-bold text-ink">{humidityPct}%</strong>
            </div>
            <div className="p-2 bg-stone/10 rounded">
              <span className="text-ink/60 block text-[10px]">SOLAR RADIATION</span>
              <strong className="text-sm font-bold text-ink">{solarRad} MJ/m²</strong>
            </div>
          </div>
        </div>

        {/* Soil Profile & NPK Inputs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-field-green" />
              <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wide">
                Soil Profile & Mineral Nutrients (NPK & pH)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-ink/70 px-2 py-0.5 bg-paper border border-stone rounded">
              Texture: {soilTexture} (SOC: {socPct}%)
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-paper p-3 border border-stone rounded-sm">
              <label className="block text-xs font-mono text-ink/70 mb-1">NITROGEN (N)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={N}
                  onChange={(e) => setN(safeNum(e.target.value, 10))}
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
                  min="5"
                  max="150"
                  value={P}
                  onChange={(e) => setP(safeNum(e.target.value, 5))}
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
                  min="5"
                  max="200"
                  value={K}
                  onChange={(e) => setK(safeNum(e.target.value, 5))}
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
                  min="4.5"
                  max="9.0"
                  value={ph}
                  onChange={(e) => setPh(safeNum(e.target.value, 6.5))}
                  className="ledger-input w-full font-mono text-lg font-bold text-subsoil-clay"
                />
                <span className="text-xs font-mono text-ink/50">pH</span>
              </div>
            </div>

            <div className="bg-paper p-3 border border-stone rounded-sm col-span-2 md:col-span-1">
              <label className="block text-xs font-mono text-ink/70 mb-1">RAINFALL OVERRIDE</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder={`${rainfallSeasonal} mm`}
                  value={rainfallOverride}
                  onChange={(e) => setRainfallOverride(e.target.value)}
                  className="ledger-input w-full font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Crop Selection & Sowing Parameters */}
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
                  <option key={c.name} value={c.name}>
                    {c.name} — {c.category}
                  </option>
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
                min="0.05"
                value={areaHa}
                onChange={(e) => setAreaHa(safeNum(e.target.value, 1.0))}
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
                <option value="Kharif">Kharif (Monsoon • July–Oct)</option>
                <option value="Rabi">Rabi (Winter • Nov–March)</option>
                <option value="Summer">Summer / Zaid (Dry • Feb–May)</option>
                <option value="Whole Year">Whole Year (Annual)</option>
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
