import { getOwnerAuthUserIdByBrandSlug } from "@/app/lib/server/modules/personal-data/personal-data.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import {
  insertMenu,
  listMenuByAuthUserId,
  patchMenuByAuthUserId,
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
  const rows = await listMenuByAuthUserId(clerkUserId);
  const row = rows.find((item) => item.is_active) ?? rows[0] ?? null;
  if (!row) return null;
  return mapRowToSnapshot(row);
}

export async function getActiveMenuByBrandSlug(brandSlug: string): Promise<MenuSnapshot | null> {
  const ownerAuthUserId = await getOwnerAuthUserIdByBrandSlug(brandSlug);
  if (!ownerAuthUserId) {
    return null;
  }

  const rows = await listMenuByAuthUserId(ownerAuthUserId);
  const row = rows.find((item) => item.is_active) ?? rows[0] ?? null;
  if (!row) return null;
  return mapRowToSnapshot(row);
}

export async function upsertMenuByClerkId(input: {
  clerkUserId: string;
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

  const patchedRows = await patchMenuByAuthUserId(input.clerkUserId, payload);
  if (patchedRows.length > 0) {
    return mapRowToSnapshot(patchedRows[0]);
  }

  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert menu_mipropina without users_mipropina row");
  }

  const insertedRows = await insertMenu({
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
