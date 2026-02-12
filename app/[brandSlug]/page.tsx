import { WaitersCards } from "../components/publicStore/WaitersCards";

type PublicStorePageProps = {
  params: Promise<{ brandSlug: string }>;
};

export default async function PublicStorePage({ params }: PublicStorePageProps) {
  const { brandSlug } = await params;

  return (
    <main className="min-h-screen gradient-hero px-4 py-6 md:flex md:items-center md:justify-center md:py-10">
      <WaitersCards brandSlug={brandSlug} />
    </main>
  );
}
