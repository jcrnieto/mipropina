import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  ExternalLink,
  Gauge,
  Star,
  UsersRound,
} from "lucide-react";
import { RestaurantPhotoUploader } from "@/app/components/admin/RestaurantPhotoUploader";
import { RestaurantQR } from "@/app/components/admin/RestaurantQR";
import { RestaurantMenuUploader } from "@/app/components/admin/RestaurantMenuUploader";
import { PersonalDataEditor } from "@/app/components/admin/PersonalDataEditor";
import { RatingConfigEditor } from "@/app/components/admin/RatingConfigEditor";
import { WaitersSection } from "@/app/components/admin/WaitersSection";
import { AnalyticsDashboard } from "@/app/components/admin/AnalyticsDashboard";
import { requireOnboardedUser } from "@/app/lib/auth";
import { buildAdminPath } from "@/app/lib/brand";
import { NavbarAdmin } from "@/app/components/admin/NavbarAdmin";
import { UpgradeToProCard } from "@/app/components/admin/UpgradeToProCard";

type AdminBrandPageProps = {
  params: Promise<{ brandSlug: string }>;
};

function getBillingBadge(status: string): { label: string; tone: string } {
  if (status === "subscription_active") {
    return { label: "Suscripción activa", tone: "bg-[#e7f7ef] text-[#1b7b45] border-[#b5e8cb]" };
  }
  if (status === "trial_active") {
    return { label: "Prueba activa", tone: "bg-[#fff4e1] text-[#9b5e12] border-[#f3d7a5]" };
  }
  if (status === "subscription_pending") {
    return { label: "Suscripción pendiente", tone: "bg-[#f0f4ff] text-[#2f4f9c] border-[#cedaf8]" };
  }
  if (status === "subscription_cancelled") {
    return { label: "Suscripción cancelada", tone: "bg-[#ffecec] text-[#a43a3a] border-[#f5c1c1]" };
  }
  return { label: "Acceso limitado", tone: "bg-[#eef1f6] text-[#5a6478] border-[#d8dfea]" };
}

function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (!Number.isFinite(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

export default async function AdminBrandPage({ params }: AdminBrandPageProps) {
  const [{ brandSlug }, { onboarding, billing }] = await Promise.all([params, requireOnboardedUser()]);

  if (brandSlug !== onboarding.brandSlug) {
    redirect(buildAdminPath(onboarding.brandSlug!));
  }

  const badge = getBillingBadge(billing.status);
  const trialDaysLeft = getTrialDaysRemaining(billing.trialEndsAt);
  const storeUrl = `/${brandSlug}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#eef4ff_0%,#f8fbff_42%,#ffffff_100%)]">
      <NavbarAdmin brandSlug={brandSlug} brandName={onboarding.brandName} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {billing.status === "trial_active" ? <UpgradeToProCard trialEndsAt={billing.trialEndsAt} /> : null}

        <section
          id="resumen"
          className="overflow-hidden rounded-3xl border border-[#d8e0ef] bg-white shadow-[0_18px_45px_rgba(29,51,97,0.12)]"
        >
          <div className="relative p-6 md:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#2f66dc]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-[#17aeb8]/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6b7a99]">Control central</p>
                  <h1 className="mt-2 font-display text-3xl font-bold text-[#0f1b35] md:text-4xl">
                    {onboarding.brandName ?? "Tu restaurante"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-[#5a6a8a] md:text-base">
                    Gestiona identidad, mozos, reseñas y carta desde un solo lugar. Este tablero prioriza tareas de
                    mayor impacto para la operación diaria.
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${badge.tone}`}
                >
                  {badge.label}
                </span>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <article className="rounded-2xl border border-[#d9e2f2] bg-[#f6f9ff] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6d7ea0]">Acceso</p>
                  <p className="mt-1 text-lg font-semibold text-[#15264a]">
                    {billing.status === "subscription_active" || billing.status === "trial_active"
                      ? "Habilitado"
                      : "Revisar"}
                  </p>
                  <p className="mt-2 text-xs text-[#6d7ea0]">Estado actual del panel.</p>
                </article>

                <article className="rounded-2xl border border-[#d9e2f2] bg-[#f6f9ff] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6d7ea0]">Prueba</p>
                  <p className="mt-1 text-lg font-semibold text-[#15264a]">
                    {trialDaysLeft === null ? "-" : `${trialDaysLeft} días`}
                  </p>
                  <p className="mt-2 text-xs text-[#6d7ea0]">Restantes antes de suscripción.</p>
                </article>

                <article className="rounded-2xl border border-[#d9e2f2] bg-[#f6f9ff] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6d7ea0]">Ruta pública</p>
                  <p className="mt-1 truncate text-lg font-semibold text-[#15264a]">{storeUrl}</p>
                  <Link
                    href={storeUrl}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1f4ca8] hover:text-[#163a82]"
                  >
                    Abrir store
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </article>

                <article className="rounded-2xl border border-[#d9e2f2] bg-[#f6f9ff] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6d7ea0]">Siguiente foco</p>
                  <p className="mt-1 text-lg font-semibold text-[#15264a]">Mejorar experiencia</p>
                  <p className="mt-2 text-xs text-[#6d7ea0]">Configura reseñas y carta pública.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <AnalyticsDashboard />

        <section className="grid gap-4 md:grid-cols-3">
          <a
            href="#mozos"
            className="group rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_10px_25px_rgba(30,48,90,0.08)] transition hover:translate-y-[-2px]"
          >
            <div className="inline-flex rounded-xl bg-[#ecf2ff] p-2 text-[#2f66dc]">
              <UsersRound className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[#122443]">Gestionar mozos</h3>
            <p className="mt-1 text-sm text-[#607193]">Alta, edición y links de cobro.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2f66dc]">
              Ir a mozos
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          <a
            href="#calificaciones"
            className="group rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_10px_25px_rgba(30,48,90,0.08)] transition hover:translate-y-[-2px]"
          >
            <div className="inline-flex rounded-xl bg-[#ecfef7] p-2 text-[#139c71]">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[#122443]">Diseñar reseña</h3>
            <p className="mt-1 text-sm text-[#607193]">Define qué preguntas responden tus clientes.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2f66dc]">
              Configurar
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          <a
            href="#menu"
            className="group rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_10px_25px_rgba(30,48,90,0.08)] transition hover:translate-y-[-2px]"
          >
            <div className="inline-flex rounded-xl bg-[#eefbff] p-2 text-[#1294b5]">
              <Gauge className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-[#122443]">Actualizar carta</h3>
            <p className="mt-1 text-sm text-[#607193]">Sube el archivo que ve el cliente.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2f66dc]">
              Gestionar
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        </section>

        <section className="rounded-2xl border border-[#d8e0ef] bg-white p-4 shadow-[0_10px_25px_rgba(30,48,90,0.08)] md:p-5">
          <h2 className="text-lg font-semibold text-[#122443]">Flujo recomendado de configuración</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <a href="#datos-personales" className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-3">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7093]">
                <CircleCheck className="h-3.5 w-3.5" />
                Paso 1
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1a2c52]">Identidad del local</p>
              <p className="mt-1 text-xs text-[#607193]">Datos del titular y marca.</p>
            </a>
            <a href="#mozos" className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-3">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7093]">
                <Clock3 className="h-3.5 w-3.5" />
                Paso 2
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1a2c52]">Equipo y cobro</p>
              <p className="mt-1 text-xs text-[#607193]">Carga mozos con sus links de pago.</p>
            </a>
            <a href="#calificaciones" className="rounded-xl border border-[#dfe6f3] bg-[#f7faff] p-3">
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7093]">
                <Star className="h-3.5 w-3.5" />
                Paso 3
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1a2c52]">Feedback y carta</p>
              <p className="mt-1 text-xs text-[#607193]">Activa reseñas y menú para el público.</p>
            </a>
          </div>
        </section>

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
