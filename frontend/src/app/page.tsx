"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SoilHorizonStrip } from "@/components/SoilHorizonStrip";
import { LocationSoilForm } from "@/components/LocationSoilForm";
import { CropRecommendation } from "@/components/CropRecommendation";
import { YieldPrediction } from "@/components/YieldPrediction";
import { FieldAdvisory } from "@/components/FieldAdvisory";
import { HistoryLedger } from "@/components/HistoryLedger";
import { recommendCrop, predictYield, getAdvisory } from "@/lib/api";
import {
  CropRecommendResponse,
  YieldPredictResponse,
  AdvisoryResponse,
} from "@/lib/types";

export default function AgronomistDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [recResults, setRecResults] = useState<CropRecommendResponse | null>(null);
  const [yieldResults, setYieldResults] = useState<YieldPredictResponse | null>(null);
  const [advisoryResults, setAdvisoryResults] = useState<AdvisoryResponse | null>(null);

  // Initial Advisory load for default location
  useEffect(() => {
    fetchDefaultAdvisory();
  }, []);

  const fetchDefaultAdvisory = async () => {
    try {
      const adv = await getAdvisory(26.14, 91.73, "Rice");
      setAdvisoryResults(adv);
    } catch (e) {
      console.warn("Backend API offline or unreachable:", e);
    }
  };

  const handleRecommend = async (data: {
    lat: number;
    lon: number;
    N: number;
    P: number;
    K: number;
    ph: number;
    rainfall_override?: number;
  }) => {
    setLoading(true);
    setLoadingText("Querying SoilGrids v2 & OpenWeather API... Running Random Forest Classifier...");
    setError(null);

    try {
      const rec = await recommendCrop(data);
      setRecResults(rec);

      // Also refresh live advisory for this location
      const adv = await getAdvisory(data.lat, data.lon, rec.recommendations[0]?.crop);
      setAdvisoryResults(adv);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to run crop recommendation. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictYield = async (data: {
    crop: string;
    lat: number;
    lon: number;
    sowing_date: string;
    area_ha: number;
    state: string;
    season: string;
  }) => {
    setLoading(true);
    setLoadingText(`Loading Yield Regressor Pipeline for ${data.crop} (${data.area_ha} ha in ${data.state})...`);
    setError(null);

    try {
      const yld = await predictYield(data);
      setYieldResults(yld);

      // Refresh advisory for selected crop & location
      const adv = await getAdvisory(data.lat, data.lon, data.crop);
      setAdvisoryResults(adv);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to run yield prediction. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Hero Welcome Ledger Note */}
        <div className="mb-8 border-b border-stone pb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-field-green font-semibold">
            AGRONOMIC FIELD WORKING NOTEBOOK
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mt-1 mb-2">
            Smart Crop Advisory & Yield Prediction System
          </h1>
          <p className="font-body text-sm text-ink/80 max-w-3xl leading-relaxed">
            Enter field coordinates, soil NPK analysis, or use auto-geolocation to pull live soil profiles and climate forecasts. Generates top crop recommendations and calibrated yield forecasts.
          </p>
        </div>

        {/* Form Inputs */}
        <LocationSoilForm
          onRecommend={handleRecommend}
          onPredictYield={handlePredictYield}
          loading={loading}
        />

        {/* Live Loading State — Signature Soil Horizon Strip */}
        {loading && (
          <SoilHorizonStrip loading={true} label={loadingText} />
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 mb-8 bg-subsoil-clay/10 border-l-4 border-l-subsoil-clay border border-stone rounded-sm text-xs font-mono text-ink">
            <strong className="text-subsoil-clay block mb-1">AGRONOMIC SYSTEM ERROR</strong>
            {error}
          </div>
        )}

        {/* Section Divider */}
        {!loading && <SoilHorizonStrip className="my-8" />}

        {/* Recommendation Results View */}
        {recResults && <CropRecommendation data={recResults} />}

        {/* Yield Prediction Results View */}
        {yieldResults && <YieldPrediction data={yieldResults} />}

        {/* Live Field Advisory View */}
        {advisoryResults && <FieldAdvisory advisory={advisoryResults} />}

        {/* History Logbook */}
        <HistoryLedger />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone py-8 bg-paper text-xs font-mono text-ink/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-ink">FIELD LEDGER — AGRONOMY DECISION ENGINE</p>
            <p className="text-[11px] mt-0.5">Scikit-Learn ML Models • OpenWeatherMap / Open-Meteo • ISRIC SoilGrids v2</p>
          </div>
          <SoilHorizonStrip className="w-32 my-0" />
        </div>
      </footer>
    </div>
  );
}
