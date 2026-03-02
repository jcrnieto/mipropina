import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

type UsersMipropinaRow = {
  id: string;
};

export type UsersMipropinaPayload = {
  email: string | null;
  profile_completed: boolean;
  last_login: string;
};

export async function upsertUsersMipropinaByClerkId(input: {
  clerkUserId: string;
  payload: UsersMipropinaPayload;
}): Promise<string> {
  const encodedId = encodeURIComponent(input.clerkUserId);

  const updateResponse = await supabaseRestRequest(
    `/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(input.payload),
    },
  );

  const updatedRows = (await updateResponse.json()) as UsersMipropinaRow[];
  const updatedId = updatedRows[0]?.id;
  if (updatedId) {
    return updatedId;
  }

  const insertResponse = await supabaseRestRequest("/rest/v1/users_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        auth_user_id: input.clerkUserId,
        ...input.payload,
      },
    ]),
  });

  const insertedRows = (await insertResponse.json()) as UsersMipropinaRow[];
  const insertedId = insertedRows[0]?.id;
  if (!insertedId) {
    throw new Error("Could not resolve users_mipropina.id");
  }

  return insertedId;
}

export async function getUsersMipropinaIdByClerkId(clerkUserId: string): Promise<string | null> {
  const encodedId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}&select=id`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as UsersMipropinaRow[];
  return rows[0]?.id ?? null;
}

export async function deleteUsersMipropinaByClerkId(clerkUserId: string): Promise<void> {
  const encodedId = encodeURIComponent(clerkUserId);

  await supabaseRestRequest(`/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });
}
