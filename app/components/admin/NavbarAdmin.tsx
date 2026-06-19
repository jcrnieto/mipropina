import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, ExternalLink, LineChart, Settings2, Star, Store, UserRoundCheck, UtensilsCrossed, Building2 } from "lucide-react";

type NavbarAdminProps = {
  brandSlug: string;
  brandName?: string;
  storePath?: string;
};

function NavbarAdmin({ brandSlug, brandName, storePath }: NavbarAdminProps) {
  const displayName = brandName?.trim() || "Tu restaurante";
  const storeHref = storePath ? storePath : `/${brandSlug}`;

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-hidden border-b border-[#d9e0ef] bg-[#f6f9ff]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0f3d91] text-white shadow-[0_8px_20px_rgba(15,61,145,0.28)]">
              <UtensilsCrossed className="h-5 w-5" />
            </div>

            <div className="min-w-0 leading-tight">
              <p className="font-display truncate text-lg font-bold text-[#0f1b35] sm:text-xl">Tablero Satix</p>
              <p className="truncate text-sm text-[#536282]">{displayName}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={storeHref}
              target="_blank"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#d6dfef] bg-white px-3 py-1.5 text-sm font-medium text-[#1c376f] transition hover:bg-[#f7f9ff]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Store
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            />
          </div>
        </div>

        <div>
          <nav className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center">
            <Link
              href={`/admin/${brandSlug}`}
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Locales</span>
            </Link>
            <a
              href="#resumen"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Resumen</span>
            </a>
            <a
              href="#analytics"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <LineChart className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Analytics</span>
            </a>
            <a
              href="#datos-personales"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Datos</span>
            </a>
            <a
              href="#calificaciones"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Star className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Reseñas</span>
            </a>
            <a
              href="#menu"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Carta</span>
            </a>
            <a
              href="#foto"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Identidad</span>
            </a>
            <a
              href="#mozos"
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full border border-[#d6dfef] bg-white px-3 py-1.5 text-[#2a477f] transition hover:bg-[#f7f9ff]"
            >
              <UserRoundCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Mozos</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export { NavbarAdmin };
