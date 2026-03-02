export type SupabaseAdminEnv = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

export async function supabaseRestRequest(path: string, init: RequestInit): Promise<Response> {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorText}`);
  }

  return response;
}
