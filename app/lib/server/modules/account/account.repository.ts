import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type AccountMipropinaStatus =
  | "trial_active"
  | "trial_expired"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export type AccountMipropinaPayload = {
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

export async function patchAccountByClerkId(
  clerkUserId: string,
  payload: Partial<AccountMipropinaPayload>,
): Promise<AccountIdRow[]> {
  const encodedId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/account_mipropina?auth_user_id=eq.${encodedId}`,
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

