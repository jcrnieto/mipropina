import { redirect } from "next/navigation";
import { RestaurantPhotoUploader } from "../../components/admin/RestaurantPhotoUploader";
import { WaitersSection } from "../../components/admin/WaitersSection";
import { requireOnboardedUser } from "../../lib/auth";
import { buildAdminPath } from "../../lib/brand";
import { NavBarAdmin } from "@/app/components/admin/NavBarAdmin";

type AdminBrandPageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function AdminBrandPage({ params }: AdminBrandPageProps) {
  const [{ brandSlug }, { onboarding }] = await Promise.all([params, requireOnboardedUser()]);

  if (brandSlug !== onboarding.brandSlug) {
    redirect(buildAdminPath(onboarding.brandSlug!));
  }

  return (
    <main className="min-h-screen gradient-hero">
      <NavBarAdmin />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* <header className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-primary">Panel privado</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            Configuracion de tu restaurante
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Desde aca podes subir la foto del local y administrar tus mozos.
          </p>
        </header> */}

        <section id="foto">
          <RestaurantPhotoUploader />
        </section>
        <section id="mozos">
          <WaitersSection />
        </section>
      </div>
    </main>
  );
}
