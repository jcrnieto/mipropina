import {
  getOwnerByBrandSlug,
  getPrimaryRestaurantByClerkId,
  getRestaurantByBrandSlugAndRestaurantSlug,
} from "@/app/lib/server/modules/restaurants/restaurants.service";
import {
  getRatingConfigByBrandSlug,
  getRatingConfigByClerkId,
} from "@/app/lib/server/modules/rating-config/rating-config.service";
import { supabaseRestRequest } from "@/app/lib/server/supabase/client";
import {
  listEmployeesByBrandSlug,
  listEmployeesByClerkId,
} from "@/app/lib/server/modules/waiters/waiters.service";

type RatingSubmissionRow = {
  id: string;
  created_at: string;
  comment: string | null;
  source: string | null;
  table_code: string | null;
  waiter_id: string | null;
  waiter_service_stars: number | null;
  entry_type: string | null;
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
  positives: number;
  neutrals: number;
  negatives: number;
  withComment: number;
  sumScore: number;
  scored: number;
};

type WaiterAggregate = {
  waiterId: string;
  name: string;
  lastName: string;
  muestras: number;
  scoreSum: number;
};

const RATING_SELECT =
  "id,created_at,comment,source,table_code,waiter_id,waiter_service_stars,entry_type,stars_1,stars_2,stars_3,stars_4,stars_5";

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
  const stars = getExperienceScores(row);

  if (stars.length === 0) {
    return null;
  }

  const sum = stars.reduce((accumulator, item) => accumulator + item, 0);
  return sum / stars.length;
}

function getExperienceScores(row: RatingSubmissionRow): number[] {
  return [
    row.waiter_service_stars,
    row.stars_1,
    row.stars_2,
    row.stars_3,
    row.stars_4,
    row.stars_5,
  ]
    .map((item) => toFiniteNumber(item))
    .filter((item): item is number => item !== null);
}

function classifyExperience(row: RatingSubmissionRow): "positive" | "neutral" | "negative" | null {
  const score = getOverallScore(row);
  if (score === null) {
    return null;
  }

  if (score >= 4) {
    return "positive";
  }

  if (score >= 3) {
    return "neutral";
  }

  return "negative";
}

function getLowestScore(row: RatingSubmissionRow): number | null {
  const scores = getExperienceScores(row);
  if (scores.length === 0) {
    return null;
  }

  return Math.min(...scores);
}

async function listRatingSubmissionsByRestaurantId(input: {
  restaurantId: string;
  range: DateRangeInput;
  limit?: number;
  offset?: number;
}): Promise<RatingSubmissionRow[]> {
  const { fromIso, toIso } = formatDateRange(input.range);
  const encodedRestaurantId = encodeURIComponent(input.restaurantId);
  const encodedFrom = encodeURIComponent(fromIso);
  const encodedTo = encodeURIComponent(toIso);
  const limitQuery = typeof input.limit === "number" ? `&limit=${input.limit}` : "";
  const offsetQuery = typeof input.offset === "number" ? `&offset=${input.offset}` : "";

  const response = await supabaseRestRequest(
    `/rest/v1/rating_submission_mipropina?restaurant_id=eq.${encodedRestaurantId}&created_at=gte.${encodedFrom}&created_at=lt.${encodedTo}&select=${RATING_SELECT}&order=created_at.desc${limitQuery}${offsetQuery}`,
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
    positives: 0,
    neutrals: 0,
    negatives: 0,
    withComment: 0,
    sumScore: 0,
    scored: 0,
  };

  for (const row of rows) {
    const score = getOverallScore(row);
    const classification = classifyExperience(row);
    if (score !== null) {
      accumulator.scored += 1;
      accumulator.sumScore += score;
    }

    if (classification === "positive") {
      accumulator.positives += 1;
    } else if (classification === "negative") {
      accumulator.negatives += 1;
    } else if (classification === "neutral") {
      accumulator.neutrals += 1;
    }

    if (row.comment && row.comment.trim().length > 0) {
      accumulator.withComment += 1;
    }
  }

  const divisor = rows.length > 0 ? rows.length : 1;
  const scoreDivisor = accumulator.scored > 0 ? accumulator.scored : 1;
  const totalDivisor = rows.length > 0 ? rows.length : 1;
  return {
    totalExperiencias: rows.length,
    promedioGeneral: Number((accumulator.sumScore / scoreDivisor).toFixed(2)),
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
  const buckets = new Map<"positive" | "neutral" | "negative", { label: string; total: number }>([
    ["positive", { label: "Positivas", total: 0 }],
    ["neutral", { label: "Neutras", total: 0 }],
    ["negative", { label: "Negativas", total: 0 }],
  ]);

  for (const row of rows) {
    const classification = classifyExperience(row);
    if (!classification) continue;
    const current = buckets.get(classification);
    if (!current) continue;
    current.total += 1;
  }

  return [...buckets.entries()].map(([status, data]) => ({
    status,
    label: data.label,
    total: data.total,
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

function buildWaiterRanking(
  rows: RatingSubmissionRow[],
  waiters: Array<{ id: string; name: string | null; last_name: string | null }>,
  minSamples: number,
) {
  const byId = new Map<string, WaiterAggregate>();
  const waiterMap = new Map(
    waiters.map((waiter) => [waiter.id, { name: waiter.name ?? "", lastName: waiter.last_name ?? "" }]),
  );

  for (const row of rows) {
    if (!row.waiter_id) continue;
    const score = toFiniteNumber(row.waiter_service_stars);
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
  waiters: Array<{ id: string; name: string | null; last_name: string | null }>,
) {
  const waiterMap = new Map(waiters.map((waiter) => [waiter.id, waiter]));

  return rows.map((row) => {
    const waiter = row.waiter_id ? waiterMap.get(row.waiter_id) : undefined;
    const waiterName = waiter ? [waiter.name, waiter.last_name].filter(Boolean).join(" ").trim() : "";
    const lowestScore = getLowestScore(row);
    const classification = classifyExperience(row);
    return {
      id: row.id,
      createdAt: row.created_at,
      comment: row.comment,
      source: row.source ?? "qr",
      tableCode: row.table_code,
      waiterId: row.waiter_id,
      waiterName: waiterName || null,
      waiterServiceScore: row.waiter_service_stars,
      entryType: row.entry_type,
      lowestScore,
      experienceStatus: classification,
      stars1: row.stars_1,
      stars2: row.stars_2,
      stars3: row.stars_3,
      stars4: row.stars_4,
      stars5: row.stars_5,
      overallScore: Number((getOverallScore(row) ?? 0).toFixed(2)),
    };
  });
}

async function resolveAnalyticsContext(input: { clerkUserId: string; brandSlug?: string | null; restaurantSlug?: string | null }) {
  if (input.brandSlug && input.restaurantSlug) {
    const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
    if (!restaurant?.id) {
      throw new Error("No se encontro el restaurante indicado para analytics.");
    }

    return {
      restaurantId: restaurant.id,
      brandSlug: input.brandSlug,
    };
  }

  if (input.brandSlug) {
    const owner = await getOwnerByBrandSlug(input.brandSlug);
    if (!owner?.restaurant_id) {
      throw new Error("No se encontro el restaurante indicado para analytics.");
    }

    return {
      restaurantId: owner.restaurant_id,
      brandSlug: input.brandSlug,
    };
  }

  const restaurant = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  if (!restaurant) {
    throw new Error("No se encontro restaurante para analytics.");
  }

  return {
    restaurantId: restaurant.id,
    brandSlug: restaurant.slug,
  };
}

export async function getAnalyticsSummaryByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const rows = await listRatingSubmissionsByRestaurantId({
    restaurantId: context.restaurantId,
    range: input.range,
  });
  return buildSummary(rows);
}

export async function getAnalyticsTrendByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const rows = await listRatingSubmissionsByRestaurantId({
    restaurantId: context.restaurantId,
    range: input.range,
  });
  return buildTrend(rows);
}

export async function getAnalyticsDistributionByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const rows = await listRatingSubmissionsByRestaurantId({
    restaurantId: context.restaurantId,
    range: input.range,
  });
  return buildDistribution(rows);
}

export async function getAnalyticsFeatureRankingByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const [rows, config] = await Promise.all([
    listRatingSubmissionsByRestaurantId({
      restaurantId: context.restaurantId,
      range: input.range,
    }),
    input.brandSlug ? getRatingConfigByBrandSlug(input.brandSlug) : getRatingConfigByClerkId(input.clerkUserId),
  ]);

  return buildFeatureRanking(rows, config?.features ?? []);
}

export async function getAnalyticsWaiterRankingByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  minSamples: number;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const [rows, waiters] = await Promise.all([
    listRatingSubmissionsByRestaurantId({
      restaurantId: context.restaurantId,
      range: input.range,
    }),
    input.brandSlug ? listEmployeesByBrandSlug(input.brandSlug) : listEmployeesByClerkId(input.clerkUserId),
  ]);

  return buildWaiterRanking(rows, waiters, input.minSamples);
}

export async function getAnalyticsExperiencesByClerkId(input: {
  clerkUserId: string;
  range: DateRangeInput;
  limit: number;
  offset: number;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}) {
  const pageSize = Math.max(1, input.limit);
  const context = await resolveAnalyticsContext({
    clerkUserId: input.clerkUserId,
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  const rows = await listRatingSubmissionsByRestaurantId({
    restaurantId: context.restaurantId,
    range: input.range,
    limit: pageSize + 1,
    offset: input.offset,
  });
  const waiters = input.brandSlug
    ? await listEmployeesByBrandSlug(input.brandSlug)
    : await listEmployeesByClerkId(input.clerkUserId);

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
