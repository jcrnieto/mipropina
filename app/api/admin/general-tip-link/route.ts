export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import {
  getGeneralTipLinkByBrandAndRestaurantSlug,
  setGeneralTipLinkByBrandAndRestaurantSlug,
} from "@/app/lib/server/modules/restaurants/restaurants.service";

type GeneralTipLinkPayload = {
  generalTipLink?: unknown;
};

function normalizePaymentUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function readRequiredSearchParam(req: Request, key: string): string | null {
  const value = new URL(req.url).searchParams.get(key)?.trim();
  return value || null;
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const brandSlug = readRequiredSearchParam(req, "brandSlug");
    const restaurantSlug = readRequiredSearchParam(req, "restaurantSlug");
    if (!brandSlug || !restaurantSlug) {
      return Response.json({ ok: false, error: "brandSlug and restaurantSlug are required" }, { status: 400 });
    }

    const generalTipLink = await getGeneralTipLinkByBrandAndRestaurantSlug({
      clerkUserId: userId,
      brandSlug,
      restaurantSlug,
    });

    return Response.json({
      ok: true,
      generalTipLink,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el link de propina." },
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

    const brandSlug = readRequiredSearchParam(req, "brandSlug");
    const restaurantSlug = readRequiredSearchParam(req, "restaurantSlug");
    if (!brandSlug || !restaurantSlug) {
      return Response.json({ ok: false, error: "brandSlug and restaurantSlug are required" }, { status: 400 });
    }

    const body = (await req.json()) as GeneralTipLinkPayload;
    const generalTipLink = normalizePaymentUrl(body.generalTipLink);
    const rawLink = typeof body.generalTipLink === "string" ? body.generalTipLink.trim() : "";
    if (rawLink && !generalTipLink) {
      return Response.json({ ok: false, error: "El link de propina no es valido." }, { status: 400 });
    }

    const savedLink = await setGeneralTipLinkByBrandAndRestaurantSlug({
      clerkUserId: userId,
      brandSlug,
      restaurantSlug,
      generalTipLink,
    });

    return Response.json({
      ok: true,
      generalTipLink: savedLink,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar el link de propina." },
      { status: 500 },
    );
  }
}
