export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { getRatingConfigByClerkId, upsertRatingConfigByClerkId } from "@/app/lib/supabase/admin";
import { validateRatingConfig } from "@/app/validations";

type RatingConfigPayload = {
  features?: unknown;
};

function readFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const config = await getRatingConfigByClerkId(userId);
    return Response.json({
      ok: true,
      features: config?.features ?? [],
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar la configuracion." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RatingConfigPayload;
    const validation = validateRatingConfig({
      features: readFeatures(body.features),
    });

    if (!validation.isValid) {
      return Response.json(
        { ok: false, error: validation.errors[0] ?? "Configuracion invalida." },
        { status: 400 },
      );
    }

    const updated = await upsertRatingConfigByClerkId({
      clerkUserId: userId,
      features: validation.values.features,
    });

    return Response.json({
      ok: true,
      features: updated.features,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar la configuracion." },
      { status: 500 },
    );
  }
}
