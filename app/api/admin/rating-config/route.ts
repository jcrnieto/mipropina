export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import {
  getRatingConfigByBrandAndRestaurantSlug,
  getRatingConfigByBrandSlug,
  getRatingConfigByClerkId,
  upsertRatingConfigByClerkId,
} from "@/app/lib/server/modules/rating-config/rating-config.service";
import { validateRatingConfig } from "@/app/validations";

type RatingConfigPayload = {
  features?: unknown;
};

function readFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const brandSlug = new URL(req.url).searchParams.get("brandSlug");
    const restaurantSlug = new URL(req.url).searchParams.get("restaurantSlug");
    const config =
      brandSlug && restaurantSlug
        ? await getRatingConfigByBrandAndRestaurantSlug(brandSlug, restaurantSlug)
        : brandSlug
          ? await getRatingConfigByBrandSlug(brandSlug)
          : await getRatingConfigByClerkId(userId);
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

    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get("brandSlug");
    const restaurantSlug = searchParams.get("restaurantSlug");
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
      brandSlug,
      restaurantSlug,
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

