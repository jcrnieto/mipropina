import {
  getOwnerByBrandSlug,
  getPublicStoreInfoRowByBrandSlug,
  insertPersonalData,
  patchPersonalDataByClerkId,
} from "@/app/lib/server/modules/personal-data/personal-data.repository";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";

export type SetPersonalDataImageInput = {
  clerkUserId: string;
  imageUrl: string;
  brandName?: string | null;
  adminPath?: string | null;
  storePath?: string | null;
  debugTraceId?: string;
  debugSource?: string;
};

export async function upsertPersonalDataByClerkId(input: {
  usersMipropinaId: string;
  clerkUserId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  brandName: string | null;
  adminPath: string | null;
  storePath: string | null;
}): Promise<void> {
  const payload = {
    user_id: input.usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    address: input.address,
    city: null,
    brand_name: input.brandName,
    public_url: input.storePath,
    admin_url: input.adminPath,
  };

  const patchedRows = await patchPersonalDataByClerkId(input.clerkUserId, payload);
  if (patchedRows.length > 0) {
    return;
  }

  await insertPersonalData(payload);
}

export async function setPersonalDataImageByClerkId(input: SetPersonalDataImageInput): Promise<void> {
  const patchedRows = await patchPersonalDataByClerkId(input.clerkUserId, {
    image: input.imageUrl,
  });

  if (patchedRows.length > 0) {
    return;
  }

  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert personal_data_mipropina image without users_mipropina row");
  }

  await insertPersonalData({
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: null,
    last_name: null,
    phone: null,
    address: null,
    city: null,
    brand_name: input.brandName ?? null,
    public_url: input.storePath ?? null,
    admin_url: input.adminPath ?? null,
    image: input.imageUrl,
  });
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
} | null> {
  return getPublicStoreInfoRowByBrandSlug(brandSlug);
}
