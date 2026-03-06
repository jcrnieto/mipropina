"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, RefreshCw } from "lucide-react";

type Summary = {
  totalExperiencias: number;
  promedioGeneral: number;
  pctPositivas: number;
  pctNeutras: number;
  pctNegativas: number;
  pctConComentario: number;
};

type TrendPoint = {
  dia: string;
  total: number;
  promedio: number;
};

type DistributionPoint = {
  bucket: number;
  total: number;
};

type FeaturePoint = {
  featureName: string;
  muestras: number;
  promedio: number;
};

type WaiterPoint = {
  waiterId: string;
  name: string;
  lastName: string;
  muestras: number;
  promedio: number;
};

type ExperienceItem = {
  id: string;
  createdAt: string;
  comment: string | null;
  source: string;
  tableCode: string | null;
  waiterId: string | null;
  waiterName: string | null;
  stars1: number | null;
  stars2: number | null;
  stars3: number | null;
  stars4: number | null;
  stars5: number | null;
  overallScore: number;
};

type ExperiencesPayload = {
  items: ExperienceItem[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    returned: number;
  };
};

function formatDateInput(input: Date): string {
  const year = input.getUTCFullYear();
  const month = String(input.getUTCMonth() + 1).padStart(2, "0");
  const day = String(input.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toRangeIso(fromDate: string, toDate: string): { fromIso: string; toIso: string } {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T00:00:00.000Z`);
  const toExclusive = new Date(to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  return {
    fromIso: from.toISOString(),
    toIso: toExclusive.toISOString(),
  };
}

function buildTrendPolyline(data: TrendPoint[], width = 620, height = 220): string {
  if (data.length === 0) return "";
  const padding = 18;
  const values = data.map((item) => item.promedio);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 5);
  const span = max - min || 1;

  return data
    .map((item, index) => {
      const x =
        padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const y = height - padding - ((item.promedio - min) * (height - padding * 2)) / span;
      return `${x},${y}`;
    })
    .join(" ");
}

export function AnalyticsDashboard() {
  const now = new Date();
  const fromDefault = new Date(now);
  fromDefault.setUTCDate(fromDefault.getUTCDate() - 29);

  const [fromDate, setFromDate] = useState(formatDateInput(fromDefault));
  const [toDate, setToDate] = useState(formatDateInput(now));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [distribution, setDistribution] = useState<DistributionPoint[]>([]);
  const [features, setFeatures] = useState<FeaturePoint[]>([]);
  const [waiters, setWaiters] = useState<WaiterPoint[]>([]);
  const [experiences, setExperiences] = useState<ExperiencesPayload | null>(null);

  const query = useMemo(() => {
    const { fromIso, toIso } = toRangeIso(fromDate, toDate);
    const params = new URLSearchParams();
    params.set("from", fromIso);
    params.set("to", toIso);
    return params.toString();
  }, [fromDate, toDate]);

  const load = useCallback(async (refreshOnly = false) => {
    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [summaryRes, trendRes, distributionRes, featuresRes, waitersRes, experiencesRes] = await Promise.all([
        fetch(`/api/admin/analytics/summary?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/trend?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/distribution?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/features?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/waiters?${query}&minSamples=3`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/experiences?${query}&limit=20&offset=0`, { cache: "no-store" }),
      ]);

      const [summaryJson, trendJson, distributionJson, featuresJson, waitersJson, experiencesJson] = await Promise.all([
        summaryRes.json(),
        trendRes.json(),
        distributionRes.json(),
        featuresRes.json(),
        waitersRes.json(),
        experiencesRes.json(),
      ]);

      if (
        !summaryRes.ok ||
        !summaryJson?.ok ||
        !trendRes.ok ||
        !trendJson?.ok ||
        !distributionRes.ok ||
        !distributionJson?.ok ||
        !featuresRes.ok ||
        !featuresJson?.ok ||
        !waitersRes.ok ||
        !waitersJson?.ok ||
        !experiencesRes.ok ||
        !experiencesJson?.ok
      ) {
        throw new Error("No se pudo cargar analytics.");
      }

      setSummary(summaryJson.summary as Summary);
      setTrend((trendJson.trend ?? []) as TrendPoint[]);
      setDistribution((distributionJson.distribution ?? []) as DistributionPoint[]);
      setFeatures((featuresJson.features ?? []) as FeaturePoint[]);
      setWaiters((waitersJson.waiters ?? []) as WaiterPoint[]);
      setExperiences({
        items: (experiencesJson.items ?? []) as ExperienceItem[],
        pagination: experiencesJson.pagination as ExperiencesPayload["pagination"],
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar analytics.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const trendLine = useMemo(() => buildTrendPolyline(trend), [trend]);
  const maxDistribution = useMemo(
    () => Math.max(...distribution.map((item) => item.total), 1),
    [distribution],
  );

  return (
    <section
      id="analytics"
      className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#122443]">Analytics de Experiencias</h2>
          <p className="mt-1 text-sm text-[#607193]">
            Mide calidad de servicio y seguimiento de reseñas del restaurante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-3 py-2">
            <CalendarDays className="h-4 w-4 text-[#2f66dc]" />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="bg-transparent text-sm text-[#1b2c4e] outline-none"
            />
            <span className="text-xs text-[#7d8fb0]">a</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="bg-transparent text-sm text-[#1b2c4e] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              void load(true);
            }}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-5 text-sm text-[#607193]">
          Cargando analytics...
        </div>
      ) : null}

      {!isLoading && summary ? (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Experiencias</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2c52]">{summary.totalExperiencias}</p>
            </article>
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Promedio</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2c52]">{summary.promedioGeneral}</p>
            </article>
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Positivas</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a7f52]">{summary.pctPositivas}%</p>
            </article>
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Neutras</p>
              <p className="mt-1 text-2xl font-semibold text-[#956118]">{summary.pctNeutras}%</p>
            </article>
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Negativas</p>
              <p className="mt-1 text-2xl font-semibold text-[#a43a3a]">{summary.pctNegativas}%</p>
            </article>
            <article className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#607193]">Con comentario</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2c52]">{summary.pctConComentario}%</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-[#dfe6f3] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#1a2c52]">Tendencia diaria</h3>
              {trend.length === 0 ? (
                <p className="mt-3 text-sm text-[#607193]">Sin datos en este rango.</p>
              ) : (
                <div className="mt-3 rounded-lg border border-[#e6ecf8] bg-[#f7faff] p-2">
                  <svg viewBox="0 0 620 220" className="h-52 w-full">
                    <polyline
                      fill="none"
                      stroke="#2f66dc"
                      strokeWidth="3"
                      points={trendLine}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#607193]">
                    <span>{trend[0]?.dia}</span>
                    <span>{trend[trend.length - 1]?.dia}</span>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-xl border border-[#dfe6f3] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#1a2c52]">Distribucion de puntuacion</h3>
              <div className="mt-3 space-y-2">
                {distribution.map((item) => (
                  <div key={item.bucket} className="grid grid-cols-[30px_1fr_38px] items-center gap-2">
                    <span className="text-xs font-semibold text-[#1a2c52]">{item.bucket}</span>
                    <div className="h-2 rounded-full bg-[#ecf2ff]">
                      <div
                        className="h-2 rounded-full bg-[#2f66dc]"
                        style={{ width: `${(item.total * 100) / maxDistribution}%` }}
                      />
                    </div>
                    <span className="text-right text-xs text-[#607193]">{item.total}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-[#dfe6f3] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#1a2c52]">Ranking por criterio</h3>
              <div className="mt-3 space-y-2">
                {features.length === 0 ? (
                  <p className="text-sm text-[#607193]">Sin datos suficientes.</p>
                ) : (
                  features.map((item) => (
                    <div
                      key={item.featureName}
                      className="flex items-center justify-between rounded-lg border border-[#e6ecf8] bg-[#f7faff] px-3 py-2"
                    >
                      <p className="text-sm text-[#1b2c4e]">{item.featureName}</p>
                      <p className="text-sm font-semibold text-[#1b2c4e]">
                        {item.promedio} <span className="text-xs text-[#607193]">({item.muestras})</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#dfe6f3] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#1a2c52]">Ranking de mozos</h3>
              <div className="mt-3 space-y-2">
                {waiters.length === 0 ? (
                  <p className="text-sm text-[#607193]">
                    Aun no hay datos por mozo (se requiere waiter_id y minimo de muestras).
                  </p>
                ) : (
                  waiters.map((item) => (
                    <div
                      key={item.waiterId}
                      className="flex items-center justify-between rounded-lg border border-[#e6ecf8] bg-[#f7faff] px-3 py-2"
                    >
                      <p className="text-sm text-[#1b2c4e]">
                        {[item.name, item.lastName].filter(Boolean).join(" ").trim() || item.waiterId}
                      </p>
                      <p className="text-sm font-semibold text-[#1b2c4e]">
                        {item.promedio} <span className="text-xs text-[#607193]">({item.muestras})</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>

          <article className="mt-4 rounded-xl border border-[#dfe6f3] bg-white p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#2f66dc]" />
              <h3 className="text-sm font-semibold text-[#1a2c52]">Experiencias (detalle)</h3>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e6ecf8] text-left text-xs uppercase tracking-[0.08em] text-[#607193]">
                    <th className="px-2 py-2 font-semibold">Fecha</th>
                    <th className="px-2 py-2 font-semibold">Mozo</th>
                    <th className="px-2 py-2 font-semibold">Score</th>
                    <th className="px-2 py-2 font-semibold">Origen</th>
                    <th className="px-2 py-2 font-semibold">Mesa</th>
                    <th className="px-2 py-2 font-semibold">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {(experiences?.items ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-[#eef3ff]">
                      <td className="px-2 py-2 text-[#1b2c4e]">
                        {new Date(item.createdAt).toLocaleString("es-AR")}
                      </td>
                      <td className="px-2 py-2 text-[#1b2c4e]">{item.waiterName ?? "-"}</td>
                      <td className="px-2 py-2 font-semibold text-[#1b2c4e]">{item.overallScore}</td>
                      <td className="px-2 py-2 text-[#607193]">{item.source}</td>
                      <td className="px-2 py-2 text-[#607193]">{item.tableCode ?? "-"}</td>
                      <td className="max-w-[360px] truncate px-2 py-2 text-[#1b2c4e]">
                        {item.comment ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(experiences?.items?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-[#607193]">
                  No hay experiencias para este periodo.
                </p>
              ) : null}
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
