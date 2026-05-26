export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import {
  getRestaurantNotificationsEnabled,
  setRestaurantNotificationsEnabled,
} from "@/app/lib/server/modules/notifications/notifications-config.service";

type NotificationsConfigPayload = {
  enabled?: unknown;
};

type ApiResponse = {
  ok: boolean;
  enabled?: boolean;
  error?: string;
};

export async function GET(req: Request): Promise<Response> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get("brandSlug");
    const restaurantSlug = searchParams.get("restaurantSlug");
    const enabled = await getRestaurantNotificationsEnabled({
      clerkUserId: userId,
      brandSlug,
      restaurantSlug,
    });

    return Response.json({
      ok: true,
      enabled,
    } as ApiResponse);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar la configuracion." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as NotificationsConfigPayload;
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get("brandSlug");
    const restaurantSlug = searchParams.get("restaurantSlug");

    if (typeof body.enabled !== "boolean") {
      return Response.json(
        { ok: false, error: "El campo 'enabled' debe ser un booleano." },
        { status: 400 },
      );
    }

    if (!brandSlug || !restaurantSlug) {
      return Response.json(
        { ok: false, error: "brandSlug and restaurantSlug are required" },
        { status: 400 },
      );
    }

    const enabled = await setRestaurantNotificationsEnabled({
      clerkUserId: userId,
      brandSlug,
      restaurantSlug,
      enabled: body.enabled,
    });

    return Response.json({
      ok: true,
      enabled,
    } as ApiResponse);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar la configuracion." },
      { status: 500 },
    );
  }
}
