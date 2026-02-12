import { redirect } from "next/navigation";
import { requireSignedInUser, getOnboardingDataFromUser } from "../lib/auth";
import { buildAdminPath } from "../lib/brand";
import { submitOnboarding } from "./actions";

export default async function OnboardingPage() {
  const user = await requireSignedInUser();
  const onboarding = getOnboardingDataFromUser(user);

  if (onboarding.onboardingComplete && onboarding.brandSlug) {
    redirect(buildAdminPath(onboarding.brandSlug));
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-foreground">Completa tus datos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Te pedimos estos datos para crear tu panel de admin y la pagina publica de tu restaurante.
        </p>

        <form action={submitOnboarding} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={onboarding.fullName ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Telefono
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={onboarding.phone ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-foreground">
              Direccion
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              defaultValue={onboarding.address ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="brandName" className="text-sm font-medium text-foreground">
              Marca
            </label>
            <input
              id="brandName"
              name="brandName"
              type="text"
              required
              defaultValue={onboarding.brandName ?? ""}
              placeholder="Ej: Chetapis"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Con este nombre generamos rutas como <code>/admin/chetapis</code> y <code>/chetapis</code>.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
          >
            Continuar al admin
          </button>
        </form>
      </section>
    </main>
  );
}
