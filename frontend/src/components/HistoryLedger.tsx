"use client";

import React, { useEffect, useState } from "react";
import { HistoryResponse, HistoryRecord } from "@/lib/types";
import { getHistory } from "@/lib/api";
import { BookOpen, RefreshCw, FileText } from "lucide-react";

export const HistoryLedger: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data: HistoryResponse = await getHistory();
      setHistoryData(data.records || []);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="ledger-card p-6 rounded-md mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-stone mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-ink" />
          <h2 className="font-display text-xl font-semibold text-ink">
            Historical Field Records & Inference Logs
          </h2>
        </div>

        <button
          onClick={fetchHistory}
          className="btn-field-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center font-mono text-xs text-ink/60">
          Loading session logbook...
        </div>
      ) : historyData.length === 0 ? (
        <div className="py-8 text-center font-mono text-xs text-ink/60 bg-paper/40 border border-stone rounded-sm">
          No historical records logged for this session yet. Run a crop recommendation or yield prediction above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-stone text-ink/70 uppercase">
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">INPUT PARAMETERS</th>
                <th className="py-2.5 px-3">MODEL RESULT SUMMARY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/60">
              {historyData.map((rec) => {
                const isRec = rec.type === "recommendation";
                const dateStr = rec.created_at ? new Date(rec.created_at).toLocaleString() : "Recently";
                
                return (
                  <tr key={rec.id} className="hover:bg-paper/80 transition-colors">
                    <td className="py-3 px-3 text-ink/60 whitespace-nowrap">
                      {dateStr}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 field-tag text-[10px] uppercase font-bold ${
                          isRec
                            ? "bg-field-green text-paper"
                            : "bg-subsoil-clay text-paper"
                        }`}
                      >
                        {isRec ? "CROP REC" : "YIELD FORECAST"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-ink max-w-xs truncate">
                      {isRec ? (
                        <>N:{rec.input_data.N} P:{rec.input_data.P} K:{rec.input_data.K} pH:{rec.input_data.ph}</>
                      ) : (
                        <>{rec.input_data.crop} ({rec.input_data.area_ha} ha in {rec.input_data.state})</>
                      )}
                    </td>

                    <td className="py-3 px-3 text-ink font-bold">
                      {isRec ? (
                        <>
                          #1: {rec.result_data.recommendations?.[0]?.crop} ({rec.result_data.recommendations?.[0]?.confidence}%)
                        </>
                      ) : (
                        <>
                          {rec.result_data.predicted_yield_t_ha} t/ha (Total: {rec.result_data.total_production_t} t)
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
