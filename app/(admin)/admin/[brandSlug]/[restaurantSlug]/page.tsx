import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireOnboardedUser } from "@/app/lib/auth";
import { getRestaurantByBrandSlugAndRestaurantSlug } from "@/app/lib/server/modules/restaurants/restaurants.service";
import { NavbarAdmin } from "@/app/components/admin/NavbarAdmin";
import { RestaurantQR } from "@/app/components/admin/RestaurantQR";
import { AnalyticsDashboard } from "@/app/components/admin/AnalyticsDashboard";
import { GeneralTipLinkEditor } from "@/app/components/admin/GeneralTipLinkEditor";
import { NotificationsManager } from "@/app/components/admin/NotificationsManager";
import { PersonalDataEditor } from "@/app/components/admin/PersonalDataEditor";
import { RatingConfigEditor } from "@/app/components/admin/RatingConfigEditor";
import { RestaurantMenuUploader } from "@/app/components/admin/RestaurantMenuUploader";
import { RestaurantPhotoUploader } from "@/app/components/admin/RestaurantPhotoUploader";
import { WaitersSection } from "@/app/components/admin/WaitersSection";

type Props = {
  params: Promise<{ brandSlug: string; restaurantSlug: string }>;
};

export default async function RestaurantAdminPage({ params }: Props) {
  const [{ brandSlug, restaurantSlug }, { user }] = await Promise.all([params, requireOnboardedUser()]);

  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(brandSlug, restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== user.id) {
    redirect("/admin");
  }

  const displayBrandName = restaurant.brand_name ?? restaurantSlug;
  const branchName = restaurant.branch_name ?? restaurantSlug;
  const brandPublicPath = restaurant.brands_mipropina?.[0]?.public_path ?? restaurant.brands_mipropina?.[0]?.slug ?? brandSlug;
  const normalizedBrandPath = brandPublicPath ? brandPublicPath.replace(/^\/+|\/+$/g, "") : null;
  const storeUrl = normalizedBrandPath ? `/${normalizedBrandPath}/${restaurant.slug}` : `/${restaurant.slug}`;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[linear-gradient(160deg,#eef4ff_0%,#f8fbff_42%,#ffffff_100%)]">
      <NavbarAdmin brandSlug={brandSlug} brandName={displayBrandName} storePath={storeUrl} />
      <div className="mx-auto w-full max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold leading-tight text-[#0f1b35] sm:text-3xl">
              {displayBrandName} — {branchName}
            </h1>
            <p className="mt-2 text-sm text-[#58627f]">Panel del local con metrics, carta, mozos y reseñas.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href={`/admin/${brandSlug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e0ef] bg-white px-4 py-2 text-sm font-medium text-[#1c376f] transition hover:bg-[#f7f9ff]"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al panel general
            </Link>
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6dfef] bg-white px-4 py-2 text-sm font-medium text-[#1c376f] transition hover:bg-[#f7f9ff]"
            >
              Ver sitio publico
            </a>
          </div>
        </div>

        <section id="resumen" className="rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_18px_45px_rgba(29,51,97,0.10)] sm:rounded-3xl sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#6b7a99]">Resumen</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-[#122443]">Estado del local</h2>
                <p className="mt-2 text-sm text-[#607193]">
                  Accede a la información principal del restaurante y a sus acciones operativas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5f82d6]">Ruta publica</p>
                  <p className="mt-2 break-all text-sm font-medium text-[#1c376f]">{storeUrl}</p>
                </div>
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5f82d6]">Sucursal</p>
                  <p className="mt-2 text-sm font-medium text-[#1c376f]">{branchName}</p>
                  <p className="mt-1 text-sm text-[#607193]">Slug: {restaurant.slug}</p>
                </div>
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5f82d6]">Marca</p>
                  <p className="mt-2 text-sm font-medium text-[#1c376f]">{displayBrandName}</p>
                </div>
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5f82d6]">Contacto</p>
                  <p className="mt-2 text-sm font-medium text-[#1c376f]">{restaurant.phone ?? "No cargado"}</p>
                  <p className="mt-1 text-sm text-[#607193]">{restaurant.address ?? "No cargada"}</p>
                </div>
              </div>
            </div>
            <RestaurantQR storePath={storeUrl} />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="datos-personales">
            <PersonalDataEditor />
          </div>
          <div id="foto">
            <RestaurantPhotoUploader />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="calificaciones">
            <RatingConfigEditor brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
          </div>
          <div id="menu">
            <RestaurantMenuUploader brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
          </div>
        </div>

        <section id="propina-general">
          <GeneralTipLinkEditor brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
        </section>

        <section id="notificaciones">
          <NotificationsManager brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
        </section>

        <section id="analytics">
          <AnalyticsDashboard brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
        </section>

        <section id="mozos" className="rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_18px_45px_rgba(29,51,97,0.10)] sm:rounded-3xl sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#6b7a99]">Mozos</p>
              <h2 className="mt-2 text-2xl font-bold text-[#122443]">Equipo de mozos</h2>
              <p className="mt-2 text-sm text-[#607193]">Crea, edita y elimina los mozos de este restaurante.</p>
            </div>
            <WaitersSection brandSlug={brandSlug} restaurantSlug={restaurant.slug} />
          </div>
        </section>
      </div>
    </main>
  );
}
