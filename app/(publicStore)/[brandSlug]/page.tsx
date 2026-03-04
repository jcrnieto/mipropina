import Link from "next/link";
import Image from "next/image";
import { BookOpenText, Star, Wallet } from "lucide-react";
import { PublicStoreFooter } from "@/app/components/publicStore/PublicStoreFooter";
import { getPublicStoreInfoByBrandSlug } from "@/app/lib/server/modules/personal-data/personal-data.service";

type PublicStorePageProps = {
  params: Promise<{ brandSlug: string }>;
};

function formatBrandName(brandSlug: string): string {
  return brandSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PublicStorePage({ params }: PublicStorePageProps) {
  const { brandSlug } = await params;
  const storeInfo = await getPublicStoreInfoByBrandSlug(brandSlug);
  const brandName = storeInfo?.brand_name?.trim() || formatBrandName(brandSlug);
  const logo = storeInfo?.image ?? null;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1d3658_0%,#0f1c33_40%,#081426_100%)] px-4 py-6 md:py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#2fa8dc]/25 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-4 rounded-[34px] border border-white/25 bg-[#0a1628]/55 p-5 shadow-[0_20px_65px_rgba(5,11,24,0.65)] backdrop-blur-md md:max-w-md">
        <div className="mt-5 flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/10">
            {logo ? (
              <Image
                src={logo}
                alt={`Logo de ${brandName}`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-3xl font-semibold text-white">{brandName.charAt(0).toUpperCase() || "R"}</span>
            )}
          </div>
          <p className="mt-4 text-center text-2xl font-semibold tracking-wide text-white">{brandName}</p>
        </div>

        <div className="mt-2 space-y-3">
          <Link
            href={`/${brandSlug}/propina`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#f0dfcb] bg-[#f0dfcb] px-4 text-base font-semibold text-[#17243b] transition hover:brightness-95"
          >
            <Wallet className="h-4 w-4" />
            Propina
          </Link>

          <Link
            href={`/${brandSlug}/resena`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#f0dfcb] bg-[#f0dfcb] px-4 text-base font-semibold text-[#17243b] transition hover:brightness-95"
          >
            <Star className="h-4 w-4" />
            Reseña
          </Link>

          <div className="my-4 flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-white/30" />
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">secciones</span>
            <div className="h-px flex-1 bg-white/30" />
          </div>

          <Link
            href={`/${brandSlug}/menu`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/45 bg-transparent px-4 text-base font-semibold text-white transition hover:bg-white/10"
          >
            <BookOpenText className="h-4 w-4" />
            Menu
          </Link>
        </div>

        <PublicStoreFooter />
      </div>
    </main>
  );
}

