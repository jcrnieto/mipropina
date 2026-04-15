import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type RestaurantRow = {
  id: string;
  brand_id: string | null;
  user_id: string;
  auth_user_id: string;
  brand_name: string | null;
  branch_name: string | null;
  slug: string;
  phone: string | null;
  address: string | null;
  image: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RestaurantInsertPayload = {
  brand_id?: string | null;
  user_id: string;
  auth_user_id: string;
  brand_name: string;
  branch_name: string | null;
  slug: string;
  phone: string | null;
  address: string | null;
  image?: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  is_active?: boolean;
};

const RESTAURANT_SELECT =
  "id,brand_id,user_id,auth_user_id,brand_name,branch_name,slug,phone,address,image,instagram,facebook,tiktok,is_active,created_at,updated_at";

export async function listRestaurantsByAuthUserId(authUserId: string): Promise<RestaurantRow[]> {
  const encodedAuthId = encodeURIComponent(authUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?auth_user_id=eq.${encodedAuthId}&select=${RESTAURANT_SELECT}&order=created_at.asc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as RestaurantRow[];
}

export async function getRestaurantBySlug(slug: string): Promise<RestaurantRow | null> {
  const encodedSlug = encodeURIComponent(slug);
  const response = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?slug=eq.${encodedSlug}&select=${RESTAURANT_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as RestaurantRow[];
  return rows[0] ?? null;
}

export async function getRestaurantById(restaurantId: string): Promise<RestaurantRow | null> {
  const encodedId = encodeURIComponent(restaurantId);
  const response = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?id=eq.${encodedId}&select=${RESTAURANT_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as RestaurantRow[];
  return rows[0] ?? null;
}

export async function insertRestaurant(payload: RestaurantInsertPayload): Promise<RestaurantRow> {
  const response = await supabaseRestRequest("/rest/v1/restaurants_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const rows = (await response.json()) as RestaurantRow[];
  const row = rows[0];
  if (!row) {
    throw new Error("Supabase did not return created restaurant");
  }

  return row;
}

export async function patchRestaurantById(
  restaurantId: string,
  payload: Partial<RestaurantInsertPayload>,
): Promise<RestaurantRow[]> {
  const encodedId = encodeURIComponent(restaurantId);
  const response = await supabaseRestRequest(`/rest/v1/restaurants_mipropina?id=eq.${encodedId}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as RestaurantRow[];
}
