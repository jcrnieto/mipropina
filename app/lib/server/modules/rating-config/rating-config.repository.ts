import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type RatingConfigRow = {
  id: string;
  restaurant_id?: string;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  feature_4: string | null;
  feature_5: string | null;
};

export async function getRatingConfigRowByRestaurantId(
  restaurantId: string,
): Promise<RatingConfigRow | null> {
  const encodedId = encodeURIComponent(restaurantId);
  const response = await supabaseRestRequest(
    `/rest/v1/rating_config_mipropina?restaurant_id=eq.${encodedId}&select=id,restaurant_id,feature_1,feature_2,feature_3,feature_4,feature_5&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as RatingConfigRow[];
  return rows[0] ?? null;
}

export async function patchRatingConfigByRestaurantId(input: {
  restaurantId: string;
  payload: {
    restaurant_id: string;
    user_id: string;
    auth_user_id: string;
    feature_1: string | null;
    feature_2: string | null;
    feature_3: string | null;
    feature_4: string | null;
    feature_5: string | null;
  };
}): Promise<RatingConfigRow[]> {
  const encodedId = encodeURIComponent(input.restaurantId);
  const patchResponse = await supabaseRestRequest(
    `/rest/v1/rating_config_mipropina?restaurant_id=eq.${encodedId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(input.payload),
    },
  );

  return (await patchResponse.json()) as RatingConfigRow[];
}

export async function insertRatingConfig(payload: {
  restaurant_id: string;
  user_id: string;
  auth_user_id: string;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  feature_4: string | null;
  feature_5: string | null;
}): Promise<void> {
  await supabaseRestRequest("/rest/v1/rating_config_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });
}

export async function insertRatingSubmission(payload: {
  restaurant_id: string;
  user_id: string;
  auth_user_id: string;
  stars_1: number | null;
  stars_2: number | null;
  stars_3: number | null;
  stars_4: number | null;
  stars_5: number | null;
  waiter_id: string | null;
  waiter_service_stars: number | null;
  entry_type: "general" | "waiter_qr";
  comment: string | null;
}): Promise<void> {
  await supabaseRestRequest("/rest/v1/rating_submission_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify([payload]),
  });
}
