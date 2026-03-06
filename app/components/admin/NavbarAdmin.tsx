import Link from "next/link";
import { BarChart3, ExternalLink, LineChart, Settings2, Star, Store, UserRoundCheck, UtensilsCrossed } from "lucide-react";

type NavbarAdminProps = {
  brandSlug: string;
  brandName?: string;
};

function NavbarAdmin({ brandSlug, brandName }: NavbarAdminProps) {
  const displayName = brandName?.trim() || "Tu restaurante";

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9e0ef] bg-[#f6f9ff]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f3d91] text-white shadow-[0_8px_20px_rgba(15,61,145,0.28)]">
              <UtensilsCrossed className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <p className="font-display text-xl font-bold text-[#0f1b35]">Tablero MiPropina</p>
              <p className="text-sm text-[#536282]">{displayName}</p>
            </div>
          </div>

          <Link
            href={`/${brandSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-[#d6dfef] bg-white px-3 py-1.5 text-sm font-medium text-[#1c376f] transition hover:bg-[#f7f9ff]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Store
          </Link>
        </div>

        <div className="scrollbar-none -mx-1 overflow-x-auto px-1">
          <nav className="flex min-w-max items-center gap-2 text-sm">
            <a
              href="#resumen"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Resumen
            </a>
            <a
              href="#analytics"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <LineChart className="h-3.5 w-3.5" />
              Analytics
            </a>
            <a
              href="#datos-personales"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Datos
            </a>
            <a
              href="#calificaciones"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Star className="h-3.5 w-3.5" />
              Reseñas
            </a>
            <a
              href="#foto"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Store className="h-3.5 w-3.5" />
              Identidad
            </a>
            <a
              href="#mozos"
              className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <UserRoundCheck className="h-3.5 w-3.5" />
              Mozos
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export { NavbarAdmin };
