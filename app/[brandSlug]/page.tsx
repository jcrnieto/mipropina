import { WaitersCards } from "../components/publicStore/WaitersCards";
import { PublicStoreFooter } from "../components/publicStore/PublicStoreFooter";

type PublicStorePageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function PublicStorePage({ params }: PublicStorePageProps) {
  const { brandSlug } = await params;

  return (
    <main className="min-h-screen gradient-hero px-4 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-5">
        <WaitersCards brandSlug={brandSlug} />
        <PublicStoreFooter />
      </div>
    </main>
  );
}
