import { redirect } from "next/navigation";
import { RestaurantsManager } from "@/app/components/admin/RestaurantsManager";
import { UpgradeToProCard } from "@/app/components/admin/UpgradeToProCard";
import { requireOnboardedUser } from "@/app/lib/auth";
import { getBrandBySlug } from "@/app/lib/server/modules/brands/brands.service";
import { listRestaurantsByClerkId } from "@/app/lib/server/modules/restaurants/restaurants.service";

type AdminBrandPageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function AdminBrandPage({ params }: AdminBrandPageProps) {
  const [{ brandSlug }, { user, billing }] = await Promise.all([params, requireOnboardedUser()]);
  const brand = await getBrandBySlug(brandSlug);

  if (!brand || brand.owner_auth_user_id !== user.id) {
    redirect("/admin");
  }

  const restaurants = await listRestaurantsByClerkId(user.id);

  const billingLabel =
    billing.status === "subscription_active"
      ? "Suscripcion activa"
      : billing.status === "trial_active"
        ? "Prueba activa"
        : billing.status === "subscription_pending"
          ? "Suscripcion pendiente"
          : billing.status === "subscription_cancelled"
            ? "Suscripcion cancelada"
            : "Acceso limitado";

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#eef4ff_0%,#f8fbff_42%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {billing.status === "trial_active" ? <UpgradeToProCard trialEndsAt={billing.trialEndsAt} /> : null}
        <RestaurantsManager
          initialRestaurants={restaurants.map((restaurant) => ({
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
          }))}
          brandSlug={brandSlug}
          billingStatus={billingLabel}
        />
      </div>
    </main>
  );
}
