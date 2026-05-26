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
  brand_name: string | null;
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

const RESTAURANT_WITH_BRAND_SELECT =
  `${RESTAURANT_SELECT},brands_mipropina(slug,public_path)`;

export type RestaurantWithBrandRow = RestaurantRow & {
  brands_mipropina?: Array<{
    slug: string;
    public_path: string | null;
  }>;
};

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

export async function listRestaurantsWithBrandByAuthUserId(
  authUserId: string,
): Promise<RestaurantWithBrandRow[]> {
  const encodedAuthId = encodeURIComponent(authUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?auth_user_id=eq.${encodedAuthId}&select=${RESTAURANT_WITH_BRAND_SELECT}&order=created_at.asc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as RestaurantWithBrandRow[];
}

export async function listRestaurantsByBrandId(brandId: string): Promise<RestaurantWithBrandRow[]> {
  const encodedBrandId = encodeURIComponent(brandId);
  const response = await supabaseRestRequest(
    `/rest/v1/restaurants_mipropina?brand_id=eq.${encodedBrandId}&select=${RESTAURANT_WITH_BRAND_SELECT}&order=created_at.asc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as RestaurantWithBrandRow[];
}

export async function getRestaurantByBrandSlugAndRestaurantSlug(
  brandSlug: string,
  restaurantSlug: string,
): Promise<RestaurantWithBrandRow | null> {
  const encodedBrandSlug = encodeURIComponent(brandSlug);
  const encodedRestaurantSlug = encodeURIComponent(restaurantSlug);

  console.log("[restaurants.repository] getRestaurantByBrandSlugAndRestaurantSlug", {
    brandSlug,
    restaurantSlug,
  });

  // Step 1: Find the brand by slug
  const brandResponse = await supabaseRestRequest(
    `/rest/v1/brands_mipropina?slug=eq.${encodedBrandSlug}&select=id&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const brands = (await brandResponse.json()) as Array<{ id: string }>;
  console.log("[restaurants.repository] Query for brand by slug result", {
    found: brands.length > 0,
    count: brands.length,
  });

  if (brands[0]) {
    const brandId = brands[0].id;

    // Step 2: Find restaurant by slug AND brand_id
    const restaurantResponse = await supabaseRestRequest(
      `/rest/v1/restaurants_mipropina?slug=eq.${encodedRestaurantSlug}&brand_id=eq.${encodeURIComponent(brandId)}&select=${RESTAURANT_WITH_BRAND_SELECT}&limit=1`,
      {
        method: "GET",
        headers: {
          Prefer: "return=representation",
        },
      },
    );

    const restaurants = (await restaurantResponse.json()) as RestaurantWithBrandRow[];
    console.log("[restaurants.repository] Query for restaurant by slug + brand_id result", {
      found: restaurants.length > 0,
      count: restaurants.length,
    });

    if (restaurants[0]) {
      return restaurants[0];
    }
  }

  // Fallback: Try by public_path
  const publicPathResponse = await supabaseRestRequest(
    `/rest/v1/brands_mipropina?public_path=eq.${encodedBrandSlug}&select=id&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const brandsByPublicPath = (await publicPathResponse.json()) as Array<{ id: string }>;
  console.log("[restaurants.repository] Query for brand by public_path result", {
    found: brandsByPublicPath.length > 0,
    count: brandsByPublicPath.length,
  });

  if (brandsByPublicPath[0]) {
    const brandId = brandsByPublicPath[0].id;

    const restaurantResponse = await supabaseRestRequest(
      `/rest/v1/restaurants_mipropina?slug=eq.${encodedRestaurantSlug}&brand_id=eq.${encodeURIComponent(brandId)}&select=${RESTAURANT_WITH_BRAND_SELECT}&limit=1`,
      {
        method: "GET",
        headers: {
          Prefer: "return=representation",
        },
      },
    );

    const restaurants = (await restaurantResponse.json()) as RestaurantWithBrandRow[];
    console.log("[restaurants.repository] Query for restaurant by slug + brand_id (public_path) result", {
      found: restaurants.length > 0,
      count: restaurants.length,
    });

    return restaurants[0] ?? null;
  }

  return null;
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
  console.log("[restaurants.repository] insertRestaurant called with payload", { payload });
  
  const response = await supabaseRestRequest("/rest/v1/restaurants_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const statusCode = response.status;
  const responseText = await response.text();
  console.log("[restaurants.repository] Supabase response", {
    statusCode,
    responseText: responseText.substring(0, 500), // First 500 chars
  });

  if (!response.ok) {
    console.error("[restaurants.repository] Supabase error response", {
      statusCode,
      responseText,
    });
    throw new Error(`Supabase returned ${statusCode}: ${responseText}`);
  }

  let rows: RestaurantRow[];
  try {
    rows = JSON.parse(responseText) as RestaurantRow[];
  } catch (e) {
    console.error("[restaurants.repository] Failed to parse response as JSON", {
      responseText,
      error: e instanceof Error ? e.message : String(e),
    });
    throw new Error("Failed to parse Supabase response as JSON");
  }

  const row = rows[0];
  if (!row) {
    console.error("[restaurants.repository] Supabase did not return created restaurant", {
      rowsLength: rows.length,
      rows,
    });
    throw new Error("Supabase did not return created restaurant");
  }

  console.log("[restaurants.repository] Restaurant created successfully", {
    restaurantId: row.id,
    slug: row.slug,
  });
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
