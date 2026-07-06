"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Clock3,
  CreditCard,
  MapPin,
  Music2,
  Phone,
  Send,
  Sparkles,
  Star,
  Tags,
  UserRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import WaiterModal from "./WaiterModal";

type Waiter = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  photo: string | null;
};

type StoreInfo = {
  brandName: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  generalTipLink: string | null;
};

type WaitersCardsProps = {
  storePathPrefix: string;
  brandSlug: string;
  mode?: "all" | "tip" | "review";
};

function formatBrandName(brandSlug: string): string {
  return brandSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const EMPTY_STORE: StoreInfo = {
  brandName: null,
  phone: null,
  address: null,
  logo: null,
  generalTipLink: null,
};

const RATING_LABELS: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

type RatingVisual = {
  badgeClass: string;
  cardClass: string;
  iconWrapClass: string;
  starClass: string;
  starHoverClass: string;
};

function getRatingVisual(score: number): RatingVisual {
  switch (score) {
    case 1:
      return {
        badgeClass: "bg-[#fee2e2] text-[#b91c1c]",
        cardClass: "border-[#f6b8b8] bg-[#fff7f7]",
        iconWrapClass: "bg-[#fee2e2] text-[#dc2626]",
        starClass: "fill-[#ef4444] text-[#ef4444]",
        starHoverClass: "hover:bg-[#fee2e2]",
      };
    case 2:
      return {
        badgeClass: "bg-[#ffedd5] text-[#c2410c]",
        cardClass: "border-[#fed7aa] bg-[#fff9f1]",
        iconWrapClass: "bg-[#ffedd5] text-[#ea580c]",
        starClass: "fill-[#f97316] text-[#f97316]",
        starHoverClass: "hover:bg-[#ffedd5]",
      };
    case 3:
      return {
        badgeClass: "bg-[#fef9c3] text-[#a16207]",
        cardClass: "border-[#f8d66d] bg-[#fffdf2]",
        iconWrapClass: "bg-[#fef3c7] text-[#d97706]",
        starClass: "fill-[#eab308] text-[#eab308]",
        starHoverClass: "hover:bg-[#fef9c3]",
      };
    case 4:
      return {
        badgeClass: "bg-[#ecfccb] text-[#3f6212]",
        cardClass: "border-[#b9e866] bg-[#fbfff0]",
        iconWrapClass: "bg-[#ecfccb] text-[#65a30d]",
        starClass: "fill-[#84cc16] text-[#84cc16]",
        starHoverClass: "hover:bg-[#ecfccb]",
      };
    case 5:
      return {
        badgeClass: "bg-[#dcfce7] text-[#166534]",
        cardClass: "border-[#79e2aa] bg-[#f4fff8]",
        iconWrapClass: "bg-[#dcfce7] text-[#16a34a]",
        starClass: "fill-[#22c55e] text-[#22c55e]",
        starHoverClass: "hover:bg-[#dcfce7]",
      };
    default:
      return {
        badgeClass: "bg-[#eef2ff] text-[#5e6f8f]",
        cardClass: "border-[#dce4f2] bg-white",
        iconWrapClass: "bg-[#eef3ff] text-[#2f66dc]",
        starClass: "fill-[#2f66dc] text-[#2f66dc]",
        starHoverClass: "hover:bg-[#eef3ff]",
      };
  }
}

function normalizeFeatureName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getFeatureIcon(feature: string): LucideIcon {
  const normalized = normalizeFeatureName(feature);

  if (/(limpieza|limpio|higiene|bano|banos|sanitario)/.test(normalized)) return Sparkles;
  if (/(musica|ambiente|ruido|sonido)/.test(normalized)) return Music2;
  if (/(precio|calidad|caro|barato|valor|relacion)/.test(normalized)) return Tags;
  if (/(demora|tiempo|espera|pedido|rapidez|rapido)/.test(normalized)) return Clock3;
  if (/(atencion|mozo|mesero|servicio|trato|personal)/.test(normalized)) return UserRound;
  if (/(comida|plato|sabor|menu|carta|bebida|cocina)/.test(normalized)) return Utensils;

  return Star;
}

export function WaitersCards({ storePathPrefix, brandSlug, mode = "all" }: WaitersCardsProps) {
  const searchParams = useSearchParams();
  const waiterIdFromQuery = searchParams.get("waiter");
  const [store, setStore] = useState<StoreInfo>(EMPTY_STORE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFeatures, setRatingFeatures] = useState<string[]>([]);
  const [stars, setStars] = useState<number[]>([]);
  const [comment, setComment] = useState("");
  const [waiterServiceStars, setWaiterServiceStars] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [modalWaiter, setModalWaiter] = useState<Waiter | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWaiters = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/public/${storePathPrefix}/waiters`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as {
          ok: boolean;
          store?: StoreInfo;
          ratingFeatures?: string[];
          waiters?: Waiter[];
          error?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudieron cargar los mozos");
        }

        if (isMounted) {
          const loadedWaiters = json.waiters ?? [];
          const loadedFeatures = (json.ratingFeatures ?? []).slice(0, 5);
          const matchedWaiter = waiterIdFromQuery
            ? loadedWaiters.find((waiter) => waiter.id === waiterIdFromQuery) ?? null
            : null;

          setStore(json.store ?? EMPTY_STORE);
          setRatingFeatures(loadedFeatures);
          setStars(loadedFeatures.map(() => 0));
          setSelectedWaiter(matchedWaiter);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los mozos");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadWaiters();
    return () => {
      isMounted = false;
    };
  }, [storePathPrefix, brandSlug, waiterIdFromQuery]);

  const brandName = useMemo(
    () => store.brandName?.trim() || formatBrandName(brandSlug),
    [store.brandName, brandSlug],
  );
  const hasWaiterContext = Boolean(selectedWaiter);
  const hasRatingConfig = ratingFeatures.length > 0;
  const showRatingSection = mode !== "tip" && (hasRatingConfig || hasWaiterContext);
  const showTipSection = mode !== "review";
  const hasWaiterQr = Boolean(waiterIdFromQuery);
  const isWaiterLocked = Boolean(waiterIdFromQuery && selectedWaiter);
  const isUnknownWaiterQr = Boolean(waiterIdFromQuery && !selectedWaiter && !isLoading && !error);
  const hasValidFeatureScores =
    ratingFeatures.length === 0 || (stars.length === ratingFeatures.length && stars.every((value) => value >= 1 && value <= 5));
  const hasValidWaiterScore = !hasWaiterContext || (waiterServiceStars >= 1 && waiterServiceStars <= 5);
  const canSubmitRating = (hasRatingConfig || hasWaiterContext) && hasValidFeatureScores && hasValidWaiterScore;
  const hasGeneralTipLink = Boolean(store.generalTipLink);

  const submitRating = async () => {
    if (!canSubmitRating) {
      setRatingError("Completa todas las puntuaciones para enviar.");
      return;
    }

    setIsSubmittingRating(true);
    setRatingError(null);
    setRatingSuccess(null);

    try {
      const response = await fetch(`/api/public/${storePathPrefix}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stars,
          comment,
          waiterId: selectedWaiter?.id ?? null,
          waiterServiceStars: hasWaiterContext ? waiterServiceStars : null,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo enviar la calificacion.");
      }

      setStars(ratingFeatures.map(() => 0));
      setComment("");
      setWaiterServiceStars(0);
      setRatingSuccess("Gracias por tu calificacion.");
    } catch (submitError) {
      setRatingError(submitError instanceof Error ? submitError.message : "No se pudo enviar la calificacion.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const openGeneralTipLink = () => {
    if (!store.generalTipLink) return;
    window.open(store.generalTipLink, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mx-auto w-full max-w-[430px] rounded-[28px] border border-white/80 bg-white/72 p-4 shadow-[0_22px_60px_rgba(32,54,88,0.16)] backdrop-blur md:max-w-[520px] md:p-5">
      <div className="flex items-center gap-4 rounded-3xl border border-[#e3e9f4] bg-white/88 p-4 shadow-[0_14px_35px_rgba(43,68,110,0.08)]">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#dfe6f2] bg-[#f6f8fc]">
          {store.logo ? (
            <Image
              src={store.logo}
              alt={`Logo de ${brandName}`}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-bold text-[#2b3c64]">{brandName.charAt(0).toUpperCase() || "R"}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold text-[#0b1b43]">{brandName}</p>
          <div className="mt-3 space-y-2 text-sm text-[#64708a]">
            <p className="flex min-w-0 items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[#2563eb]" />
              <span className="truncate">{store.phone || "Telefono no disponible"}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#2563eb]" />
              <span className="truncate">{store.address || "Direccion no disponible"}</span>
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-3xl border border-[#dde6f4] bg-white/80 px-4 py-5 text-sm font-medium text-[#64708a]">
          Cargando experiencia...
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-3xl border border-[#fecaca] bg-[#fff7f7] px-4 py-5 text-sm font-medium text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && showRatingSection ? (
        <div className="mt-7">
          {hasWaiterContext ? (
            <div className="mb-4 rounded-2xl border border-[#dbe6f7] bg-[#f7faff] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#697896]">QR de mozo</p>
              <p className="mt-1 text-sm font-semibold text-[#14264d]">
                {selectedWaiter?.firstName} {selectedWaiter?.lastName}
              </p>
            </div>
          ) : null}

          <div>
            <h2 className="text-[1.35rem] font-bold leading-tight text-[#071b4a]">Califica tu experiencia</h2>
            <p className="mt-2 text-sm leading-6 text-[#68748c]">
              5 excelente, 4 muy bueno, 3 bueno, 2 regular, 1 malo.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {hasWaiterContext ? (
              <div className={`rounded-2xl border px-3 py-3 sm:px-4 ${getRatingVisual(waiterServiceStars).cardClass}`}>
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${getRatingVisual(waiterServiceStars).iconWrapClass}`}
                  >
                    <UserRound className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold leading-5 text-[#14203d]">Atencion del mozo</p>
                  <span
                    className={`col-span-2 w-fit rounded-full px-3 py-1 text-xs font-bold sm:col-span-1 ${getRatingVisual(waiterServiceStars).badgeClass}`}
                  >
                    {waiterServiceStars ? RATING_LABELS[waiterServiceStars] : "Sin calificar"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const visual = getRatingVisual(waiterServiceStars);
                    const active = waiterServiceStars >= value;
                    return (
                      <button
                        key={`waiter-service-${value}`}
                        type="button"
                        onClick={() => setWaiterServiceStars(value)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${visual.starHoverClass}`}
                        aria-label={`Puntuar la atencion del mozo con ${value} estrellas`}
                      >
                        <Star className={`h-6 w-6 ${active ? visual.starClass : "text-[#b8c4d8]"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {ratingFeatures.map((feature, featureIndex) => {
              const selectedStars = stars[featureIndex] ?? 0;
              const visual = getRatingVisual(selectedStars);
              const FeatureIcon = getFeatureIcon(feature);

              return (
                <div key={`${feature}-${featureIndex}`} className={`rounded-2xl border px-3 py-3 sm:px-4 ${visual.cardClass}`}>
                  <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${visual.iconWrapClass}`}>
                      <FeatureIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold leading-5 text-[#14203d]">{feature}</p>
                    <span className={`col-span-2 w-fit rounded-full px-3 py-1 text-xs font-bold sm:col-span-1 ${visual.badgeClass}`}>
                      {selectedStars ? RATING_LABELS[selectedStars] : "Sin calificar"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = selectedStars >= value;
                      return (
                        <button
                          key={`${featureIndex}-${value}`}
                          type="button"
                          onClick={() =>
                            setStars((previous) =>
                              previous.map((item, itemIndex) => (itemIndex === featureIndex ? value : item)),
                            )
                          }
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${visual.starHoverClass}`}
                          aria-label={`Puntuar ${feature} con ${value} estrellas`}
                        >
                          <Star className={`h-6 w-6 ${active ? visual.starClass : "text-[#b8c4d8]"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <label className="text-base font-semibold text-[#14203d]" htmlFor="rating-comment">
              Comentario (opcional)
            </label>
            <div className="mt-2 rounded-2xl border border-[#dfe6f2] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(43,68,110,0.08)] transition focus-within:border-[#5f88ea] focus-within:ring-2 focus-within:ring-[#5f88ea]/20">
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Contanos tu experiencia..."
                className="min-h-24 w-full resize-none bg-transparent text-sm text-[#14203d] outline-none placeholder:text-[#98a3b8]"
              />
              <p className="text-right text-xs font-medium text-[#6f7d99]">{comment.length}/300</p>
            </div>
          </div>

          {ratingError ? <p className="mt-3 text-sm font-medium text-red-700">{ratingError}</p> : null}
          {ratingSuccess ? <p className="mt-3 text-sm font-medium text-[#0f8a61]">{ratingSuccess}</p> : null}

          <button
            type="button"
            onClick={() => {
              void submitRating();
            }}
            disabled={!canSubmitRating || isSubmittingRating}
            className="gradient-primary mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {isSubmittingRating ? "Enviando..." : "Enviar calificacion"}
          </button>
        </div>
      ) : null}

      {!isLoading && !error && showTipSection ? (
        <div className="mt-6">
          <div className="rounded-3xl border border-[#dfe6f2] bg-white/88 p-5 shadow-[0_14px_35px_rgba(43,68,110,0.08)]">
            <p className="text-sm font-semibold text-[#6f7d99]">{hasWaiterQr ? "Mozo seleccionado" : "Propina"}</p>
            <p className="mt-1 text-xl font-bold text-[#071b4a]">
              {selectedWaiter
                ? `${selectedWaiter.firstName} ${selectedWaiter.lastName}`
                : hasWaiterQr
                  ? "Mozo no encontrado"
                  : "Propina general"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#68748c]">
              {isWaiterLocked
                ? "Este QR ya esta asociado a este mozo. Continua con el boton de pago."
                : isUnknownWaiterQr
                  ? "No encontramos el mozo asociado a este QR."
                  : hasGeneralTipLink
                    ? "Deja una propina general para el equipo del local."
                    : "Este local todavia no cargo un link de propina general."}
            </p>
          </div>

          <button
            type="button"
            disabled={!selectedWaiter && !hasGeneralTipLink}
            onClick={() => {
              if (!selectedWaiter) {
                openGeneralTipLink();
                return;
              }
              setModalWaiter(selectedWaiter);
            }}
            className="gradient-secondary mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold text-secondary-foreground shadow-xl shadow-secondary/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard className="h-5 w-5" />
            {selectedWaiter ? "Transferi por Mercado Pago" : "Propina general por Mercado Pago"}
          </button>
        </div>
      ) : null}

      <WaiterModal waiter={modalWaiter} onClose={() => setModalWaiter(null)} />
    </section>
  );
}
