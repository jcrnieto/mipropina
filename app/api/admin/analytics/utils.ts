export type AnalyticsDateRange = {
  from: Date;
  to: Date;
};

function isValidDate(input: Date): boolean {
  return Number.isFinite(input.getTime());
}

export function resolveAnalyticsDateRange(
  searchParams: URLSearchParams,
  defaultDays = 30,
): AnalyticsDateRange {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const now = new Date();
  const fallbackFrom = new Date(now);
  fallbackFrom.setDate(fallbackFrom.getDate() - defaultDays);

  const fromCandidate = fromRaw ? new Date(fromRaw) : fallbackFrom;
  const toCandidate = toRaw ? new Date(toRaw) : now;

  const from = isValidDate(fromCandidate) ? fromCandidate : fallbackFrom;
  const to = isValidDate(toCandidate) ? toCandidate : now;

  if (from.getTime() >= to.getTime()) {
    return {
      from: fallbackFrom,
      to: now,
    };
  }

  return { from, to };
}

export function readPositiveInt(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
  max: number,
): number {
  const value = searchParams.get(key);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}
