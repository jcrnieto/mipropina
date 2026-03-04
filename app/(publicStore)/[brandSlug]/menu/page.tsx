import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, UtensilsCrossed } from "lucide-react";
import { PublicStoreFooter } from "@/app/components/publicStore/PublicStoreFooter";
import { getActiveMenuByBrandSlug } from "@/app/lib/server/modules/menu/menu.service";

type PublicStoreMenuPageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function PublicStoreMenuPage({ params }: PublicStoreMenuPageProps) {
  const { brandSlug } = await params;
  const menu = await getActiveMenuByBrandSlug(brandSlug);
  const isPdf = menu?.mimeType === "application/pdf";
  const isImage = menu?.mimeType === "image/jpeg" || menu?.mimeType === "image/png";

  return (
    <main className="min-h-screen gradient-hero">
      <div className="sticky top-0 z-10 border-b border-[#d8e0ef] bg-[#f4f6fb]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link
            href={`/${brandSlug}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[#d8e0ef] bg-white px-3 py-2 text-sm font-medium text-[#244e9b] transition hover:bg-[#f7f9ff]"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>
          <a
            href={menu?.fileUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
              menu?.fileUrl
                ? "border-[#d8e0ef] bg-white text-[#244e9b] hover:bg-[#f7f9ff]"
                : "cursor-not-allowed border-[#e4e8f2] bg-[#f0f2f7] text-[#9aa5bb]"
            }`}
          >
            Abrir original
          </a>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-4 md:py-6">
        {!menu ? (
          <section className="rounded-3xl border border-white/70 bg-[#f4f6fb]/85 p-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.14)] backdrop-blur">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cdd8ec] bg-white">
              <UtensilsCrossed className="h-6 w-6 text-[#2f66dc]" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-[#1f2937]">Carta del restaurante</h1>
            <p className="mt-2 text-sm text-[#5b677a]">Este restaurante todavia no cargo su carta.</p>
          </section>
        ) : null}

        {menu && isPdf ? (
          <div className="h-[78vh] overflow-hidden rounded-2xl border border-[#d8e0ef] bg-white shadow-[0_12px_32px_rgba(20,30,60,0.12)]">
            <iframe title="Carta del restaurante" src={menu.fileUrl} className="h-full w-full" />
          </div>
        ) : null}

        {menu && isImage ? (
          <div className="overflow-hidden rounded-2xl border border-[#d8e0ef] bg-white p-2 shadow-[0_12px_32px_rgba(20,30,60,0.12)]">
            <Image
              src={menu.fileUrl}
              alt="Carta del restaurante"
              width={1200}
              height={1800}
              unoptimized
              className="h-auto w-full rounded-xl object-contain"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <PublicStoreFooter />
        </div>
      </div>
    </main>
  );
}
