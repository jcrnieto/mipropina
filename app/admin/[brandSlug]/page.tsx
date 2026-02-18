import { redirect } from "next/navigation";
import { RestaurantPhotoUploader } from "../../components/admin/RestaurantPhotoUploader";
import { RestaurantQR } from "../../components/admin/RestaurantQR";
import { PersonalDataEditor } from "../../components/admin/PersonalDataEditor";
import { RatingConfigEditor } from "../../components/admin/RatingConfigEditor";
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
        <section id="datos-personales">
          <PersonalDataEditor />
        </section>

        <section id="calificaciones">
          <RatingConfigEditor />
        </section>

        <section id="foto" className="grid gap-6 lg:grid-cols-2">
          <RestaurantPhotoUploader />
          <RestaurantQR brandSlug={brandSlug} />
        </section>
        <section id="mozos">
          <WaitersSection />
        </section>
      </div>
    </main>
  );
}
