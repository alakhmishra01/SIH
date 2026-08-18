"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F3EFDD] text-[#2B2118] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#D8CFB4] p-6 bg-[#F3EFDD] rounded-md text-center">
          <h2 className="font-serif text-2xl font-bold text-[#8C4A2C] mb-2">
            Agronomic System Error
          </h2>
          <p className="text-xs font-mono mb-4 text-[#2B2118]/80">
            {error.message || "An unexpected error occurred in the Field Ledger workspace."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#3F5C33] text-[#F3EFDD] text-xs font-mono uppercase rounded-sm hover:bg-[#2B2118]"
          >
            Reset Workspace
          </button>
        </div>
      </body>
    </html>
  );
}
