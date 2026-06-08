import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function PlatformDashboardAccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f9] px-5">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldAlert className="size-6" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Satix</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Tu usuario local no es administrador
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Este entorno usa la instancia Development de Clerk. Agregá el rol en la metadata privada
          del mismo usuario dentro de esa instancia.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-left text-sm text-slate-100">
          {`{\n  "role": "platform_admin"\n}`}
        </pre>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
