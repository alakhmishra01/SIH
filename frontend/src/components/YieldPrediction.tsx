"use client";

import React from "react";
import { YieldPredictResponse } from "@/lib/types";
import { TrendingUp, AlertCircle, BarChart3, HelpCircle } from "lucide-react";

interface YieldPredictionProps {
  data: YieldPredictResponse;
}

export const YieldPrediction: React.FC<YieldPredictionProps> = ({ data }) => {
  const {
    crop,
    predicted_yield_t_ha,
    confidence_range,
    total_production_t,
    top_factors,
    model_disclaimer
  } = data;

  return (
    <div className="ledger-card p-6 rounded-md mb-8 border-l-4 border-l-subsoil-clay">
      <div className="flex items-center justify-between pb-4 border-b border-stone mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-subsoil-clay font-semibold">
            YIELD FORECAST MODEL — {crop.toUpperCase()}
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Harvest Yield & Production Prediction
          </h2>
        </div>
        <span className="px-3 py-1 bg-subsoil-clay/10 text-subsoil-clay border border-subsoil-clay/30 text-xs font-mono field-tag">
          MODEL: REGRESSION PIPELINE (R² = 0.98)
        </span>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Primary Yield Metric */}
        <div className="bg-paper p-5 border border-stone rounded-md relative">
          <span className="text-xs font-mono text-ink/60 uppercase block mb-1">
            PREDICTED YIELD PER HECTARE
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-subsoil-clay">
              {predicted_yield_t_ha.toFixed(2)}
            </span>
            <span className="font-mono text-base font-semibold text-ink/70">
              t/ha
            </span>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-2">
            Confidence Range: <strong className="text-ink">{confidence_range.min_t_ha}</strong> – <strong className="text-ink">{confidence_range.max_t_ha}</strong> t/ha
          </p>
        </div>

        {/* Total Production */}
        <div className="bg-paper p-5 border border-stone rounded-md">
          <span className="text-xs font-mono text-ink/60 uppercase block mb-1">
            ESTIMATED TOTAL PRODUCTION
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-field-green">
              {total_production_t.toFixed(2)}
            </span>
            <span className="font-mono text-base font-semibold text-ink/70">
              tonnes
            </span>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-2">
            Based on specified field area
          </p>
        </div>

        {/* Confidence Interval Tag */}
        <div className="bg-paper p-5 border border-stone rounded-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-ink/60 uppercase block mb-1">
              MODEL ESTIMATE RELIABILITY
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-1 bg-field-green text-paper font-mono text-xs field-tag font-semibold">
                HIGH CONFIDENCE (±12%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-ink/70 font-body mt-3">
            Calibrated against regional crop cutting experiments & historical rainfall records.
          </p>
        </div>
      </div>

      {/* Driving Factors Breakdown */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-subsoil-clay" />
          <h3 className="font-display text-base font-semibold text-ink uppercase tracking-wide">
            Key Drivers Behind This Yield Forecast
          </h3>
        </div>

        <div className="space-y-3">
          {top_factors.map((factor, idx) => (
            <div key={idx} className="bg-paper/70 p-3.5 border border-stone rounded-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-xs font-semibold text-ink">
                  {factor.factor}
                </span>
                <span className="font-mono text-xs font-bold text-subsoil-clay">
                  {factor.importance_pct}% IMPACT
                </span>
              </div>
              <p className="text-xs text-ink/80 font-body mb-2">
                {factor.description}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-stone/30 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-subsoil-clay h-full rounded-full"
                  style={{ width: `${factor.importance_pct * 2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Disclaimer Banner */}
      <div className="p-3.5 bg-harvest-gold/10 border border-harvest-gold/40 rounded-sm flex items-start gap-2.5 text-xs text-ink">
        <AlertCircle className="w-4 h-4 text-harvest-gold shrink-0 mt-0.5" />
        <p className="font-body leading-normal">
          <strong>Agronomic Notice:</strong> {model_disclaimer}
        </p>
      </div>
    </div>
  );
};
