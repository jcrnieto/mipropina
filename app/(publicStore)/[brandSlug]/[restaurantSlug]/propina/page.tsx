import { WaitersCards } from "@/app/components/publicStore/WaitersCards";
import { PublicStoreFooter } from "@/app/components/publicStore/PublicStoreFooter";
import { PublicStoreHeader } from "@/app/components/publicStore/PublicStoreHeader";

type PublicStoreTipPageProps = {
  params: Promise<{ brandSlug: string; restaurantSlug: string }>;
  searchParams: Promise<{ waiter?: string | string[] }>;
};

export default async function PublicStoreTipPage({ params, searchParams }: PublicStoreTipPageProps) {
  const [{ brandSlug, restaurantSlug }, search] = await Promise.all([params, searchParams]);
  const waiterId =
    typeof search.waiter === "string" ? search.waiter : Array.isArray(search.waiter) ? search.waiter[0] : null;
  const backUrl = waiterId
    ? `/${brandSlug}/${restaurantSlug}?waiter=${encodeURIComponent(waiterId)}`
    : `/${brandSlug}/${restaurantSlug}`;

  return (
    <main className="min-h-screen gradient-hero px-4 py-5 md:py-8">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-3 md:max-w-[520px]">
        <PublicStoreHeader backUrl={backUrl} />
        <WaitersCards storePathPrefix={`${brandSlug}/${restaurantSlug}`} brandSlug={brandSlug} mode="tip" />
        <PublicStoreFooter />
      </div>
    </main>
  );
}
