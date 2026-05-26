import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getBillingDataForBrand,
  resolveOnboardingDataForUser,
  requireSignedInUser,
} from "../lib/auth";
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
    reason?: string;
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
    case "brand-taken":
      return "Esa ruta de marca ya esta en uso. Proba con otro nombre o borra los datos anteriores de esa cuenta.";
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
  const onboarding = await resolveOnboardingDataForUser(user);
  const billing = await getBillingDataForBrand(onboarding.brandId, user.id);
  const selectedPlan = resolvePlan(query.plan, billing.mode);
  const forceSubscriptionFlow = query.plan === "subscription";
  const trialDays = resolveTrialDays(query.trialDays, billing.trialDays);
  const errorMessage = resolveErrorMessage(query.error);

  if (
    onboarding.onboardingComplete &&
    hasActiveAdminAccess(billing) &&
    !forceSubscriptionFlow
  ) {
    redirect(onboarding.adminPath ?? "/admin");
  }

  const showBillingRequired = query.billing === "required";
  const isBlockedBilling = onboarding.onboardingComplete && !hasActiveAdminAccess(billing);

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
              {selectedPlan === "subscription"
                ? "Creá tu cuenta y activá Satix"
                : "Creá tu cuenta y activá tu prueba gratis"}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a5c7b] md:text-lg">
              {selectedPlan === "subscription" ? (
                "Primero cargamos los datos básicos de tu restaurante. Después te redirigimos a Mercado Pago para activar tu suscripción."
              ) : (
                "Primero cargamos los datos básicos de tu restaurante. Después entrás al panel para configurar tus alertas y generar el QR."
              )}
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">Tus datos se guardan en forma segura y privada.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">
                  {selectedPlan === "subscription"
                    ? "Vas a poder agregar más restaurantes desde el panel cuando quieras."
                    : "Vas a poder configurar qué situaciones querés detectar en tu restaurante."}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-[#d4dbee] bg-white/85 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2d62e0]" />
                <p className="text-sm text-[#334767]">
                  {selectedPlan === "subscription"
                    ? "La suscripción se calcula por cada restaurante activo."
                    : "La prueba dura 7 días y no necesitás tarjeta para empezar."}
                </p>
              </div>
            </div>
          </aside>

          <div className="rounded-2xl border border-[#d7ddeb] bg-white/92 p-6 shadow-[0_8px_24px_rgba(16,30,64,0.08)] md:p-8">
            <h2 className="font-display text-2xl font-bold text-[#0f1b35] md:text-3xl">
              Datos iniciales
            </h2>
            <p className="mt-2 text-sm text-[#607193]">Te lleva menos de un minuto.</p>

            {showBillingRequired ? (
              <div className="mt-4 rounded-xl border border-[#f5d8ad] bg-[#fff4e4] px-4 py-3 text-sm text-[#8d5b16]">
                Tu acceso al admin necesita una suscripción activa o una prueba vigente.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-[#f6c7c7] bg-[#fff0f0] px-4 py-3 text-sm text-[#962e2e]">
                {errorMessage}
              </div>
            ) : null}

            {isBlockedBilling && !forceSubscriptionFlow ? (
              <div className="mt-6 rounded-3xl border border-[#d7ddeb] bg-white/95 p-8 shadow-[0_20px_40px_rgba(14,24,55,0.08)]">
                <div className="flex flex-col gap-4">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7a99]">Acceso limitado</p>
                    <h2 className="font-display text-3xl font-bold text-[#0f1b35]">
                      {billing.status === "trial_expired"
                        ? "Tu prueba gratis terminó"
                        : billing.status === "subscription_pending"
                        ? "Suscripción pendiente"
                        : billing.status === "subscription_cancelled"
                        ? "Suscripción cancelada"
                        : "Tu panel está bloqueado"}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#4a5c7b]">
                      {billing.status === "trial_expired"
                        ? "Tus datos y tu configuración quedan guardados. Para recuperar el panel y seguir usando Satix, activá una suscripción."
                        : billing.status === "subscription_pending"
                        ? "Estamos esperando la confirmación de Mercado Pago. El acceso se habilitará cuando el pago se confirme."
                        : billing.status === "subscription_cancelled"
                        ? "Tu suscripción fue cancelada. Reactivala para volver a usar el panel sin perder tu configuración."
                        : "Necesitás una suscripción activa para acceder al panel."
                      }
                    </p>
                  </div>

                  {billing.status === "trial_expired" && billing.trialEndsAt ? (
                    <div className="rounded-2xl border border-[#dce5f6] bg-[#f6f9ff] p-4 text-sm text-[#334767]">
                      Tu prueba finalizó el {new Date(billing.trialEndsAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}.
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/onboarding?plan=subscription"
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2f66dc] px-4 text-sm font-semibold text-white transition hover:bg-[#2654b2]"
                    >
                      Activar suscripción
                    </Link>
                    <Link
                      href="/admin"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d7ddeb] bg-white px-4 text-sm font-semibold text-[#0f1b35] transition hover:bg-[#f7f9ff]"
                    >
                      Volver al admin
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form action={submitOnboarding} className="mt-6 space-y-4">
              <input type="hidden" name="billingMode" value={selectedPlan} />
              <input type="hidden" name="trialDays" value={String(trialDays)} />

              <div className="space-y-1.5">
                <label htmlFor="brandName" className="text-sm font-medium text-[#233556]">
                  Nombre de tu marca
                </label>
                <input
                  id="brandName"
                  name="brandName"
                  type="text"
                    required
                    minLength={ONBOARDING_FIELD_RULES.brandName.minLength}
                    maxLength={ONBOARDING_FIELD_RULES.brandName.maxLength}
                    defaultValue={onboarding.brandName ?? ""}
                  placeholder="Ej: La Parrilla de Juan"
                  className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition placeholder:text-[#8ca0c2] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
                <p className="text-xs text-[#607193]">
                  Usamos este nombre para identificar tu cuenta.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="restaurantName" className="text-sm font-medium text-[#233556]">
                  Nombre del local o sucursal
                </label>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  required
                  minLength={ONBOARDING_FIELD_RULES.restaurantName.minLength}
                  maxLength={ONBOARDING_FIELD_RULES.restaurantName.maxLength}
                  placeholder="Ej: Palermo"
                  className="h-11 w-full rounded-xl border border-[#ccd6ea] bg-[#f7faff] px-3.5 text-sm text-[#0f1b35] outline-none transition placeholder:text-[#8ca0c2] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
                <p className="text-xs text-[#607193]">
                  Si tenés un solo local, podés poner el nombre del barrio, la zona o “Local principal”.
                </p>
              </div>

              <div className="space-y-5">
                <p className="text-sm text-[#607193]">
                  Generamos la ruta del local automáticamente a partir del nombre.
                </p>
              </div>

              <div className="rounded-xl border border-[#dce5f6] bg-[#f6f9ff] p-4 text-sm text-[#334767]">
                {selectedPlan === "subscription" ? (
                  <p>
                    Al continuar, te llevamos a Mercado Pago para activar tu suscripción.
                  </p>
                ) : (
                  <p>
                    Al continuar, activamos tu prueba gratis por {trialDays} días y te llevamos al panel.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40"
              >
                {selectedPlan === "subscription" ? "Continuar al pago" : "Activar prueba gratis"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}
