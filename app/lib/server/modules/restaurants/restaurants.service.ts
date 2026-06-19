import {
  getRestaurantById,
  getRestaurantBySlug,
  getRestaurantByBrandIdAndSlug,
  getRestaurantByBrandSlugAndRestaurantSlug as getRestaurantRowByBrandAndRestaurantSlug,
  listRestaurantsByAuthUserId,
  listRestaurantsByBrandId as listRestaurantsByBrandIdRepository,
  listRestaurantsWithBrandByAuthUserId,
  patchRestaurantById,
  insertRestaurant,
} from "@/app/lib/server/modules/restaurants/restaurants.repository";
import { getBrandByClerkId } from "@/app/lib/server/modules/brands/brands.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import { syncSubscriptionAmountForBrand } from "@/app/lib/server/modules/subscriptions/subscriptions.service";

export type RestaurantBillingSyncResult = {
  billingSynced: boolean;
  billingSyncWarning?: string;
};

async function syncRestaurantBillingAmount(brandId: string): Promise<RestaurantBillingSyncResult> {
  try {
    const result = await syncSubscriptionAmountForBrand(brandId);
    return {
      billingSynced: result.synced,
    };
  } catch (error) {
    console.error("[restaurants] failed to sync subscription amount", {
      brandId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      billingSynced: false,
      billingSyncWarning:
        "El local se guardo, pero no pudimos actualizar el monto de la suscripcion. Reintenta o revisa Mercado Pago.",
    };
  }
}

export type SetRestaurantImageInput = {
  clerkUserId: string;
  imageUrl: string;
  brandName?: string | null;
  brandSlug?: string | null;
};

export async function getPrimaryRestaurantByClerkId(clerkUserId: string) {
  const restaurants = await listRestaurantsByAuthUserId(clerkUserId);
  return restaurants[0] ?? null;
}

export async function listRestaurantsByClerkId(clerkUserId: string) {
  return listRestaurantsWithBrandByAuthUserId(clerkUserId);
}

export async function archiveRestaurantByClerkId(input: {
  clerkUserId: string;
  restaurantId: string;
}): Promise<RestaurantBillingSyncResult> {
  const restaurant = await getRestaurantById(input.restaurantId);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("No se encontro el local.");
  }

  const restaurants = await listRestaurantsByAuthUserId(input.clerkUserId);
  const activeRestaurants = restaurants.filter((item) => item.is_active);

  if (restaurant.is_active && activeRestaurants.length <= 1) {
    throw new Error("No puedes eliminar el ultimo local activo de la cuenta.");
  }

  await patchRestaurantById(input.restaurantId, {
    is_active: false,
  });

  if (restaurant.brand_id) {
    return syncRestaurantBillingAmount(restaurant.brand_id);
  }

  return { billingSynced: false };
}

export async function getOwnerByBrandSlug(brandSlug: string): Promise<{
  auth_user_id: string | null;
  user_id: string | null;
  restaurant_id: string | null;
} | null> {
  const restaurant = await getRestaurantBySlug(brandSlug);
  if (!restaurant) {
    return null;
  }

  return {
    auth_user_id: restaurant.auth_user_id,
    user_id: restaurant.user_id,
    restaurant_id: restaurant.id,
  };
}

export async function getOwnerAuthUserIdByBrandSlug(brandSlug: string): Promise<string | null> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  return owner?.auth_user_id ?? null;
}

export async function getPublicStoreInfoByBrandSlug(brandSlug: string): Promise<{
  brand_name: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  general_tip_link: string | null;
} | null> {
  const restaurant = await getRestaurantBySlug(brandSlug);
  if (!restaurant) {
    return null;
  }

  return {
    brand_name: restaurant.brand_name,
    phone: restaurant.phone,
    address: restaurant.address,
    image: restaurant.image,
    instagram: restaurant.instagram,
    facebook: restaurant.facebook,
    tiktok: restaurant.tiktok,
    general_tip_link: restaurant.general_tip_link,
  };
}

export async function upsertRestaurantByClerkId(input: {
  brandId?: string | null;
  usersMipropinaId: string;
  clerkUserId: string;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  brandName: string | null;
  brandSlug: string | null;
}): Promise<void> {
  const normalizedBrandName = input.brandName?.trim() || "Mi restaurante";
  const normalizedSlug = input.brandSlug?.trim() || "";
  if (!normalizedSlug) {
    return;
  }

  const existingBySlug = await getRestaurantBySlug(normalizedSlug);
  if (existingBySlug) {
    await patchRestaurantById(existingBySlug.id, {
      brand_id: input.brandId ?? existingBySlug.brand_id,
      user_id: input.usersMipropinaId,
      auth_user_id: input.clerkUserId,
      brand_name: normalizedBrandName,
      phone: input.phone,
      address: input.address,
      instagram: input.instagram,
      facebook: input.facebook,
      tiktok: input.tiktok,
      is_active: true,
    });
    return;
  }

  const existingPrimary = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  if (existingPrimary) {
    await patchRestaurantById(existingPrimary.id, {
      brand_id: input.brandId ?? existingPrimary.brand_id,
      brand_name: normalizedBrandName,
      slug: normalizedSlug,
      phone: input.phone,
      address: input.address,
      instagram: input.instagram,
      facebook: input.facebook,
      tiktok: input.tiktok,
      is_active: true,
    });
    return;
  }

  await insertRestaurant({
    brand_id: input.brandId ?? null,
    user_id: input.usersMipropinaId,
    auth_user_id: input.clerkUserId,
    brand_name: normalizedBrandName,
    branch_name: null,
    slug: normalizedSlug,
    phone: input.phone,
    address: input.address,
    instagram: input.instagram,
    facebook: input.facebook,
    tiktok: input.tiktok,
    image: null,
    is_active: true,
  });
}

export async function setRestaurantImageByClerkId(input: SetRestaurantImageInput): Promise<void> {
  const existingPrimary = await getPrimaryRestaurantByClerkId(input.clerkUserId);

  if (existingPrimary) {
    await patchRestaurantById(existingPrimary.id, {
      brand_id: existingPrimary.brand_id,
      image: input.imageUrl,
      brand_name: input.brandName?.trim() || existingPrimary.brand_name || "Mi restaurante",
      // Preserve the existing restaurant slug when updating the logo.
      // The uploaded logo should not change the public URL segment.
      slug: existingPrimary.slug,
      is_active: true,
    });
    return;
  }

  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert restaurant image without users_mipropina row");
  }

  const slug = input.brandSlug?.trim() || "";
  if (!slug) {
    throw new Error("Cannot upsert restaurant image without brand slug");
  }

  const brand = await getBrandByClerkId(input.clerkUserId);

  await insertRestaurant({
    brand_id: brand?.id ?? null,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    brand_name: input.brandName?.trim() || "Mi restaurante",
    branch_name: null,
    slug,
    phone: null,
    address: null,
    instagram: null,
    facebook: null,
    tiktok: null,
    image: input.imageUrl,
    is_active: true,
  });
}

export async function patchPrimaryRestaurantByClerkId(
  clerkUserId: string,
  payload: {
    phone?: string | null;
    address?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    image?: string | null;
    brand_name?: string | null;
  },
): Promise<boolean> {
  const primary = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!primary) {
    return false;
  }

  const rows = await patchRestaurantById(primary.id, payload);
  return rows.length > 0;
}

export async function getPrimaryRestaurantImageByClerkId(clerkUserId: string): Promise<string | null> {
  const primary = await getPrimaryRestaurantByClerkId(clerkUserId);
  return primary?.image ?? null;
}

export async function getPrimaryRestaurantProfileByClerkId(clerkUserId: string): Promise<{
  brandName: string;
  branchName: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
} | null> {
  const primary = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!primary) {
    return null;
  }

  return {
    brandName: primary.brand_name ?? "",
    branchName: primary.branch_name ?? "",
    phone: primary.phone ?? "",
    address: primary.address ?? "",
    instagram: primary.instagram ?? "",
    facebook: primary.facebook ?? "",
    tiktok: primary.tiktok ?? "",
  };
}

export async function getRestaurantByBrandSlug(brandSlug: string) {
  return getRestaurantBySlug(brandSlug);
}

export async function getRestaurantByBrandSlugAndRestaurantSlug(
  brandSlug: string,
  restaurantSlug: string,
) {
  return getRestaurantRowByBrandAndRestaurantSlug(brandSlug, restaurantSlug);
}

export async function getGeneralTipLinkByBrandAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
}): Promise<string | null> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("No se encontro el local.");
  }

  return restaurant.general_tip_link ?? null;
}

export async function setGeneralTipLinkByBrandAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
  generalTipLink: string | null;
}): Promise<string | null> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("No se encontro el local.");
  }

  const rows = await patchRestaurantById(restaurant.id, {
    general_tip_link: input.generalTipLink,
  });
  if (rows.length === 0) {
    throw new Error("No se pudo guardar el link de propina general.");
  }

  return rows[0]?.general_tip_link ?? null;
}

export async function listRestaurantsByBrandId(brandId: string) {
  return listRestaurantsByBrandIdRepository(brandId);
}

export async function getPublicStoreInfoByBrandAndRestaurantSlug(
  brandSlug: string,
  restaurantSlug: string,
): Promise<{
  brandName: string | null;
  branchName: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  generalTipLink: string | null;
  brandPublicPath: string;
} | null> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(brandSlug, restaurantSlug);
  if (!restaurant) {
    return null;
  }

  return {
    brandName: restaurant.brand_name,
    branchName: restaurant.branch_name,
    phone: restaurant.phone,
    address: restaurant.address,
    image: restaurant.image,
    instagram: restaurant.instagram,
    facebook: restaurant.facebook,
    tiktok: restaurant.tiktok,
    generalTipLink: restaurant.general_tip_link,
    brandPublicPath: restaurant.brands_mipropina?.[0]?.public_path ?? restaurant.brands_mipropina?.[0]?.slug ?? brandSlug,
  };
}

export async function getRestaurantByClerkUserId(clerkUserId: string) {
  return getPrimaryRestaurantByClerkId(clerkUserId);
}

export async function createRestaurantByClerkId(input: {
  clerkUserId: string;
  brandName: string;
  branchName?: string | null;
  slug: string;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
}): Promise<RestaurantBillingSyncResult> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot create restaurant without users_mipropina row");
  }

  const brand = await getBrandByClerkId(input.clerkUserId);
  if (!brand) {
    throw new Error("No se encontro la marca asociada a esta cuenta.");
  }

  const slug = input.slug.trim();
  if (!slug) {
    throw new Error("El slug es obligatorio.");
  }

  const existing = await getRestaurantByBrandIdAndSlug(brand.id, slug);
  if (existing) {
    throw new Error("Ya existe un restaurante con ese slug.");
  }

  await insertRestaurant({
    brand_id: brand.id,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    brand_name: input.brandName.trim() || "Mi restaurante",
    branch_name: input.branchName?.trim() || null,
    slug,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    instagram: input.instagram?.trim() || null,
    facebook: input.facebook?.trim() || null,
    tiktok: input.tiktok?.trim() || null,
    image: null,
    is_active: true,
  });

  return syncRestaurantBillingAmount(brand.id);
}

export async function upsertOnboardingRestaurantByClerkId(input: {
  clerkUserId: string;
  brandId: string;
  brandName: string;
  branchName: string;
  slug: string;
  usersMipropinaId?: string | null;
}): Promise<void> {
  const usersMipropinaId =
    input.usersMipropinaId ?? (await getUsersMipropinaIdByClerkId(input.clerkUserId));
  
  console.log("[restaurants.service] upsertOnboardingRestaurantByClerkId called", {
    clerkUserId: input.clerkUserId,
    brandId: input.brandId,
    brandName: input.brandName,
    branchName: input.branchName,
    slug: input.slug,
    usersMipropinaId,
  });
  
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert onboarding restaurant without users_mipropina row");
  }

  const normalizedSlug = input.slug.trim();
  if (!normalizedSlug) {
    throw new Error("El slug del local es obligatorio.");
  }

  const existingBySlug = await getRestaurantByBrandIdAndSlug(input.brandId, normalizedSlug);
  console.log("[restaurants.service] Checked existing by brand + slug", {
    brandId: input.brandId,
    slug: normalizedSlug,
    found: !!existingBySlug,
  });

  const payload = {
    brand_id: input.brandId,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    brand_name: input.brandName.trim() || "Mi restaurante",
    branch_name: input.branchName.trim() || "Casa central",
    slug: normalizedSlug,
    phone: null,
    address: null,
    instagram: null,
    facebook: null,
    tiktok: null,
    image: null,
    is_active: true,
  };

  console.log("[restaurants.service] Prepared payload for restaurant", {
    payload,
    existingBySlug: !!existingBySlug,
  });

  if (existingBySlug) {
    console.log("[restaurants.service] Patching existing restaurant", {
      existingId: existingBySlug.id,
      previousAuthUserId: existingBySlug.auth_user_id,
      nextAuthUserId: input.clerkUserId,
    });
    await patchRestaurantById(existingBySlug.id, payload);
    return;
  }

  const existingPrimary = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  console.log("[restaurants.service] Checked existing primary", {
    found: !!existingPrimary,
    primaryId: existingPrimary?.id,
  });
  
  if (existingPrimary) {
    console.log("[restaurants.service] Patching primary restaurant", {
      primaryId: existingPrimary.id,
    });
    await patchRestaurantById(existingPrimary.id, payload);
    return;
  }

  console.log("[restaurants.service] Calling insertRestaurant with payload", { payload });
  const result = await insertRestaurant(payload);
  console.log("[restaurants.service] Restaurant inserted successfully", {
    restaurantId: result.id,
    slug: result.slug,
  });
}
