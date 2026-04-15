import {
  getOwnerByBrandSlug,
  getPrimaryRestaurantByClerkId,
} from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import {
  insertMenu,
  listMenuByRestaurantId,
  patchMenuByRestaurantId,
} from "@/app/lib/server/modules/menu/menu.repository";

export type MenuSnapshot = {
  fileUrl: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number | null;
  isActive: boolean;
};

function mapRowToSnapshot(row: {
  file_url: string;
  file_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  is_active: boolean;
}): MenuSnapshot {
  return {
    fileUrl: row.file_url,
    filePath: row.file_path,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    isActive: row.is_active,
  };
}

export async function getActiveMenuByClerkId(clerkUserId: string): Promise<MenuSnapshot | null> {
  const restaurant = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!restaurant) {
    return null;
  }

  const rows = await listMenuByRestaurantId(restaurant.id);
  const row = rows.find((item) => item.is_active) ?? rows[0] ?? null;
  if (!row) return null;
  return mapRowToSnapshot(row);
}

export async function getActiveMenuByBrandSlug(brandSlug: string): Promise<MenuSnapshot | null> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  if (!owner?.restaurant_id) {
    return null;
  }

  const rows = await listMenuByRestaurantId(owner.restaurant_id);
  const row = rows.find((item) => item.is_active) ?? rows[0] ?? null;
  if (!row) return null;
  return mapRowToSnapshot(row);
}

export async function upsertMenuByClerkId(input: {
  clerkUserId: string;
  brandSlug?: string | null;
  fileUrl: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes?: number | null;
}): Promise<MenuSnapshot> {
  const payload = {
    file_url: input.fileUrl,
    file_path: input.filePath,
    mime_type: input.mimeType,
    file_size_bytes: input.fileSizeBytes ?? null,
    is_active: true,
  };
  const restaurant = input.brandSlug
    ? await getOwnerByBrandSlug(input.brandSlug)
    : await getPrimaryRestaurantByClerkId(input.clerkUserId);
  const restaurantId = "restaurant_id" in (restaurant ?? {}) ? restaurant?.restaurant_id : restaurant?.id;
  if (!restaurantId) {
    throw new Error("Cannot upsert menu without restaurant row");
  }

  const patchedRows = await patchMenuByRestaurantId(restaurantId, payload);
  if (patchedRows.length > 0) {
    return mapRowToSnapshot(patchedRows[0]);
  }

  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert menu_mipropina without users_mipropina row");
  }

  const insertedRows = await insertMenu({
    restaurant_id: restaurantId,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    file_url: input.fileUrl,
    file_path: input.filePath,
    mime_type: input.mimeType,
    file_size_bytes: input.fileSizeBytes ?? null,
    is_active: true,
  });

  if (insertedRows.length === 0) {
    throw new Error("Could not insert menu_mipropina row");
  }

  return mapRowToSnapshot(insertedRows[0]);
}
