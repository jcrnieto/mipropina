import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookOpenText, Facebook, Instagram, Music2, Star, Wallet, type LucideIcon } from "lucide-react";
import { PublicStoreFooter } from "@/app/components/publicStore/PublicStoreFooter";
import { getPublicStoreInfoByBrandAndRestaurantSlug } from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getActiveMenuByBrandAndRestaurantSlug } from "@/app/lib/server/modules/menu/menu.service";

type PublicStorePageProps = {
  params: Promise<{ brandSlug: string; restaurantSlug: string }>;
  searchParams: Promise<{ waiter?: string | string[] }>;
};

function formatBrandName(brandSlug: string): string {
  return brandSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPublicSocialUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

type SocialLinkItem = {
  key: "instagram" | "facebook" | "tiktok";
  label: string;
  href: string;
  icon: LucideIcon;
};

export default async function PublicStoreRestaurantPage({ params, searchParams }: PublicStorePageProps) {
  const [{ brandSlug, restaurantSlug }, search] = await Promise.all([params, searchParams]);
  const waiterId =
    typeof search.waiter === "string" ? search.waiter : Array.isArray(search.waiter) ? search.waiter[0] : null;
  const waiterQuery = waiterId ? `?waiter=${encodeURIComponent(waiterId)}` : "";
  const [storeInfo, menu] = await Promise.all([
    getPublicStoreInfoByBrandAndRestaurantSlug(brandSlug, restaurantSlug),
    getActiveMenuByBrandAndRestaurantSlug(brandSlug, restaurantSlug),
  ]);

  if (!storeInfo) {
    console.error("[public-store] Restaurant not found", {
      brandSlug,
      restaurantSlug,
    });
    redirect("/");
  }

  const brandName = storeInfo?.brandName?.trim() || formatBrandName(brandSlug);
  const logo = storeInfo?.image ?? null;
  const socialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      href: toPublicSocialUrl(storeInfo?.instagram),
      icon: Instagram,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: toPublicSocialUrl(storeInfo?.facebook),
      icon: Facebook,
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: toPublicSocialUrl(storeInfo?.tiktok),
      icon: Music2,
    },
  ].filter((item): item is SocialLinkItem => Boolean(item.href));

  return (
    <main className="min-h-screen gradient-hero px-4 py-6 md:py-10">
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[430px] flex-col gap-4 rounded-[30px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(32,54,88,0.16)] backdrop-blur md:min-h-[calc(100vh-5rem)] md:max-w-[520px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#64708a]">satix.app</span>
          <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-semibold text-[#315eea]">QR del local</span>
        </div>

        <div className="mt-3 flex flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-[#dfe6f2] bg-white shadow-[0_14px_35px_rgba(43,68,110,0.1)]">
            {logo ? (
              <Image
                src={logo}
                alt={`Logo de ${brandName}`}
                width={112}
                height={112}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-4xl font-bold text-[#2b3c64]">{brandName.charAt(0).toUpperCase() || "R"}</span>
            )}
          </div>
          <p className="mt-5 text-center text-3xl font-bold text-[#071b4a]">{brandName}</p>
          <p className="mt-2 text-center text-sm font-medium text-[#68748c]">Elegí cómo querés continuar</p>
        </div>

        <div className="mt-2 space-y-3">
          <Link
            href={`/${brandSlug}/${restaurantSlug}/propina${waiterQuery}`}
            className="gradient-primary flex h-14 items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition hover:brightness-105"
          >
            <Wallet className="h-5 w-5" />
            Propina
          </Link>

          <Link
            href={`/${brandSlug}/${restaurantSlug}/resena${waiterQuery}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#dfe6f2] bg-white px-4 text-base font-bold text-[#14203d] shadow-[0_12px_28px_rgba(43,68,110,0.08)] transition hover:border-[#b8c7f8] hover:text-[#315eea]"
          >
            <Star className="h-5 w-5" />
            Reseña
          </Link>

          <div className="my-4 flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-[#d7deeb]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68748c]">secciones</span>
            <div className="h-px flex-1 bg-[#d7deeb]" />
          </div>

          {menu?.fileUrl ? (
            <a
              href={menu.fileUrl}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#dfe6f2] bg-white/70 px-4 text-base font-bold text-[#14203d] transition hover:bg-white"
            >
              <BookOpenText className="h-5 w-5 text-[#315eea]" />
              Menu
            </a>
          ) : (
            <Link
              href={`/${brandSlug}/${restaurantSlug}/menu`}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#dfe6f2] bg-white/70 px-4 text-base font-bold text-[#14203d] transition hover:bg-white"
            >
              <BookOpenText className="h-5 w-5 text-[#315eea]" />
              Menu
            </Link>
          )}

          {socialLinks.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-[#dfe6f2] bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#68748c]">Redes sociales</p>
              <div className="grid gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe6f2] bg-white px-3 text-sm font-semibold text-[#14203d] transition hover:border-[#b8c7f8] hover:text-[#315eea]"
                    >
                      <Icon className="h-4 w-4" />
                      {social.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-auto">
          <PublicStoreFooter />
        </div>
      </div>
    </main>
  );
}
