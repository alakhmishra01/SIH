"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6 bg-paper text-ink">
      <div className="max-w-md w-full border border-stone p-6 bg-paper rounded-md text-center">
        <h2 className="font-display text-xl font-bold text-subsoil-clay mb-2">
          Field Ledger Error
        </h2>
        <p className="text-xs font-mono mb-4 text-ink/80">
          {error.message || "An error occurred while loading field data."}
        </p>
        <button
          onClick={() => reset()}
          className="btn-field-primary px-4 py-2 text-xs font-mono"
        >
          RETRY LOAD
        </button>
      </div>
    </div>
  );
}
