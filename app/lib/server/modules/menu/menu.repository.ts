import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type MenuMipropinaRow = {
  id: string;
  user_id: string;
  auth_user_id: string;
  file_url: string;
  file_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuMipropinaPayload = {
  user_id: string;
  auth_user_id: string;
  file_url: string;
  file_path: string;
  mime_type: string;
  file_size_bytes?: number | null;
  is_active?: boolean;
};

const MENU_SELECT =
  "id,user_id,auth_user_id,file_url,file_path,mime_type,file_size_bytes,is_active,created_at,updated_at";

async function getMenuUserIdByRestaurantId(restaurantId: string): Promise<string | null> {
  const encodedRestaurantId = encodeURIComponent(restaurantId);
  const restaurantResponse = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?id=eq.${encodedRestaurantId}&select=user_id&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const restaurants = (await restaurantResponse.json()) as Array<{ user_id: string }>;
  return restaurants[0]?.user_id ?? null;
}

export async function listMenuByRestaurantId(restaurantId: string): Promise<MenuMipropinaRow[]> {
  const userId = await getMenuUserIdByRestaurantId(restaurantId);
  if (!userId) {
    return [];
  }

  const encodedUserId = encodeURIComponent(userId);
  const response = await supabaseRestRequest(
    `/rest/v1/menu_mipropina?user_id=eq.${encodedUserId}&select=${MENU_SELECT}&order=updated_at.desc&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as MenuMipropinaRow[];
}

export async function patchMenuByRestaurantId(
  restaurantId: string,
  payload: Partial<MenuMipropinaPayload>,
): Promise<MenuMipropinaRow[]> {
  const userId = await getMenuUserIdByRestaurantId(restaurantId);
  if (!userId) {
    return [];
  }

  const encodedUserId = encodeURIComponent(userId);
  const response = await supabaseRestRequest(
    `/rest/v1/menu_mipropina?user_id=eq.${encodedUserId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  return (await response.json()) as MenuMipropinaRow[];
}

export async function insertMenu(payload: MenuMipropinaPayload): Promise<MenuMipropinaRow[]> {
  const response = await supabaseRestRequest("/rest/v1/menu_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  return (await response.json()) as MenuMipropinaRow[];
}
