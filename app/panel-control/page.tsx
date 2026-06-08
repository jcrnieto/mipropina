import type { Metadata } from "next";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LogOut,
  MapPin,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { requirePlatformAdmin } from "@/app/lib/platform-admin";
import {
  getPlatformDashboardData,
  type PlatformAccountStatus,
} from "@/app/lib/server/modules/platform-dashboard/platform-dashboard.service";

export const metadata: Metadata = {
  title: "Panel de control",
  robots: {
    index: false,
    follow: false,
  },
};

const STATUS_LABELS: Record<PlatformAccountStatus, string> = {
  trial_active: "Prueba activa",
  trial_expired: "Prueba finalizada",
  subscription_active: "Suscripción activa",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  incomplete: "Suscripción pendiente",
  not_started: "Sin plan",
};

const STATUS_STYLES: Record<PlatformAccountStatus, string> = {
  trial_active: "bg-blue-50 text-blue-700 ring-blue-600/20",
  trial_expired: "bg-amber-50 text-amber-700 ring-amber-600/20",
  subscription_active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  past_due: "bg-orange-50 text-orange-700 ring-orange-600/20",
  canceled: "bg-rose-50 text-rose-700 ring-rose-600/20",
  incomplete: "bg-violet-50 text-violet-700 ring-violet-600/20",
  not_started: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function PlatformDashboardPage() {
  const admin = await requirePlatformAdmin();
  const dashboard = await getPlatformDashboardData();
  const adminName = admin.firstName || admin.emailAddresses[0]?.emailAddress || "Administrador";

  const primaryMetrics = [
    {
      label: "Usuarios registrados",
      value: dashboard.metrics.registeredUsers,
      icon: Users,
      tone: "bg-slate-900 text-white",
      iconTone: "bg-white/10 text-white",
    },
    {
      label: "Pruebas activas",
      value: dashboard.metrics.trialActive,
      icon: Clock3,
      tone: "bg-white text-slate-950",
      iconTone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Suscripciones activas",
      value: dashboard.metrics.subscriptionActive,
      icon: CircleDollarSign,
      tone: "bg-white text-slate-950",
      iconTone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pruebas finalizadas",
      value: dashboard.metrics.trialExpired,
      icon: CalendarClock,
      tone: "bg-white text-slate-950",
      iconTone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f3f5f9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Satix</p>
              <p className="font-semibold">Panel de control</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{adminName}</p>
              <p className="text-xs text-slate-500">Platform admin</p>
            </div>
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Vista general</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Estado de la plataforma</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Usuarios, planes y locales registrados en Satix. Los estados vencidos se calculan usando
            la fecha real de finalización de cada prueba.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${metric.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm ${metric.tone.includes("slate-900") ? "text-slate-300" : "text-slate-500"}`}>
                      {metric.label}
                    </p>
                    <p className="mt-3 text-4xl font-bold tracking-tight">{metric.value}</p>
                  </div>
                  <div className={`flex size-11 items-center justify-center rounded-xl ${metric.iconTone}`}>
                    <Icon className="size-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SmallMetric
            icon={Store}
            label="Locales totales"
            value={dashboard.metrics.totalRestaurants}
          />
          <SmallMetric
            icon={Building2}
            label="Marcas"
            value={dashboard.metrics.totalBrands}
          />
          <SmallMetric
            icon={AlertTriangle}
            label="Pagos pendientes"
            value={dashboard.metrics.pastDue}
          />
          <SmallMetric
            icon={CheckCircle2}
            label="Sin plan iniciado"
            value={dashboard.metrics.notStarted}
          />
          <SmallMetric
            icon={Clock3}
            label="Suscripciones pendientes"
            value={dashboard.metrics.incomplete}
          />
          <SmallMetric
            icon={AlertTriangle}
            label="Suscripciones canceladas"
            value={dashboard.metrics.canceled}
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold">Cuentas registradas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Estado comercial y cantidad de locales por usuario.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Actualizado {formatDate(dashboard.generatedAt)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Cuenta</th>
                  <th className="px-6 py-4">Restaurante</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fin de prueba</th>
                  <th className="px-6 py-4">Locales</th>
                  <th className="px-6 py-4">Último acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.accounts.map((account) => (
                  <tr key={account.userId} className="align-top transition hover:bg-slate-50/70">
                    <td className="px-6 py-5">
                      <p className="max-w-[260px] truncate text-sm font-semibold text-slate-900">
                        {account.email ?? "Sin email"}
                      </p>
                      <p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                        {account.clerkUserId}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-800">
                        {account.brandName ?? "Onboarding pendiente"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {account.brandSlug ? `/${account.brandSlug}` : "Sin marca creada"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[account.status]}`}
                      >
                        {STATUS_LABELS[account.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                      {formatDate(account.trialEndsAt)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <MapPin className="size-4 text-slate-400" />
                        {account.restaurants.length}
                      </div>
                      {account.restaurants.length > 0 ? (
                        <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
                          {account.restaurants.map((restaurant) => restaurant.name).join(", ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                      {formatDate(account.lastLogin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dashboard.accounts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Todavía no hay usuarios registrados</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SmallMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store;
  label: string;
  value: number;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </article>
  );
}
