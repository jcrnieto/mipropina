import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type PersonalDataInsertPayload = {
  user_id: string;
  auth_user_id: string;
  name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  brand_name: string | null;
  public_url: string | null;
  admin_url: string | null;
  image?: string | null;
};

type PersonalDataIdRow = {
  id: string;
};

type OwnerRow = {
  auth_user_id: string | null;
  user_id: string | null;
};

export type PublicStoreInfoRow = {
  brand_name: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
};

export async function patchPersonalDataByClerkId(
  clerkUserId: string,
  payload: Record<string, unknown>,
): Promise<PersonalDataIdRow[]> {
  const encodedAuthId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?auth_user_id=eq.${encodedAuthId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  return (await response.json()) as PersonalDataIdRow[];
}

export async function insertPersonalData(payload: PersonalDataInsertPayload): Promise<PersonalDataIdRow[]> {
  const response = await supabaseRestRequest("/rest/v1/personal_data_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  return (await response.json()) as PersonalDataIdRow[];
}

export async function getOwnerByBrandSlug(brandSlug: string): Promise<OwnerRow | null> {
  const publicUrl = `/${brandSlug}`;
  const encodedPublicUrl = encodeURIComponent(publicUrl);

  const ownerResponse = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?public_url=eq.${encodedPublicUrl}&select=auth_user_id,user_id&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const ownerRows = (await ownerResponse.json()) as OwnerRow[];
  return ownerRows[0] ?? null;
}

export async function getPublicStoreInfoRowByBrandSlug(
  brandSlug: string,
): Promise<PublicStoreInfoRow | null> {
  const publicUrl = `/${brandSlug}`;
  const encodedPublicUrl = encodeURIComponent(publicUrl);

  const response = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?public_url=eq.${encodedPublicUrl}&select=brand_name,phone,address,image&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as PublicStoreInfoRow[];
  return rows[0] ?? null;
}
