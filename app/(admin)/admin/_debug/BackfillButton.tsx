"use client";
import React from "react";

export default function BackfillButton() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<unknown>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/backfill-onboarding", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white"
        disabled={loading}
      >
        {loading ? "Ejecutando..." : "Backfill publicMetadata"}
      </button>
      {result ? (
        <pre className="mt-3 rounded-md border bg-white p-3 text-sm">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </div>
  );
}
