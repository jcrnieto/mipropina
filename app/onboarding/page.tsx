import { redirect } from "next/navigation";
import {
  getBillingDataFromUser,
  getOnboardingDataFromUser,
  requireSignedInUser,
} from "../lib/auth";
import { buildAdminPath } from "../lib/brand";
import { hasActiveAdminAccess } from "@/app/lib/server/modules/subscriptions/subscriptions.service";
import { submitOnboarding } from "./actions";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ONBOARDING_FIELD_RULES } from "../validations";

type OnboardingPageProps = {
  searchParams: Promise<{
    plan?: string;
    trialDays?: string;
    error?: string;
    billing?: string;
  }>;
};

function resolvePlan(
  planRaw: string | undefined,
  fallbackMode: "trial" | "subscription" | null,
): "trial" | "subscription" {
  if (planRaw === "subscription") return "subscription";
  if (planRaw === "trial") return "trial";
  if (fallbackMode === "subscription") return "subscription";
  if (fallbackMode === "trial") return "trial";
  return "subscription";
}

function resolveTrialDays(daysRaw: string | undefined, fallbackDays: number | null): 7 | 14 {
  if (daysRaw === "14") return 14;
  if (daysRaw === "7") return 7;
  return fallbackDays === 14 ? 14 : 7;
}

function resolveErrorMessage(errorRaw: string | undefined): string | null {
  if (!errorRaw) return null;

  switch (errorRaw) {
    case "validation":
      return "Revisa los datos del formulario para continuar.";
    case "brand-slug":
      return "No pudimos generar la ruta de tu marca. Proba con otro nombre.";
    case "missing-email":
      return "No encontramos un email principal en tu cuenta para iniciar la suscripcion.";
    case "mercadopago":
      return "No pudimos iniciar Mercado Pago. Verifica credenciales y vuelve a intentar.";
    default:
      return "Ocurrio un problema al procesar tu solicitud.";
  }
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const [user, query] = await Promise.all([requireSignedInUser(), searchParams]);
  const onboarding = getOnboardingDataFromUser(user);
  const billing = getBillingDataFromUser(user);
  const selectedPlan = resolvePlan(query.plan, billing.mode);
  const forceSubscriptionFlow = query.plan === "subscription";
  const trialDays = resolveTrialDays(query.trialDays, billing.trialDays);
  const errorMessage = resolveErrorMessage(query.error);

  if (
    onboarding.onboardingComplete &&
    onboarding.brandSlug &&
    hasActiveAdminAccess(billing) &&
    !forceSubscriptionFlow
  ) {
    redirect(buildAdminPath(onboarding.brandSlug));
  }

  const showBillingRequired = query.billing === "required";

  return (
    <main className="relative min-h-screen gradient-hero overflow-hidden px-4 py-8 md:py-12">
      <div className="pointer-events-none absolute left-8 top-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-6xl rounded-3xl border border-white/65 bg-white/72 p-4 shadow-[0_26px_70px_rgba(14,24,55,0.15)] backdrop-blur md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <aside className="rounded-2xl border border-[#d7ddeb] bg-[#ecf1fb]/85 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Paso inicial del panel
            </span>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-[#0f1b35] md:text-5xl">
              Completa tus datos personales
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a5c7b] md:text-lg">
              Cargamos los datos de tu restaurante y luego elegis si queres activar prueba gratis o ir a
              suscripcion en Mercado Pago.
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">Tus datos se guardan en forma segura y privada.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">
                  La marca define tus rutas: <code>/admin/tu-marca</code> y <code>/tu-marca</code>.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">
                  Si elegis suscripcion, te redirigimos a Mercado Pago para activar el acceso al admin.
                </p>
              </div>
            </div>
          </aside>

          <div className="rounded-2xl border border-[#d7ddeb] bg-white/92 p-6 shadow-[0_8px_24px_rgba(16,30,64,0.08)] md:p-8">
            <h2 className="font-display text-2xl font-bold text-[#0f1b35] md:text-3xl">Datos del titular</h2>
            <p className="mt-2 text-sm text-[#607193]">Te lleva menos de un minuto.</p>

            {showBillingRequired ? (
              <div className="mt-4 rounded-xl border border-[#f5d8ad] bg-[#fff4e4] px-4 py-3 text-sm text-[#8d5b16]">
                Tu acceso al admin necesita una suscripcion activa o una prueba vigente.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-[#f6c7c7] bg-[#fff0f0] px-4 py-3 text-sm text-[#962e2e]">
                {errorMessage}
              </div>
            ) : null}

            <form action={submitOnboarding} className="mt-6 space-y-4">
              <input type="hidden" name="billingMode" value={selectedPlan} />
              <input type="hidden" name="trialDays" value={String(trialDays)} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium text-[#233556]">
                    Nombre
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    minLength={ONBOARDING_FIELD_RULES.firstName.minLength}
                    maxLength={ONBOARDING_FIELD_RULES.firstName.maxLength}
                    defaultValue={onboarding.firstName ?? ""}
                    className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium text-[#233556]">
                    Apellido
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    minLength={ONBOARDING_FIELD_RULES.lastName.minLength}
                    maxLength={ONBOARDING_FIELD_RULES.lastName.maxLength}
                    defaultValue={onboarding.lastName ?? ""}
                    className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-[#233556]">
                  Telefono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  minLength={ONBOARDING_FIELD_RULES.phone.minLength}
                  maxLength={ONBOARDING_FIELD_RULES.phone.maxLength}
                  defaultValue={onboarding.phone ?? ""}
                  className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="address" className="text-sm font-medium text-[#233556]">
                  Direccion
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  minLength={ONBOARDING_FIELD_RULES.address.minLength}
                  maxLength={ONBOARDING_FIELD_RULES.address.maxLength}
                  defaultValue={onboarding.address ?? ""}
                  className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="brandName" className="text-sm font-medium text-[#233556]">
                  Marca
                </label>
                <input
                  id="brandName"
                  name="brandName"
                  type="text"
                  required
                  minLength={ONBOARDING_FIELD_RULES.brandName.minLength}
                  maxLength={ONBOARDING_FIELD_RULES.brandName.maxLength}
                  defaultValue={onboarding.brandName ?? ""}
                  placeholder="Ej: Chetapis"
                  className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition placeholder:text-[#8ca0c2] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
                <p className="text-xs text-[#607193]">
                  Con este nombre generamos rutas como <code>/admin/chetapis</code> y <code>/chetapis</code>.
                </p>
              </div>

              <div className="rounded-xl border border-[#dce5f6] bg-[#f6f9ff] p-4 text-sm text-[#334767]">
                {selectedPlan === "subscription" ? (
                  <p>
                    Al continuar te redirigimos a Mercado Pago para activar tu suscripcion mensual.
                  </p>
                ) : (
                  <p>
                    Al continuar activamos tu prueba gratis por {trialDays} dias y entras directo al admin.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40"
              >
                {selectedPlan === "subscription" ? "Continuar a Mercado Pago" : `Activar prueba ${trialDays} dias`}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
