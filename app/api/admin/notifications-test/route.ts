export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { getRestaurantNotificationTarget } from "@/app/lib/server/modules/notifications/notifications-config.service";
import { sendOneSignalPushToExternalId } from "@/app/lib/server/modules/notifications/onesignal.service";

type ApiResponse = {
  ok: boolean;
  error?: string;
};

export async function POST(req: Request): Promise<Response> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" } as ApiResponse, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get("brandSlug");
    const restaurantSlug = searchParams.get("restaurantSlug");
    if (!brandSlug || !restaurantSlug) {
      return Response.json(
        { ok: false, error: "brandSlug and restaurantSlug are required" } as ApiResponse,
        { status: 400 },
      );
    }

    const target = await getRestaurantNotificationTarget({ brandSlug, restaurantSlug });
    if (!target || target.authUserId !== userId) {
      return Response.json({ ok: false, error: "No se encontro el local." } as ApiResponse, { status: 404 });
    }

    if (!target.enabled) {
      return Response.json(
        { ok: false, error: "Las notificaciones de este local estan desactivadas." } as ApiResponse,
        { status: 400 },
      );
    }

    await sendOneSignalPushToExternalId({
      externalId: userId,
      title: "Prueba de notificaciones Satix",
      body: "Si recibiste esto, este dispositivo quedo conectado correctamente.",
      data: {
        type: "notification_test",
        brandSlug,
        restaurantSlug,
      },
    });

    return Response.json({ ok: true } as ApiResponse);
  } catch (error) {
    console.error("[notifications-test][onesignal] failed", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo enviar la prueba." } as ApiResponse,
      { status: 500 },
    );
  }
}
