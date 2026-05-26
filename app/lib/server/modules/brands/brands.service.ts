import {
  getBrandById as getBrandByIdRepo,
  getBrandByOwnerAuthUserId,
  getBrandBySlug as getBrandBySlugRepo,
  insertBrand,
  patchBrandById,
  type BrandRow,
} from "@/app/lib/server/modules/brands/brands.repository";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";

export async function getBrandByClerkId(clerkUserId: string): Promise<BrandRow | null> {
  return getBrandByOwnerAuthUserId(clerkUserId);
}

export async function getBrandById(brandId: string): Promise<BrandRow | null> {
  return getBrandByIdRepo(brandId);
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  return getBrandBySlugRepo(slug);
}

export async function getBrandByIdOrThrow(brandId: string): Promise<BrandRow> {
  const brand = await getBrandById(brandId);
  if (!brand) {
    throw new Error("No se encontro la marca.");
  }

  return brand;
}

export async function upsertBrandByClerkId(input: {
  clerkUserId: string;
  name: string;
  slug: string;
  adminPath?: string | null;
  publicPath?: string | null;
  onboardingCompleted?: boolean;
}): Promise<BrandRow> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert brand without users_mipropina row");
  }

  const normalizedName = input.name.trim();
  const normalizedSlug = input.slug.trim();
  if (!normalizedName || !normalizedSlug) {
    throw new Error("Brand name and slug are required");
  }

  const [existingByOwner, existingBySlug] = await Promise.all([
    getBrandByOwnerAuthUserId(input.clerkUserId),
    getBrandBySlug(normalizedSlug),
  ]);

  if (existingBySlug && existingBySlug.owner_auth_user_id !== input.clerkUserId) {
    throw new Error("Ya existe una marca con ese slug.");
  }

  const payload = {
    owner_user_id: usersMipropinaId,
    owner_auth_user_id: input.clerkUserId,
    name: normalizedName,
    slug: normalizedSlug,
    admin_path: input.adminPath ?? null,
    public_path: input.publicPath ?? null,
    onboarding_completed: input.onboardingCompleted ?? false,
    is_active: true,
  };

  if (existingByOwner) {
    const rows = await patchBrandById(existingByOwner.id, payload);
    const updated = rows[0];
    if (!updated) {
      throw new Error("No se pudo actualizar la marca.");
    }
    return updated;
  }

  return insertBrand(payload);
}
