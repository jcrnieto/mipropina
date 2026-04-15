export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import {
  getPrimaryRestaurantProfileByClerkId,
  patchPrimaryRestaurantByClerkId,
} from "@/app/lib/server/modules/restaurants/restaurants.service";
import { ONBOARDING_FIELD_RULES } from "@/app/validations";

type PersonalDataPayload = {
  phone?: unknown;
  address?: unknown;
  instagram?: unknown;
  facebook?: unknown;
  tiktok?: unknown;
};

function readRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSocialUrl(value: unknown): string | null {
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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await getPrimaryRestaurantProfileByClerkId(userId);
    if (!restaurant) {
      return Response.json({ ok: false, error: "No se encontro un local para esta cuenta." }, { status: 404 });
    }

    return Response.json({
      ok: true,
      restaurantData: {
        brandName: restaurant.brandName,
        branchName: restaurant.branchName,
        phone: restaurant.phone,
        address: restaurant.address,
        instagram: restaurant.instagram,
        facebook: restaurant.facebook,
        tiktok: restaurant.tiktok,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los datos" },
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

    const body = (await req.json()) as PersonalDataPayload;
    const phone = readRequiredString(body.phone);
    const address = readRequiredString(body.address);
    if (
      !phone ||
      phone.length < ONBOARDING_FIELD_RULES.phone.minLength ||
      phone.length > ONBOARDING_FIELD_RULES.phone.maxLength
    ) {
      return Response.json({ ok: false, error: "Revisa el telefono del local." }, { status: 400 });
    }

    if (
      !address ||
      address.length < ONBOARDING_FIELD_RULES.address.minLength ||
      address.length > ONBOARDING_FIELD_RULES.address.maxLength
    ) {
      return Response.json({ ok: false, error: "Revisa la direccion del local." }, { status: 400 });
    }

    const instagram = normalizeSocialUrl(body.instagram);
    const facebook = normalizeSocialUrl(body.facebook);
    const tiktok = normalizeSocialUrl(body.tiktok);

    const patched = await patchPrimaryRestaurantByClerkId(userId, {
      phone,
      address,
      instagram,
      facebook,
      tiktok,
    });

    if (!patched) {
      return Response.json(
        { ok: false, error: "No se encontro el registro del local para guardar los cambios." },
        { status: 500 },
      );
    }

    const restaurant = await getPrimaryRestaurantProfileByClerkId(userId);
    if (!restaurant) {
      return Response.json({ ok: false, error: "No se pudo recargar el local actualizado." }, { status: 500 });
    }

    return Response.json({
      ok: true,
      restaurantData: {
        brandName: restaurant.brandName,
        branchName: restaurant.branchName,
        phone: restaurant.phone,
        address: restaurant.address,
        instagram: restaurant.instagram,
        facebook: restaurant.facebook,
        tiktok: restaurant.tiktok,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron guardar los datos" },
      { status: 500 },
    );
  }
}

