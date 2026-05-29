import {
  createRatingSubmissionByBrandAndRestaurantSlug,
  getRatingFeaturesByBrandAndRestaurantSlug,
} from "@/app/lib/server/modules/rating-config/rating-config.service";
import { getPublicStoreInfoByBrandAndRestaurantSlug } from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getEmployeeByBrandAndRestaurantSlugAndId } from "@/app/lib/server/modules/waiters/waiters.service";
import {
  sendWhatsAppLowRatingAlert,
  shouldNotifyLowRating,
} from "@/app/lib/server/modules/notifications/whatsapp.service";
import { getRestaurantNotificationTarget } from "@/app/lib/server/modules/notifications/notifications-config.service";
import { sendOneSignalLowRatingAlert } from "@/app/lib/server/modules/notifications/onesignal.service";
import { sendLowRatingEmailAlert } from "@/app/lib/server/modules/notifications/email-alert.service";

type RouteProps = {
  params: Promise<{ brandSlug: string; restaurantSlug: string }>;
};

type RatingPayload = {
  stars?: unknown;
  comment?: unknown;
  waiterId?: unknown;
  waiterServiceStars?: unknown;
};

function readStars(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));
}

function readComment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalStar(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }
  return parsed;
}

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { brandSlug, restaurantSlug } = await params;
    if (!brandSlug || !restaurantSlug) {
      return Response.json(
        { ok: false, error: "brandSlug and restaurantSlug are required" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as RatingPayload;
    const starsInput = readStars(body.stars);
    const comment = readComment(body.comment);
    const waiterId = readOptionalString(body.waiterId);
    const waiterServiceStars = readOptionalStar(body.waiterServiceStars);
    const configuredFeatures = await getRatingFeaturesByBrandAndRestaurantSlug(brandSlug, restaurantSlug);
    const hasWaiterContext = Boolean(waiterId);

    if (configuredFeatures.length === 0 && !hasWaiterContext) {
      return Response.json(
        { ok: false, error: "Este restaurante no tiene caracteristicas para calificar." },
        { status: 400 },
      );
    }

    if (starsInput.length !== configuredFeatures.length) {
      return Response.json(
        { ok: false, error: "La cantidad de puntajes no coincide con las caracteristicas configuradas." },
        { status: 400 },
      );
    }

    const invalid = starsInput.some((value) => !Number.isInteger(value) || value < 1 || value > 5);
    if (invalid) {
      return Response.json(
        { ok: false, error: "Cada puntaje debe ser un numero entero entre 1 y 5." },
        { status: 400 },
      );
    }

    if (hasWaiterContext) {
      const waiter = await getEmployeeByBrandAndRestaurantSlugAndId(brandSlug, restaurantSlug, waiterId!);
      if (!waiter) {
        return Response.json({ ok: false, error: "El mozo indicado no pertenece a este restaurante." }, { status: 400 });
      }

      if (waiterServiceStars === null) {
        return Response.json(
          { ok: false, error: "Debes puntuar la atencion del mozo para este QR." },
          { status: 400 },
        );
      }
    }

    const normalizedStars: Array<number | null> = [null, null, null, null, null];
    starsInput.forEach((value, index) => {
      if (index < normalizedStars.length) {
        normalizedStars[index] = value;
      }
    });

    await createRatingSubmissionByBrandAndRestaurantSlug({
      brandSlug,
      restaurantSlug,
      stars: normalizedStars,
      comment,
      waiterId,
      waiterServiceStars,
      entryType: hasWaiterContext ? "waiter_qr" : "general",
    });

    const notificationScores = waiterServiceStars === null ? starsInput : [...starsInput, waiterServiceStars];
    const notificationTarget =
      notificationScores.length > 0 && shouldNotifyLowRating(notificationScores)
        ? await getRestaurantNotificationTarget({ brandSlug, restaurantSlug })
        : null;
    if (notificationTarget?.enabled) {
      const storeInfo = await getPublicStoreInfoByBrandAndRestaurantSlug(brandSlug, restaurantSlug);
      const averageStars = notificationScores.reduce((sum, item) => sum + item, 0) / notificationScores.length;
      const lowestStars = Math.min(...notificationScores);
      const brandName = storeInfo?.brandName?.trim() || brandSlug;

      try {
        await sendOneSignalLowRatingAlert({
          ownerAuthUserId: notificationTarget.authUserId,
          brandName,
          brandSlug,
          restaurantSlug,
          averageStars,
          lowestStars,
          comment,
        });
      } catch (notificationError) {
        console.error("[rating-alert][onesignal] notification failed", notificationError);
      }

      try {
        await sendLowRatingEmailAlert({
          ownerAuthUserId: notificationTarget.authUserId,
          brandName,
          brandSlug,
          restaurantSlug,
          branchName: storeInfo?.branchName,
          averageStars,
          lowestStars,
          comment,
        });
      } catch (notificationError) {
        console.error("[rating-alert][email] notification failed", notificationError);
      }

      try {
        const ownerPhone = storeInfo?.phone?.trim() || "";
        if (ownerPhone) {
          await sendWhatsAppLowRatingAlert({
            ownerPhone,
            brandName,
            brandSlug,
            averageStars,
            lowestStars,
            comment,
          });
        }
      } catch (notificationError) {
        console.error("[rating-alert][whatsapp] notification failed", notificationError);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar la calificacion." },
      { status: 500 },
    );
  }
}
