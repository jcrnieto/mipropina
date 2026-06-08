import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type PlatformUserRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  profile_completed: boolean;
  last_login: string | null;
};

export type PlatformBrandRow = {
  id: string;
  owner_user_id: string;
  owner_auth_user_id: string;
  name: string;
  slug: string;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at?: string;
};

export type PlatformRestaurantRow = {
  id: string;
  brand_id: string | null;
  auth_user_id: string;
  brand_name: string | null;
  branch_name: string | null;
  slug: string;
  is_active: boolean;
};

export type PlatformAccountRow = {
  id: string;
  brand_id: string | null;
  auth_user_id: string;
  status: "trial_active" | "trial_expired" | "active" | "past_due" | "canceled" | "incomplete";
  trial_start: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  next_billing_at: string | null;
  canceled_at: string | null;
};

async function listRows<T>(path: string): Promise<T[]> {
  const response = await supabaseRestRequest(path, {
    method: "GET",
    headers: {
      Prefer: "return=representation",
    },
  });

  return (await response.json()) as T[];
}

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  return listRows(
    "/rest/v1/users_mipropina?select=id,auth_user_id,email,profile_completed,last_login&order=last_login.desc",
  );
}

export async function listPlatformBrands(): Promise<PlatformBrandRow[]> {
  return listRows(
    "/rest/v1/brands_mipropina?select=id,owner_user_id,owner_auth_user_id,name,slug,onboarding_completed,is_active,created_at&order=created_at.desc",
  );
}

export async function listPlatformRestaurants(): Promise<PlatformRestaurantRow[]> {
  return listRows(
    "/rest/v1/restaurants_mipropina?select=id,brand_id,auth_user_id,brand_name,branch_name,slug,is_active",
  );
}

export async function listPlatformAccounts(): Promise<PlatformAccountRow[]> {
  return listRows(
    "/rest/v1/account_mipropina?select=id,brand_id,auth_user_id,status,trial_start,trial_end,current_period_end,next_billing_at,canceled_at",
  );
}
