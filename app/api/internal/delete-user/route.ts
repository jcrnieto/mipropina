export const runtime = "nodejs";

import { clerkClient } from "@clerk/nextjs/server";
import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

type DeleteUserPayload = {
  clerkUserId?: unknown;
};

function readRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMaintenanceApiKey(): string {
  const key = process.env.INTERNAL_MAINTENANCE_API_KEY;
  if (!key) {
    throw new Error("Missing INTERNAL_MAINTENANCE_API_KEY");
  }
  return key;
}

function isAuthorized(req: Request): boolean {
  const expectedKey = getMaintenanceApiKey();
  const receivedKey = req.headers.get("x-maintenance-key");
  return receivedKey === expectedKey;
}

async function deleteRowsByAuthUserId(table: string, clerkUserId: string): Promise<void> {
  const encodedId = encodeURIComponent(clerkUserId);
  await supabaseRestRequest(`/rest/v1/${table}?auth_user_id=eq.${encodedId}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });
}

function isClerkNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; errors?: Array<{ code?: string }> };
  if (maybe.status === 404) return true;
  return Boolean(maybe.errors?.some((item) => item.code === "resource_not_found"));
}

async function tryReadClerkUserIdFromJson(req: Request): Promise<string | null> {
  try {
    const body = (await req.json()) as DeleteUserPayload;
    return readRequiredString(body.clerkUserId);
  } catch {
    return null;
  }
}

async function handleDeleteUser(req: Request, allowQueryParam: boolean) {
  try {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const clerkUserIdFromQuery = allowQueryParam
      ? readRequiredString(url.searchParams.get("clerkUserId"))
      : null;
    const clerkUserId = clerkUserIdFromQuery ?? (await tryReadClerkUserIdFromJson(req));

    if (!clerkUserId) {
      return Response.json(
        { ok: false, error: "clerkUserId is required" },
        { status: 400 },
      );
    }

    // Child tables first, then parent.
    const tables = [
      "rating_submission_mipropina",
      "employee_mipropina",
      "rating_config_mipropina",
      "account_mipropina",
      "personal_data_mipropina",
      "users_mipropina",
    ];

    for (const table of tables) {
      await deleteRowsByAuthUserId(table, clerkUserId);
    }

    let clerkDeleted = true;
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
    } catch (error) {
      if (isClerkNotFoundError(error)) {
        clerkDeleted = false;
      } else {
        throw error;
      }
    }

    return Response.json({
      ok: true,
      clerkUserId,
      deletedFromSupabase: true,
      deletedFromClerk: clerkDeleted,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not delete user",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return handleDeleteUser(req, false);
}

export async function DELETE(req: Request) {
  return handleDeleteUser(req, true);
}
