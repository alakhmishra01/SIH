"use client";

import React from "react";
import { CropRecommendResponse } from "@/lib/types";
import { CheckCircle2, Award, Info, AlertTriangle, ShieldCheck } from "lucide-react";

interface CropRecommendationProps {
  data: CropRecommendResponse;
}

export const CropRecommendation: React.FC<CropRecommendationProps> = ({ data }) => {
  const { recommendations, soil_summary, weather_summary, agronomic_advisory_flags } = data;

  return (
    <div className="ledger-card p-6 rounded-md mb-8 border-l-4 border-l-field-green">
      <div className="flex items-center justify-between pb-4 border-b border-stone mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-field-green font-semibold">
            RECOMMENDATION OUTPUT — TOP 3 AGRONOMIC MATCHES
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Optimal Crop Recommendations
          </h2>
        </div>
        <span className="px-3 py-1 bg-field-green/10 text-field-green border border-field-green/30 text-xs font-mono field-tag">
          CALIBRATED CLASSIFIER (PLATT SCALED)
        </span>
      </div>

      {/* Advisory Flags if any */}
      {agronomic_advisory_flags && agronomic_advisory_flags.length > 0 && (
        <div className="mb-6 space-y-2">
          {agronomic_advisory_flags.map((flag, idx) => (
            <div key={idx} className="p-3 bg-harvest-gold/10 border border-harvest-gold/30 rounded-sm text-xs font-mono text-ink flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-harvest-gold shrink-0 mt-0.5" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top 3 Crop Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {recommendations.map((rec) => {
          const isTopMatch = rec.rank === 1;
          const isWarning = rec.agro_suitability && rec.agro_suitability.toLowerCase().includes("incompat");
          return (
            <div
              key={rec.crop}
              className={`p-5 rounded-md border ${
                isTopMatch
                  ? "bg-paper border-field-green shadow-md"
                  : isWarning
                  ? "bg-subsoil-clay/5 border-subsoil-clay/40"
                  : "bg-paper/60 border-stone"
              } transition-all duration-200 relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs field-tag ${
                        isTopMatch
                          ? "bg-field-green text-paper"
                          : "bg-stone text-ink"
                      }`}
                    >
                      #{rec.rank}
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink">
                      {rec.crop}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 field-tag font-bold ${
                      isWarning
                        ? "bg-subsoil-clay text-paper"
                        : isTopMatch
                        ? "bg-field-green text-paper"
                        : "bg-stone/60 text-ink"
                    }`}
                  >
                    {rec.agro_suitability || "OPTIMAL"}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-ink/70">CALIBRATED PROBABILITY</span>
                    <span className="font-bold text-field-green font-mono text-sm">
                      {rec.confidence}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-stone/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-field-green h-full rounded-full"
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Suitability notes */}
                <p className="text-xs text-ink/80 font-body leading-relaxed border-t border-stone/50 pt-2 mb-3">
                  {rec.suitability_notes || "Soil NPK, temperature, and moisture conditions align with optimal physiological growth requirements."}
                </p>
              </div>

              {/* Feature contributions breakdown if present */}
              {rec.feature_contributions && (
                <div className="pt-2 border-t border-stone/40 text-[10px] font-mono text-ink/70 space-y-1">
                  <span className="text-ink/50 block uppercase text-[9px]">Physiological Concordance:</span>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(rec.feature_contributions).slice(0, 4).map(([f, val]) => (
                      <div key={f} className="flex justify-between">
                        <span className="truncate">{f}:</span>
                        <strong className="text-field-green">{val}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Summary Table */}
      <div className="bg-paper p-4 border border-stone rounded-sm">
        <div className="flex items-center gap-2 mb-2 text-xs font-mono text-ink/70 uppercase font-semibold">
          <Info className="w-3.5 h-3.5 text-field-green" />
          <span>PARAMETERS CONSUMED FOR INFERENCE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <span className="text-ink/50 block">N:</span>
            <strong className="text-ink font-mono">{soil_summary.N} kg/ha</strong>
          </div>
          <div>
            <span className="text-ink/50 block">P:</span>
            <strong className="text-ink font-mono">{soil_summary.P} kg/ha</strong>
          </div>
          <div>
            <span className="text-ink/50 block">K:</span>
            <strong className="text-ink font-mono">{soil_summary.K} kg/ha</strong>
          </div>
          <div>
            <span className="text-ink/50 block">pH:</span>
            <strong className="text-subsoil-clay font-mono">{soil_summary.ph}</strong>
          </div>
          <div>
            <span className="text-ink/50 block">TEMP:</span>
            <strong className="text-ink font-mono">{weather_summary.temp_c}°C</strong>
          </div>
          <div>
            <span className="text-ink/50 block">SEASONAL RAIN:</span>
            <strong className="text-field-green font-mono">{weather_summary.rainfall_seasonal_mm || weather_summary.rainfall_mm} mm</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
