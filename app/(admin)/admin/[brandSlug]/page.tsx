import { redirect } from "next/navigation";
import { RestaurantPhotoUploader } from "@/app/components/admin/RestaurantPhotoUploader";
import { RestaurantQR } from "@/app/components/admin/RestaurantQR";
import { RestaurantMenuUploader } from "@/app/components/admin/RestaurantMenuUploader";
import { PersonalDataEditor } from "@/app/components/admin/PersonalDataEditor";
import { RatingConfigEditor } from "@/app/components/admin/RatingConfigEditor";
import { WaitersSection } from "@/app/components/admin/WaitersSection";
import { requireOnboardedUser } from "@/app/lib/auth";
import { buildAdminPath } from "@/app/lib/brand";
import { NavbarAdmin } from "@/app/components/admin/NavbarAdmin";
import { UpgradeToProCard } from "@/app/components/admin/UpgradeToProCard";

type AdminBrandPageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function AdminBrandPage({ params }: AdminBrandPageProps) {
  const [{ brandSlug }, { onboarding, billing }] = await Promise.all([params, requireOnboardedUser()]);

  if (brandSlug !== onboarding.brandSlug) {
    redirect(buildAdminPath(onboarding.brandSlug!));
  }

  return (
    <main className="min-h-screen gradient-hero">
      <NavbarAdmin />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {billing.status === "trial_active" ? (
          <UpgradeToProCard trialEndsAt={billing.trialEndsAt} />
        ) : null}

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
        <section id="menu">
          <RestaurantMenuUploader />
        </section>
        <section id="mozos">
          <WaitersSection />
        </section>
      </div>
    </main>
  );
}

