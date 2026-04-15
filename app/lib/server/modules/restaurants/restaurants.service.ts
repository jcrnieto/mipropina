import {
  getRestaurantById,
  getRestaurantBySlug,
  insertRestaurant,
  listRestaurantsByAuthUserId,
  patchRestaurantById,
} from "@/app/lib/server/modules/restaurants/restaurants.repository";
import { getBrandByClerkId } from "@/app/lib/server/modules/brands/brands.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";

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
  return listRestaurantsByAuthUserId(clerkUserId);
}

export async function archiveRestaurantByClerkId(input: {
  clerkUserId: string;
  restaurantId: string;
}): Promise<void> {
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
      slug: input.brandSlug?.trim() || existingPrimary.slug,
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
}): Promise<void> {
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

  const existing = await getRestaurantBySlug(slug);
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
}

export async function upsertOnboardingRestaurantByClerkId(input: {
  clerkUserId: string;
  brandId: string;
  brandName: string;
  branchName: string;
  slug: string;
}): Promise<void> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert onboarding restaurant without users_mipropina row");
  }

  const normalizedSlug = input.slug.trim();
  if (!normalizedSlug) {
    throw new Error("El slug del local es obligatorio.");
  }

  const existingBySlug = await getRestaurantBySlug(normalizedSlug);
  if (existingBySlug && existingBySlug.auth_user_id !== input.clerkUserId) {
    throw new Error("Ya existe un local con ese slug.");
  }

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

  if (existingBySlug) {
    await patchRestaurantById(existingBySlug.id, payload);
    return;
  }

  const existingPrimary = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  if (existingPrimary) {
    await patchRestaurantById(existingPrimary.id, payload);
    return;
  }

  await insertRestaurant(payload);
}
