import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type BrandRow = {
  id: string;
  owner_user_id: string;
  owner_auth_user_id: string;
  name: string;
  slug: string;
  admin_path: string | null;
  public_path: string | null;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BrandInsertPayload = {
  owner_user_id: string;
  owner_auth_user_id: string;
  name: string;
  slug: string;
  admin_path: string | null;
  public_path: string | null;
  onboarding_completed?: boolean;
  is_active?: boolean;
};

const BRAND_SELECT =
  "id,owner_user_id,owner_auth_user_id,name,slug,admin_path,public_path,onboarding_completed,is_active,created_at,updated_at";

export async function getBrandByOwnerAuthUserId(ownerAuthUserId: string): Promise<BrandRow | null> {
  const encodedOwnerAuthUserId = encodeURIComponent(ownerAuthUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/brands_mipropina?owner_auth_user_id=eq.${encodedOwnerAuthUserId}&select=${BRAND_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as BrandRow[];
  return rows[0] ?? null;
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const encodedSlug = encodeURIComponent(slug);
  const response = await supabaseRestRequest(
    `/rest/v1/brands_mipropina?slug=eq.${encodedSlug}&select=${BRAND_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as BrandRow[];
  return rows[0] ?? null;
}

export async function getBrandById(brandId: string): Promise<BrandRow | null> {
  const encodedBrandId = encodeURIComponent(brandId);
  const response = await supabaseRestRequest(
    `/rest/v1/brands_mipropina?id=eq.${encodedBrandId}&select=${BRAND_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as BrandRow[];
  return rows[0] ?? null;
}

export async function insertBrand(payload: BrandInsertPayload): Promise<BrandRow> {
  const response = await supabaseRestRequest("/rest/v1/brands_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const rows = (await response.json()) as BrandRow[];
  const row = rows[0];
  if (!row) {
    throw new Error("Supabase did not return created brand");
  }

  return row;
}

export async function patchBrandById(
  brandId: string,
  payload: Partial<BrandInsertPayload>,
): Promise<BrandRow[]> {
  const encodedBrandId = encodeURIComponent(brandId);
  const response = await supabaseRestRequest(`/rest/v1/brands_mipropina?id=eq.${encodedBrandId}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as BrandRow[];
}
