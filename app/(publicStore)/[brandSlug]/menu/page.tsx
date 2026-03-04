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
    <main className="min-h-screen gradient-hero px-4 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 md:gap-5">
        <Link
          href={`/${brandSlug}`}
          className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#d8e0ef] bg-white/70 px-3 py-2 text-sm font-medium text-[#244e9b] transition hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Link>

        <section className="rounded-3xl border border-white/70 bg-[#f4f6fb]/85 p-6 text-center shadow-[0_20px_50px_rgba(17,24,39,0.14)] backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cdd8ec] bg-white">
            <UtensilsCrossed className="h-6 w-6 text-[#2f66dc]" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#1f2937]">Carta del restaurante</h1>

          {!menu ? (
            <p className="mt-2 text-sm text-[#5b677a]">Este restaurante todavia no cargo su carta.</p>
          ) : null}

          {menu ? (
            <div className="mt-4 space-y-3">
              <a
                href={menu.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8e0ef] bg-white px-4 text-sm font-medium text-[#244e9b] transition hover:bg-[#f6f8ff]"
              >
                Abrir carta
              </a>

              {isPdf ? (
                <div className="h-[70vh] overflow-hidden rounded-xl border border-[#d8e0ef] bg-white">
                  <iframe
                    title="Carta del restaurante"
                    src={menu.fileUrl}
                    className="h-full w-full"
                  />
                </div>
              ) : null}

              {isImage ? (
                <Image
                  src={menu.fileUrl}
                  alt="Carta del restaurante"
                  width={1200}
                  height={1800}
                  unoptimized
                  className="w-full rounded-xl border border-[#d8e0ef] bg-white object-contain"
                />
              ) : null}
            </div>
          ) : null}
        </section>

        <PublicStoreFooter />
      </div>
    </main>
  );
}
