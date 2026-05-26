import { NextResponse } from "next/server";
import { validateOnboardingForm } from "@/app/validations/onboarding";
import { slugifyBrand } from "@/app/lib/brand";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawBrandName = String(body.brandName ?? "").trim();
    const rawRestaurantName = String(body.restaurantName ?? "").trim();

    const derivedBrandSlug = slugifyBrand(rawBrandName);
    const derivedRestaurantSlug = slugifyBrand(rawRestaurantName);

    const safeBrandSlug =
      derivedBrandSlug && derivedBrandSlug.length >= 2
        ? derivedBrandSlug
        : rawBrandName
            .toLowerCase()
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || `marca-${Date.now().toString(36)}`;

    const safeRestaurantSlug =
      derivedRestaurantSlug && derivedRestaurantSlug.length >= 2
        ? derivedRestaurantSlug
        : rawRestaurantName
            .toLowerCase()
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || `local-${Date.now().toString(36)}`;

    const validation = validateOnboardingForm({
      brandName: rawBrandName,
      brandSlug: safeBrandSlug,
      restaurantName: rawRestaurantName,
      restaurantSlug: safeRestaurantSlug,
    });

    return NextResponse.json({
      ok: true,
      rawBrandName,
      rawRestaurantName,
      derivedBrandSlug,
      derivedRestaurantSlug,
      safeBrandSlug,
      safeRestaurantSlug,
      validation,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
