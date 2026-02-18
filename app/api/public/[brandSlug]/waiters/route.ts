import {
  getPublicStoreInfoByBrandSlug,
  getRatingFeaturesByBrandSlug,
  listEmployeesByBrandSlug,
} from "@/app/lib/supabase/admin";

type RouteProps = {
  params: Promise<{ brandSlug: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  try {
    const { brandSlug } = await params;
    if (!brandSlug) {
      return Response.json({ ok: false, error: "brandSlug is required" }, { status: 400 });
    }

    const [employees, storeInfo, ratingFeatures] = await Promise.all([
      listEmployeesByBrandSlug(brandSlug),
      getPublicStoreInfoByBrandSlug(brandSlug),
      getRatingFeaturesByBrandSlug(brandSlug),
    ]);

    return Response.json({
      ok: true,
      store: {
        brandName: storeInfo?.brand_name ?? null,
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
