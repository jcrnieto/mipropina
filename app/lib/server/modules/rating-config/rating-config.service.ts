import { getOwnerByBrandSlug } from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import { getEmployeeByBrandSlugAndId } from "@/app/lib/server/modules/waiters/waiters.service";
import { getPrimaryRestaurantByClerkId } from "@/app/lib/server/modules/restaurants/restaurants.service";
import {
  getRatingConfigRowByRestaurantId,
  insertRatingConfig,
  insertRatingSubmission,
  patchRatingConfigByRestaurantId,
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
  const restaurant = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!restaurant) {
    return null;
  }

  const row = await getRatingConfigRowByRestaurantId(restaurant.id);
  if (!row) {
    return null;
  }

  return {
    features: normalizeFeaturesFromRow(row),
  };
}

export async function getRatingConfigByBrandSlug(brandSlug: string): Promise<{
  features: string[];
} | null> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  if (!owner?.restaurant_id) {
    return null;
  }

  const row = await getRatingConfigRowByRestaurantId(owner.restaurant_id);
  if (!row) {
    return null;
  }

  return {
    features: normalizeFeaturesFromRow(row),
  };
}

export async function upsertRatingConfigByClerkId(input: {
  clerkUserId: string;
  brandSlug?: string | null;
  features: string[];
}): Promise<{ features: string[] }> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("No se encontro users_mipropina para guardar la configuracion.");
  }
  const restaurant = input.brandSlug
    ? await getOwnerByBrandSlug(input.brandSlug)
    : await getPrimaryRestaurantByClerkId(input.clerkUserId);
  const restaurantId = "restaurant_id" in (restaurant ?? {}) ? restaurant?.restaurant_id : restaurant?.id;
  if (!restaurantId) {
    throw new Error("No se encontro restaurante para guardar la configuracion.");
  }

  const normalized = input.features.map((feature) => feature.trim());
  const payload = {
    restaurant_id: restaurantId,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    feature_1: normalized[0] ?? null,
    feature_2: normalized[1] ?? null,
    feature_3: normalized[2] ?? null,
    feature_4: normalized[3] ?? null,
    feature_5: normalized[4] ?? null,
  };

  const patchedRows = await patchRatingConfigByRestaurantId({
    restaurantId,
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
  if (!owner?.restaurant_id) {
    return [];
  }

  const row = await getRatingConfigRowByRestaurantId(owner.restaurant_id);
  if (!row) {
    return [];
  }

  return normalizeFeaturesFromRow(row);
}

export async function createRatingSubmissionByBrandSlug(input: {
  brandSlug: string;
  stars: Array<number | null>;
  comment?: string | null;
  waiterId?: string | null;
  waiterServiceStars?: number | null;
  entryType?: "general" | "waiter_qr";
}): Promise<void> {
  const owner = await getOwnerByBrandSlug(input.brandSlug);

  if (!owner?.user_id || !owner.auth_user_id) {
    throw new Error("No se encontro el restaurante para guardar la calificacion.");
  }
  if (!owner.restaurant_id) {
    throw new Error("No se encontro el restaurante para vincular la calificacion.");
  }

  const waiterId = input.waiterId?.trim() || null;
  const entryType = input.entryType ?? (waiterId ? "waiter_qr" : "general");
  const waiterServiceStars = waiterId ? input.waiterServiceStars ?? null : null;

  if (waiterId) {
    const waiter = await getEmployeeByBrandSlugAndId(input.brandSlug, waiterId);
    if (!waiter) {
      throw new Error("No se encontro el mozo seleccionado para este restaurante.");
    }
  }

  await insertRatingSubmission({
    restaurant_id: owner.restaurant_id,
    user_id: owner.user_id,
    auth_user_id: owner.auth_user_id,
    stars_1: input.stars[0] ?? null,
    stars_2: input.stars[1] ?? null,
    stars_3: input.stars[2] ?? null,
    stars_4: input.stars[3] ?? null,
    stars_5: input.stars[4] ?? null,
    waiter_id: waiterId,
    waiter_service_stars: waiterServiceStars,
    entry_type: entryType,
    comment: input.comment?.trim() || null,
  });
}
