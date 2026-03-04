import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WaitersCards } from "@/app/components/publicStore/WaitersCards";
import { PublicStoreFooter } from "@/app/components/publicStore/PublicStoreFooter";

type PublicStoreTipPageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function PublicStoreTipPage({ params }: PublicStoreTipPageProps) {
  const { brandSlug } = await params;

  return (
    <main className="min-h-screen gradient-hero px-4 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-5">
        <Link
          href={`/${brandSlug}`}
          className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#d8e0ef] bg-white/70 px-3 py-2 text-sm font-medium text-[#244e9b] transition hover:bg-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Link>
        <WaitersCards brandSlug={brandSlug} mode="tip" />
        <PublicStoreFooter />
      </div>
    </main>
  );
}
