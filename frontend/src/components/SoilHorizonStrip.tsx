"use client";

import React from "react";

interface SoilHorizonStripProps {
  loading?: boolean;
  className?: string;
  label?: string;
}

export const SoilHorizonStrip: React.FC<SoilHorizonStripProps> = ({
  loading = false,
  className = "",
  label
}) => {
  return (
    <div className={`w-full my-6 ${className}`}>
      {loading && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-subsoil-clay uppercase tracking-wider font-semibold animate-pulse">
            {label || "Running Agronomic Soil & Yield Inference..."}
          </span>
          <span className="font-mono text-xs text-ink">SOIL HORIZON PROBE ACTIVE</span>
        </div>
      )}
      
      <div className="h-2 w-full flex rounded-full overflow-hidden border border-stone bg-paper relative">
        {loading ? (
          <div className="h-full bg-gradient-to-r from-paper via-subsoil-clay to-ink animate-horizon-fill w-full" />
        ) : (
          <>
            <div className="flex-[3]" style={{ background: "#F3EFDD" }} title="Topsoil (O/A Horizon)" />
            <div className="flex-[2]" style={{ background: "#D8CFB4" }} title="Eluvial (E Horizon)" />
            <div className="flex-[3]" style={{ background: "#8C4A2C" }} title="Subsoil Clay (B Horizon)" />
            <div className="flex-[2]" style={{ background: "#2B2118" }} title="Parent Bedrock (C/R Horizon)" />
          </>
        )}
      </div>
    </div>
  );
};
