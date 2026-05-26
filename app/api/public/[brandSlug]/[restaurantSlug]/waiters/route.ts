import { listEmployeesByBrandAndRestaurantSlug } from "@/app/lib/server/modules/waiters/waiters.service";
import { getPublicStoreInfoByBrandAndRestaurantSlug } from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getRatingFeaturesByBrandAndRestaurantSlug } from "@/app/lib/server/modules/rating-config/rating-config.service";

type RouteProps = {
  params: Promise<{ brandSlug: string; restaurantSlug: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  try {
    const { brandSlug, restaurantSlug } = await params;
    if (!brandSlug || !restaurantSlug) {
      return Response.json({ ok: false, error: "brandSlug and restaurantSlug are required" }, { status: 400 });
    }

    const [employees, storeInfo, ratingFeatures] = await Promise.all([
      listEmployeesByBrandAndRestaurantSlug(brandSlug, restaurantSlug),
      getPublicStoreInfoByBrandAndRestaurantSlug(brandSlug, restaurantSlug),
      getRatingFeaturesByBrandAndRestaurantSlug(brandSlug, restaurantSlug),
    ]);

    return Response.json({
      ok: true,
      store: {
        brandName: storeInfo?.brandName ?? null,
        phone: storeInfo?.phone ?? null,
        address: storeInfo?.address ?? null,
        logo: storeInfo?.image ?? null,
      },
      ratingFeatures,
      waiters: employees.map((employee) => ({
        id: employee.id,
        firstName: employee.name ?? "",
        lastName: employee.last_name ?? "",
        dni: employee.dni ?? "",
        phone: employee.phone ?? "",
        mercadopagoLink: employee.mercadopago_link ?? "",
        photo: employee.image,
      })),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los mozos" },
      { status: 500 },
    );
  }
}
