import { auth } from "@clerk/nextjs/server";
import { slugifyBrand } from "@/app/lib/brand";
import { archiveRestaurantByClerkId } from "@/app/lib/server/modules/restaurants/restaurants.service";
import {
  createRestaurantByClerkId,
  listRestaurantsByClerkId,
} from "@/app/lib/server/modules/restaurants/restaurants.service";

type RestaurantPayload = {
  brandName?: unknown;
  branchName?: unknown;
  slug?: unknown;
  phone?: unknown;
  address?: unknown;
  instagram?: unknown;
  facebook?: unknown;
  tiktok?: unknown;
};

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await listRestaurantsByClerkId(userId);
    return Response.json({
      ok: true,
      restaurants: restaurants.map((restaurant) => ({
        id: restaurant.id,
        brandName: restaurant.brand_name ?? "",
        branchName: restaurant.branch_name ?? "",
        slug: restaurant.slug,
        brandSlug: restaurant.brands_mipropina?.[0]?.slug ?? restaurant.slug,
        brandPublicPath:
          restaurant.brands_mipropina?.[0]?.public_path ?? restaurant.brands_mipropina?.[0]?.slug ?? restaurant.slug,
        phone: restaurant.phone ?? "",
        address: restaurant.address ?? "",
        instagram: restaurant.instagram ?? "",
        facebook: restaurant.facebook ?? "",
        tiktok: restaurant.tiktok ?? "",
        image: restaurant.image,
        isActive: restaurant.is_active,
      })),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los locales." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const restaurantId = readOptionalString(url.searchParams.get("restaurantId"));
    if (!restaurantId) {
      return Response.json({ ok: false, error: "restaurantId es obligatorio." }, { status: 400 });
    }

    const billingSync = await archiveRestaurantByClerkId({
      clerkUserId: userId,
      restaurantId,
    });

    return Response.json({ ok: true, ...billingSync });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo eliminar el local." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RestaurantPayload;
    const brandName = readOptionalString(body.brandName);
    const branchName = readOptionalString(body.branchName);
    const rawSlug = readOptionalString(body.slug);
    const slug = rawSlug ? normalizeSlug(rawSlug) : slugifyBrand(branchName ?? "");

    if (!brandName || !branchName || !slug) {
      return Response.json(
        { ok: false, error: "Marca y sucursal son obligatorias para crear el local." },
        { status: 400 },
      );
    }

    const billingSync = await createRestaurantByClerkId({
      clerkUserId: userId,
      brandName,
      branchName,
      slug,
      phone: readOptionalString(body.phone),
      address: readOptionalString(body.address),
      instagram: readOptionalString(body.instagram),
      facebook: readOptionalString(body.facebook),
      tiktok: readOptionalString(body.tiktok),
    });

    return Response.json({ ok: true, ...billingSync });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear el local." },
      { status: 500 },
    );
  }
}
