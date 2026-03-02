import { getOwnerByBrandSlug } from "@/app/lib/server/modules/personal-data/personal-data.repository";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import {
  getRatingConfigRowByAuthUserId,
  insertRatingConfig,
  insertRatingSubmission,
  patchRatingConfigByAuthUserId,
} from "@/app/lib/server/modules/rating-config/rating-config.repository";

function normalizeFeaturesFromRow(row: {
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  feature_4: string | null;
  feature_5: string | null;
}): string[] {
  return [row.feature_1, row.feature_2, row.feature_3, row.feature_4, row.feature_5]
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function getRatingConfigByClerkId(clerkUserId: string): Promise<{
  features: string[];
} | null> {
  const row = await getRatingConfigRowByAuthUserId(clerkUserId);
  if (!row) {
    return null;
  }

  return {
    features: normalizeFeaturesFromRow(row),
  };
}

export async function upsertRatingConfigByClerkId(input: {
  clerkUserId: string;
  features: string[];
}): Promise<{ features: string[] }> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("No se encontro users_mipropina para guardar la configuracion.");
  }

  const normalized = input.features.map((feature) => feature.trim());
  const payload = {
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    feature_1: normalized[0] ?? null,
    feature_2: normalized[1] ?? null,
    feature_3: normalized[2] ?? null,
    feature_4: normalized[3] ?? null,
    feature_5: normalized[4] ?? null,
  };

  const patchedRows = await patchRatingConfigByAuthUserId({
    authUserId: input.clerkUserId,
    payload,
  });

  if (patchedRows.length === 0) {
    await insertRatingConfig(payload);
  }

  return {
    features: normalized.filter((feature) => feature.length > 0),
  };
}

export async function getRatingFeaturesByBrandSlug(brandSlug: string): Promise<string[]> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  if (!owner?.auth_user_id) {
    return [];
  }

  const row = await getRatingConfigRowByAuthUserId(owner.auth_user_id);
  if (!row) {
    return [];
  }

  return normalizeFeaturesFromRow(row);
}

export async function createRatingSubmissionByBrandSlug(input: {
  brandSlug: string;
  stars: Array<number | null>;
  comment?: string | null;
}): Promise<void> {
  const owner = await getOwnerByBrandSlug(input.brandSlug);

  if (!owner?.user_id || !owner.auth_user_id) {
    throw new Error("No se encontro el restaurante para guardar la calificacion.");
  }

  await insertRatingSubmission({
    user_id: owner.user_id,
    auth_user_id: owner.auth_user_id,
    stars_1: input.stars[0] ?? null,
    stars_2: input.stars[1] ?? null,
    stars_3: input.stars[2] ?? null,
    stars_4: input.stars[3] ?? null,
    stars_5: input.stars[4] ?? null,
    comment: input.comment?.trim() || null,
  });
}
