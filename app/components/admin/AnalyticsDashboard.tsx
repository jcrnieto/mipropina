"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, ChevronDown, RefreshCw } from "lucide-react";

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
  status: "positive" | "neutral" | "negative";
  label: string;
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
  waiterServiceScore?: number | null;
  entryType?: string | null;
  lowestScore?: number | null;
  experienceStatus?: "positive" | "neutral" | "negative" | null;
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

type ExperienceFilter = "all" | "negative" | "neutral" | "positive" | "with-comment";

type ScoreItem = {
  label: string;
  score: number;
};

const INITIAL_EXPERIENCES_VISIBLE = 10;
const EXPERIENCES_VISIBLE_STEP = 10;

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

function buildTrendPoints(data: TrendPoint[], width = 620, height = 220) {
  if (data.length === 0) return [];
  const padding = 18;
  const values = data.map((item) => item.promedio);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 5);
  const span = max - min || 1;

  return data.map((item, index) => {
    const x =
      padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.promedio - min) * (height - padding * 2)) / span;
    return { x, y, dia: item.dia, promedio: item.promedio };
  });
}

function getStatusStyles(status?: ExperienceItem["experienceStatus"]) {
  if (status === "positive") {
    return {
      row: "border-[#bdebd2] bg-[#f2fbf6]",
      text: "text-[#137a4b]",
      score: "text-[#137a4b]",
      comment: "text-[#1b2c4e]",
    };
  }

  if (status === "neutral") {
    return {
      row: "border-[#f2d6a9] bg-[#fffaf1]",
      text: "text-[#956118]",
      score: "text-[#956118]",
      comment: "text-[#1b2c4e]",
    };
  }

  if (status === "negative") {
    return {
      row: "border-[#f7c7c7] bg-[#fff4f4]",
      text: "text-[#a43a3a]",
      score: "text-[#a43a3a]",
      comment: "font-medium text-[#8f1d1d]",
    };
  }

  return {
    row: "border-[#eef3ff]",
    text: "text-[#1b2c4e]",
    score: "text-[#1b2c4e]",
    comment: "text-[#1b2c4e]",
  };
}

function toFiniteScore(input: number | null | undefined): number | null {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}

function getExperienceScores(item: ExperienceItem): number[] {
  return [
    item.waiterServiceScore,
    item.stars1,
    item.stars2,
    item.stars3,
    item.stars4,
    item.stars5,
  ]
    .map((score) => toFiniteScore(score))
    .filter((score): score is number => score !== null);
}

function getScoreItems(item: ExperienceItem): ScoreItem[] {
  const items = [
    { label: "Atención mozo", score: toFiniteScore(item.waiterServiceScore) },
    { label: "Criterio 1", score: toFiniteScore(item.stars1) },
    { label: "Criterio 2", score: toFiniteScore(item.stars2) },
    { label: "Criterio 3", score: toFiniteScore(item.stars3) },
    { label: "Criterio 4", score: toFiniteScore(item.stars4) },
    { label: "Criterio 5", score: toFiniteScore(item.stars5) },
  ];

  return items.filter((entry): entry is ScoreItem => entry.score !== null);
}

function getExperienceSignalStatus(item: ExperienceItem): "positive" | "neutral" | "negative" | null {
  const scores = getExperienceScores(item);
  if (scores.length === 0) {
    return item.experienceStatus ?? null;
  }

  if (scores.some((score) => score <= 2)) {
    return "negative";
  }

  if (scores.some((score) => score === 3)) {
    return "neutral";
  }

  return "positive";
}

function getStatusLabel(status: "positive" | "neutral" | "negative" | null) {
  if (status === "positive") return "Positiva";
  if (status === "neutral") return "Neutra";
  if (status === "negative") return "Negativa";
  return "Sin puntaje";
}

function getStatusBadgeClass(status: "positive" | "neutral" | "negative" | null) {
  if (status === "positive") return "border-[#bdebd2] bg-[#f2fbf6] text-[#137a4b]";
  if (status === "neutral") return "border-[#f2d6a9] bg-[#fffaf1] text-[#956118]";
  if (status === "negative") return "border-[#f7c7c7] bg-[#fff4f4] text-[#a43a3a]";
  return "border-[#dfe6f3] bg-[#f7faff] text-[#607193]";
}

function getDistributionBarColor(status: DistributionPoint["status"]) {
  if (status === "positive") return "bg-[#1a7f52]";
  if (status === "neutral") return "bg-[#b5791f]";
  return "bg-[#a43a3a]";
}

export function AnalyticsDashboard({ brandSlug, restaurantSlug }: { brandSlug: string; restaurantSlug?: string }) {
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
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>("all");
  const [visibleExperiences, setVisibleExperiences] = useState(INITIAL_EXPERIENCES_VISIBLE);
  const [expandedExperienceId, setExpandedExperienceId] = useState<string | null>(null);

  const query = useMemo(() => {
    const { fromIso, toIso } = toRangeIso(fromDate, toDate);
    const params = new URLSearchParams();
    params.set("from", fromIso);
    params.set("to", toIso);
    params.set("brandSlug", brandSlug);
    if (restaurantSlug) {
      params.set("restaurantSlug", restaurantSlug);
    }
    return params.toString();
  }, [brandSlug, restaurantSlug, fromDate, toDate]);

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
        fetch(`/api/admin/analytics/waiters?${query}&minSamples=1`, { cache: "no-store" }),
        fetch(`/api/admin/analytics/experiences?${query}&limit=200&offset=0`, { cache: "no-store" }),
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

  useEffect(() => {
    setVisibleExperiences(INITIAL_EXPERIENCES_VISIBLE);
    setExpandedExperienceId(null);
  }, [experienceFilter, experiences]);

  const trendLine = useMemo(() => buildTrendPolyline(trend), [trend]);
  const trendPoints = useMemo(() => buildTrendPoints(trend), [trend]);
  const maxDistribution = useMemo(
    () => Math.max(...distribution.map((item) => item.total), 1),
    [distribution],
  );
  const filteredExperiences = useMemo(() => {
    const experienceItems = experiences?.items ?? [];

    return experienceItems.filter((item) => {
      if (experienceFilter === "all") return true;
      if (experienceFilter === "with-comment") return Boolean(item.comment?.trim());
      return getExperienceSignalStatus(item) === experienceFilter;
    });
  }, [experienceFilter, experiences]);
  const displayedExperiences = filteredExperiences.slice(0, visibleExperiences);
  const hasMoreVisibleExperiences = visibleExperiences < filteredExperiences.length;
  const experienceFilters: Array<{ key: ExperienceFilter; label: string }> = [
    { key: "all", label: "Todas" },
    { key: "negative", label: "Negativas" },
    { key: "neutral", label: "Neutras" },
    { key: "positive", label: "Positivas" },
    { key: "with-comment", label: "Con comentario" },
  ];

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
                    {trendLine ? (
                      <polyline
                        fill="none"
                        stroke="#2f66dc"
                        strokeWidth="3"
                        points={trendLine}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                    {trendPoints.map((point) => (
                      <circle key={`${point.dia}-${point.promedio}`} cx={point.x} cy={point.y} r="5" fill="#2f66dc" />
                    ))}
                  </svg>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#607193]">
                    <span>{trend[0]?.dia}</span>
                    <span>{trend[trend.length - 1]?.dia}</span>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-xl border border-[#dfe6f3] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#1a2c52]">Resultado de experiencias</h3>
              <div className="mt-3 space-y-2">
                {distribution.map((item) => (
                  <div key={item.status} className="grid grid-cols-[86px_1fr_38px] items-center gap-2">
                    <span className="text-xs font-semibold text-[#1a2c52]">{item.label}</span>
                    <div className="h-2 rounded-full bg-[#ecf2ff]">
                      <div
                        className={`h-2 rounded-full ${getDistributionBarColor(item.status)}`}
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
                    Aun no hay datos por mozo (se requieren evaluaciones de atencion del mozo y minimo de muestras).
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-2">
                <BarChart3 className="mt-0.5 h-4 w-4 text-[#2f66dc]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1a2c52]">Experiencias recientes</h3>
                  <p className="mt-1 text-xs text-[#607193]">
                    Mostramos una vista compacta. Abrí cada experiencia para ver el detalle completo.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {experienceFilters.map((filter) => {
                  const isActive = experienceFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setExperienceFilter(filter.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "border-[#2f66dc] bg-[#2f66dc] text-white shadow-[0_8px_18px_rgba(47,102,220,0.18)]"
                          : "border-[#dfe6f3] bg-[#f8fbff] text-[#607193] hover:border-[#b9c7e6] hover:text-[#1a2c52]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-xl border border-[#e6ecf8] md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e6ecf8] bg-[#f8fbff] text-left text-xs uppercase tracking-[0.08em] text-[#607193]">
                    <th className="px-3 py-3 font-semibold">Fecha</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Promedio</th>
                    <th className="px-3 py-3 font-semibold">Comentario</th>
                    <th className="px-3 py-3 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedExperiences.map((item) => {
                    const signalStatus = getExperienceSignalStatus(item);
                    const statusStyles = getStatusStyles(signalStatus);
                    const isExpanded = expandedExperienceId === item.id;
                    const scoreItems = getScoreItems(item);

                    return (
                      <Fragment key={item.id}>
                        <tr className={`border-b border-[#e6ecf8] ${statusStyles.row}`}>
                          <td className="px-3 py-3 text-[#1b2c4e]">
                            {new Date(item.createdAt).toLocaleString("es-AR")}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(signalStatus)}`}
                            >
                              {getStatusLabel(signalStatus)}
                            </span>
                          </td>
                          <td className={`px-3 py-3 text-base font-semibold ${statusStyles.score}`}>
                            {item.overallScore}
                          </td>
                          <td className={`max-w-[460px] truncate px-3 py-3 ${statusStyles.comment}`}>
                            {item.comment ?? "Sin comentario"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedExperienceId(isExpanded ? null : item.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f66dc] transition hover:bg-[#f7f9ff]"
                            >
                              {isExpanded ? "Ocultar" : "Ver detalle"}
                              <ChevronDown className={`h-3.5 w-3.5 transition ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-[#e6ecf8] bg-white">
                            <td colSpan={5} className="px-3 py-4">
                              <div className="grid gap-3 rounded-xl border border-[#e6ecf8] bg-[#f8fbff] p-4 lg:grid-cols-[1.1fr_1fr]">
                                <div className="space-y-2">
                                  <p className="text-xs uppercase tracking-[0.12em] text-[#607193]">Comentario</p>
                                  <p className="text-sm font-medium text-[#1b2c4e]">
                                    {item.comment ?? "Sin comentario"}
                                  </p>
                                </div>
                                <div className="grid gap-2 text-sm text-[#1b2c4e] sm:grid-cols-2">
                                  <p>
                                    <span className="font-semibold">Mozo:</span> {item.waiterName ?? "-"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Mesa:</span> {item.tableCode ?? "-"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Origen:</span> {item.source}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Atención mozo:</span>{" "}
                                    {item.waiterServiceScore ?? "-"}
                                  </p>
                                </div>
                                {scoreItems.length > 0 ? (
                                  <div className="lg:col-span-2">
                                    <p className="text-xs uppercase tracking-[0.12em] text-[#607193]">Puntajes</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {scoreItems.map((scoreItem) => (
                                        <span
                                          key={`${item.id}-${scoreItem.label}`}
                                          className="rounded-full border border-[#dfe6f3] bg-white px-3 py-1 text-xs font-semibold text-[#1b2c4e]"
                                        >
                                          {scoreItem.label}: {scoreItem.score}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {displayedExperiences.map((item) => {
                const signalStatus = getExperienceSignalStatus(item);
                const statusStyles = getStatusStyles(signalStatus);
                const isExpanded = expandedExperienceId === item.id;

                return (
                  <div key={item.id} className={`rounded-xl border p-4 ${statusStyles.row}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(signalStatus)}`}
                        >
                          {getStatusLabel(signalStatus)} · Promedio {item.overallScore}
                        </span>
                        <p className={`mt-3 line-clamp-2 text-sm ${statusStyles.comment}`}>
                          {item.comment ?? "Sin comentario"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedExperienceId(isExpanded ? null : item.id)}
                        className="rounded-full border border-[#d6dfef] bg-white p-2 text-[#2f66dc]"
                        aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                      >
                        <ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#607193]">
                      <span>{new Date(item.createdAt).toLocaleString("es-AR")}</span>
                      <span>Mozo: {item.waiterName ?? "-"}</span>
                      <span>Mesa: {item.tableCode ?? "-"}</span>
                      <span>Origen: {item.source}</span>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 rounded-lg border border-[#e6ecf8] bg-white/70 p-3 text-sm text-[#1b2c4e]">
                        <p>
                          <span className="font-semibold">Comentario:</span> {item.comment ?? "Sin comentario"}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold">Atención mozo:</span> {item.waiterServiceScore ?? "-"}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold">Puntajes:</span>{" "}
                          {[item.stars1, item.stars2, item.stars3, item.stars4, item.stars5]
                            .filter((score) => toFiniteScore(score) !== null)
                            .join(" · ") || "-"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {filteredExperiences.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#607193]">
                No hay experiencias para este filtro en el periodo seleccionado.
              </p>
            ) : null}

            {filteredExperiences.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#607193]">
                  Mostrando {displayedExperiences.length} de {filteredExperiences.length} experiencias.
                </p>
                {hasMoreVisibleExperiences ? (
                  <button
                    type="button"
                    onClick={() => setVisibleExperiences((current) => current + EXPERIENCES_VISIBLE_STEP)}
                    className="inline-flex items-center justify-center rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#2f66dc] transition hover:bg-[#eef4ff]"
                  >
                    Ver más
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        </>
      ) : null}
    </section>
  );
}
