"use client";

import React from "react";
import { AdvisoryResponse } from "@/lib/types";
import { AlertTriangle, CheckCircle, ShieldAlert, Thermometer, CloudRain, Droplets } from "lucide-react";

interface FieldAdvisoryProps {
  advisory: AdvisoryResponse;
}

export const FieldAdvisory: React.FC<FieldAdvisoryProps> = ({ advisory }) => {
  const { status, messages, weather_snapshot, soil_snapshot } = advisory;

  const statusConfig = {
    healthy: {
      label: "HEALTHY FIELD STATUS",
      bgColor: "bg-field-green/10",
      borderColor: "border-field-green",
      textColor: "text-field-green",
      badgeBg: "bg-field-green text-paper",
      icon: CheckCircle
    },
    warning: {
      label: "ACTION REQUIRED (WARNING)",
      bgColor: "bg-harvest-gold/10",
      borderColor: "border-harvest-gold",
      textColor: "text-harvest-gold",
      badgeBg: "bg-harvest-gold text-ink",
      icon: AlertTriangle
    },
    critical: {
      label: "CRITICAL ALERT (IMMEDIATE ACTION)",
      bgColor: "bg-subsoil-clay/10",
      borderColor: "border-subsoil-clay",
      textColor: "text-subsoil-clay",
      badgeBg: "bg-subsoil-clay text-paper",
      icon: ShieldAlert
    }
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`ledger-card p-6 rounded-md mb-8 border-l-4 ${statusConfig.borderColor}`}>
      <div className="flex items-center justify-between pb-4 border-b border-stone mb-6">
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${statusConfig.textColor}`} />
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-ink/60">
              SECTION 02 — AGRONOMIC RULE ENGINE
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Real-Time Field Advisory
            </h2>
          </div>
        </div>

        <span className={`px-3 py-1 font-mono text-xs field-tag font-bold ${statusConfig.badgeBg}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Advisory Action Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((msg, i) => {
          const isCritical = msg.severity === "critical";
          const isWarning = msg.severity === "warning";
          return (
            <div
              key={i}
              className={`p-4 rounded-sm border ${
                isCritical
                  ? "bg-subsoil-clay/15 border-subsoil-clay"
                  : isWarning
                  ? "bg-harvest-gold/15 border-harvest-gold"
                  : "bg-field-green/10 border-field-green"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs uppercase font-bold text-ink/70">
                  [{msg.category}]
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 field-tag ${
                    isCritical
                      ? "bg-subsoil-clay text-paper"
                      : isWarning
                      ? "bg-harvest-gold text-ink"
                      : "bg-field-green text-paper"
                  }`}
                >
                  {msg.severity}
                </span>
              </div>

              <h4 className="font-display text-base font-bold text-ink mb-1">
                {msg.title}
              </h4>
              <p className="text-xs text-ink/90 font-body leading-relaxed">
                <strong>Action Item:</strong> {msg.action_item}
              </p>
            </div>
          );
        })}
      </div>

      {/* Environmental Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-paper p-4 border border-stone rounded-sm">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-subsoil-clay" />
          <div>
            <span className="text-[11px] font-mono text-ink/60 block">TEMP</span>
            <strong className="font-mono text-sm">{weather_snapshot.temp_c}°C</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-field-green" />
          <div>
            <span className="text-[11px] font-mono text-ink/60 block">HUMIDITY</span>
            <strong className="font-mono text-sm">{weather_snapshot.humidity_pct}%</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-ink" />
          <div>
            <span className="text-[11px] font-mono text-ink/60 block">RAINFALL</span>
            <strong className="font-mono text-sm">{weather_snapshot.rainfall_mm} mm</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-subsoil-clay/20 border border-subsoil-clay flex items-center justify-center text-[9px] font-mono font-bold text-subsoil-clay">
            pH
          </div>
          <div>
            <span className="text-[11px] font-mono text-ink/60 block">SOIL pH</span>
            <strong className="font-mono text-sm">{soil_snapshot.ph}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
