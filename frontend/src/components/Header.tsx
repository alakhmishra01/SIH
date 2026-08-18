"use client";

import React, { useEffect, useState } from "react";
import { Sprout, Compass, Database, Activity } from "lucide-react";
import { getOrCreateSessionId } from "@/lib/api";

export const Header: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  return (
    <header className="border-b border-stone bg-paper/95 backdrop-blur-sm sticky top-0 z-50 py-4 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-field-green text-paper field-tag">
            <Sprout className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink flex items-center gap-2">
              FIELD LEDGER
              <span className="text-xs font-mono px-2 py-0.5 bg-harvest-gold/20 text-ink border border-harvest-gold/40 field-tag">
                v1.0 AGRONOMY
              </span>
            </h1>
            <p className="text-xs text-ink/70 font-body">
              Smart Crop Recommendation & Yield Prediction Notebook
            </p>
          </div>
        </div>

        {/* System Ledger Status Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink/80 bg-paper border border-stone p-2 px-3 field-tag">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-field-green" />
            <span>STATUS: <strong className="text-field-green">ONLINE</strong></span>
          </div>
          <span className="text-stone">|</span>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-subsoil-clay" />
            <span>REGION: <strong>INDIA AGRI-ZONE</strong></span>
          </div>
          <span className="text-stone">|</span>
          <div className="flex items-center gap-1.5 truncate max-w-[180px]">
            <Database className="w-3.5 h-3.5 text-ink/60" />
            <span className="truncate">SESS: {sessionId || "INITIALIZING..."}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
