import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type AccountMipropinaStatus =
  | "trial_active"
  | "trial_expired"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type AccountMipropinaPayload = {
  brand_id?: string | null;
  user_id: string;
  auth_user_id: string;
  status: AccountMipropinaStatus;
  trial_start?: string | null;
  trial_end?: string | null;
  mp_preapproval_id?: string | null;
  mp_preapproval_status?: string | null;
  mp_last_event_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  last_payment_id?: string | null;
  last_payment_status?: string | null;
  last_payment_at?: string | null;
  next_billing_at?: string | null;
  canceled_at?: string | null;
};

type AccountIdRow = {
  id: string;
};

export type AccountRow = AccountIdRow & AccountMipropinaPayload;

const ACCOUNT_SELECT =
  "id,brand_id,user_id,auth_user_id,status,trial_start,trial_end,mp_preapproval_id,mp_preapproval_status,mp_last_event_id,current_period_start,current_period_end,last_payment_id,last_payment_status,last_payment_at,next_billing_at,canceled_at";

export async function patchAccountByBrandId(
  brandId: string,
  payload: Partial<AccountMipropinaPayload>,
): Promise<AccountIdRow[]> {
  const encodedBrandId = encodeURIComponent(brandId);
  const response = await supabaseRestRequest(
    `/rest/v1/account_mipropina?brand_id=eq.${encodedBrandId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  return (await response.json()) as AccountIdRow[];
}

export async function patchAccountByClerkId(
  clerkUserId: string,
  payload: Partial<AccountMipropinaPayload>,
): Promise<AccountIdRow[]> {
  const encodedClerkUserId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/account_mipropina?auth_user_id=eq.${encodedClerkUserId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  return (await response.json()) as AccountIdRow[];
}

export async function getAccountByBrandId(brandId: string): Promise<AccountRow | null> {
  const encodedBrandId = encodeURIComponent(brandId);
  const response = await supabaseRestRequest(
    `/rest/v1/account_mipropina?brand_id=eq.${encodedBrandId}&select=${ACCOUNT_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as AccountRow[];
  return rows[0] ?? null;
}

export async function getAccountByClerkId(clerkUserId: string): Promise<AccountRow | null> {
  const encodedClerkUserId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/account_mipropina?auth_user_id=eq.${encodedClerkUserId}&select=${ACCOUNT_SELECT}&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as AccountRow[];
  return rows[0] ?? null;
}

export async function insertAccount(payload: AccountMipropinaPayload): Promise<AccountIdRow[]> {
  const response = await supabaseRestRequest("/rest/v1/account_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  return (await response.json()) as AccountIdRow[];
}
