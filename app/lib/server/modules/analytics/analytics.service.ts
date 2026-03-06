import { getRatingConfigByClerkId } from "@/app/lib/server/modules/rating-config/rating-config.service";
import { supabaseRestRequest } from "@/app/lib/server/supabase/client";
import { listEmployeesByClerkId } from "@/app/lib/server/modules/waiters/waiters.service";

type RatingSubmissionRow = {
  id: string;
  created_at: string;
  comment: string | null;
  source: string | null;
  table_code: string | null;
  waiter_id: string | null;
  stars_1: number | null;
  stars_2: number | null;
  stars_3: number | null;
  stars_4: number | null;
  stars_5: number | null;
};

type DateRangeInput = {
  from: Date;
  to: Date;
};

type DateRangeIso = {
  fromIso: string;
  toIso: string;
};

type StatsAccumulator = {
  total: number;
  sumScore: number;
  positives: number;
  neutrals: number;
  negatives: number;
  withComment: number;
};

type WaiterAggregate = {
  waiterId: string;
  name: string;
  lastName: string;
  muestras: number;
  scoreSum: number;
};

const RATING_SELECT =
  "id,created_at,comment,source,table_code,waiter_id,stars_1,stars_2,stars_3,stars_4,stars_5";

function formatDateRange(input: DateRangeInput): DateRangeIso {
  return {
    fromIso: input.from.toISOString(),
    toIso: input.to.toISOString(),
  };
}

function toFiniteNumber(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getOverallScore(row: RatingSubmissionRow): number | null {
  const stars = [row.stars_1, row.stars_2, row.stars_3, row.stars_4, row.stars_5]
    .map((item) => toFiniteNumber(item))
    .filter((item): item is number => item !== null);

  if (stars.length === 0) {
    return null;
  }

  const sum = stars.reduce((accumulator, item) => accumulator + item, 0);
  return sum / stars.length;
}

async function listRatingSubmissionsByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  limit?: number;
  offset?: number;
}): Promise<RatingSubmissionRow[]> {
  const { fromIso, toIso } = formatDateRange(input.range);
  const encodedAuthId = encodeURIComponent(input.clerkUserId);
  const encodedFrom = encodeURIComponent(fromIso);
  const encodedTo = encodeURIComponent(toIso);
  const limitQuery = typeof input.limit === "number" ? `&limit=${input.limit}` : "";
  const offsetQuery = typeof input.offset === "number" ? `&offset=${input.offset}` : "";

  const response = await supabaseRestRequest(
    `/rest/v1/rating_submission_mipropina?auth_user_id=eq.${encodedAuthId}&created_at=gte.${encodedFrom}&created_at=lt.${encodedTo}&select=${RATING_SELECT}&order=created_at.desc${limitQuery}${offsetQuery}`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as RatingSubmissionRow[];
}

function buildSummary(rows: RatingSubmissionRow[]) {
  const accumulator: StatsAccumulator = {
    total: rows.length,
    sumScore: 0,
    positives: 0,
    neutrals: 0,
    negatives: 0,
    withComment: 0,
  };

  let scored = 0;
  for (const row of rows) {
    const score = getOverallScore(row);
    if (score !== null) {
      scored += 1;
      accumulator.sumScore += score;
      if (score >= 4) accumulator.positives += 1;
      else if (score >= 3) accumulator.neutrals += 1;
      else accumulator.negatives += 1;
    }

    if (row.comment && row.comment.trim().length > 0) {
      accumulator.withComment += 1;
    }
  }

  const divisor = scored > 0 ? scored : 1;
  const totalDivisor = rows.length > 0 ? rows.length : 1;
  return {
    totalExperiencias: rows.length,
    promedioGeneral: Number((accumulator.sumScore / divisor).toFixed(2)),
    pctPositivas: Number(((accumulator.positives * 100) / divisor).toFixed(1)),
    pctNeutras: Number(((accumulator.neutrals * 100) / divisor).toFixed(1)),
    pctNegativas: Number(((accumulator.negatives * 100) / divisor).toFixed(1)),
    pctConComentario: Number(((accumulator.withComment * 100) / totalDivisor).toFixed(1)),
  };
}

function buildTrend(rows: RatingSubmissionRow[]) {
  const grouped = new Map<string, { total: number; sum: number; scored: number }>();

  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    const score = getOverallScore(row);
    const current = grouped.get(day) ?? { total: 0, sum: 0, scored: 0 };
    current.total += 1;
    if (score !== null) {
      current.sum += score;
      current.scored += 1;
    }
    grouped.set(day, current);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([dia, data]) => ({
      dia,
      total: data.total,
      promedio: Number((data.sum / (data.scored || 1)).toFixed(2)),
    }));
}

function buildDistribution(rows: RatingSubmissionRow[]) {
  const buckets = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);

  for (const row of rows) {
    const score = getOverallScore(row);
    if (score === null) continue;
    const rounded = Math.max(1, Math.min(5, Math.round(score)));
    buckets.set(rounded, (buckets.get(rounded) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([bucket, total]) => ({
    bucket,
    total,
  }));
}

function buildFeatureRanking(rows: RatingSubmissionRow[], features: string[]) {
  const accumulators = features.map((feature) => ({
    featureName: feature,
    muestras: 0,
    sum: 0,
  }));

  for (const row of rows) {
    const stars = [row.stars_1, row.stars_2, row.stars_3, row.stars_4, row.stars_5].map((item) =>
      toFiniteNumber(item),
    );
    stars.forEach((star, index) => {
      const accumulator = accumulators[index];
      if (!accumulator || star === null) return;
      accumulator.muestras += 1;
      accumulator.sum += star;
    });
  }

  return accumulators
    .filter((item) => item.muestras > 0)
    .map((item) => ({
      featureName: item.featureName,
      muestras: item.muestras,
      promedio: Number((item.sum / item.muestras).toFixed(2)),
    }))
    .sort((left, right) => left.promedio - right.promedio);
}

function buildWaiterRanking(rows: RatingSubmissionRow[], waiters: Array<{ id: string; firstName: string; lastName: string }>, minSamples: number) {
  const byId = new Map<string, WaiterAggregate>();
  const waiterMap = new Map(
    waiters.map((waiter) => [waiter.id, { name: waiter.firstName, lastName: waiter.lastName }]),
  );

  for (const row of rows) {
    if (!row.waiter_id) continue;
    const score = getOverallScore(row);
    if (score === null) continue;

    const waiterInfo = waiterMap.get(row.waiter_id) ?? { name: "", lastName: "" };
    const current =
      byId.get(row.waiter_id) ??
      {
        waiterId: row.waiter_id,
        name: waiterInfo.name,
        lastName: waiterInfo.lastName,
        muestras: 0,
        scoreSum: 0,
      };
    current.muestras += 1;
    current.scoreSum += score;
    byId.set(row.waiter_id, current);
  }

  return [...byId.values()]
    .filter((item) => item.muestras >= minSamples)
    .map((item) => ({
      waiterId: item.waiterId,
      name: item.name,
      lastName: item.lastName,
      muestras: item.muestras,
      promedio: Number((item.scoreSum / item.muestras).toFixed(2)),
    }))
    .sort((left, right) => right.promedio - left.promedio);
}

function buildExperiences(
  rows: RatingSubmissionRow[],
  waiters: Array<{ id: string; firstName: string; lastName: string }>,
) {
  const waiterMap = new Map(waiters.map((waiter) => [waiter.id, waiter]));

  return rows.map((row) => {
    const waiter = row.waiter_id ? waiterMap.get(row.waiter_id) : undefined;
    return {
      id: row.id,
      createdAt: row.created_at,
      comment: row.comment,
      source: row.source ?? "qr",
      tableCode: row.table_code,
      waiterId: row.waiter_id,
      waiterName: waiter ? `${waiter.firstName} ${waiter.lastName}`.trim() : null,
      stars1: row.stars_1,
      stars2: row.stars_2,
      stars3: row.stars_3,
      stars4: row.stars_4,
      stars5: row.stars_5,
      overallScore: Number((getOverallScore(row) ?? 0).toFixed(2)),
    };
  });
}

export async function getAnalyticsSummaryByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
}) {
  const rows = await listRatingSubmissionsByClerkId({
    clerkUserId: input.clerkUserId,
    range: input.range,
  });
  return buildSummary(rows);
}

export async function getAnalyticsTrendByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
}) {
  const rows = await listRatingSubmissionsByClerkId({
    clerkUserId: input.clerkUserId,
    range: input.range,
  });
  return buildTrend(rows);
}

export async function getAnalyticsDistributionByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
}) {
  const rows = await listRatingSubmissionsByClerkId({
    clerkUserId: input.clerkUserId,
    range: input.range,
  });
  return buildDistribution(rows);
}

export async function getAnalyticsFeatureRankingByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
}) {
  const [rows, config] = await Promise.all([
    listRatingSubmissionsByClerkId({
      clerkUserId: input.clerkUserId,
      range: input.range,
    }),
    getRatingConfigByClerkId(input.clerkUserId),
  ]);

  return buildFeatureRanking(rows, config?.features ?? []);
}

export async function getAnalyticsWaiterRankingByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  minSamples: number;
}) {
  const [rows, waiters] = await Promise.all([
    listRatingSubmissionsByClerkId({
      clerkUserId: input.clerkUserId,
      range: input.range,
    }),
    listEmployeesByClerkId(input.clerkUserId),
  ]);

  return buildWaiterRanking(rows, waiters, input.minSamples);
}

export async function getAnalyticsExperiencesByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  limit: number;
  offset: number;
}) {
  const pageSize = Math.max(1, input.limit);
  const rows = await listRatingSubmissionsByClerkId({
    clerkUserId: input.clerkUserId,
    range: input.range,
    limit: pageSize + 1,
    offset: input.offset,
  });
  const waiters = await listEmployeesByClerkId(input.clerkUserId);

  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    items: buildExperiences(slice, waiters),
    pagination: {
      limit: pageSize,
      offset: input.offset,
      hasMore,
      returned: slice.length,
    },
  };
}
