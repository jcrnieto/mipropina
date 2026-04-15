"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, CreditCard, MapPin, Phone, Search, Send, Star } from "lucide-react";
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
};

type WaitersCardsProps = {
  brandSlug: string;
  mode?: "all" | "tip" | "review";
};

function getInitials(waiter: Waiter): string {
  const a = waiter.firstName.trim().charAt(0).toUpperCase();
  const b = waiter.lastName.trim().charAt(0).toUpperCase();
  return `${a}${b}`.trim() || "M";
}

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
  face: string;
  starClass: string;
  starHoverClass: string;
};

function getRatingVisual(score: number): RatingVisual {
  switch (score) {
    case 1:
      return {
        badgeClass: "bg-[#fee2e2] text-[#b91c1c]",
        cardClass: "border-[#fecaca] bg-[#fff5f5]",
        face: "Malo",
        starClass: "fill-[#ef4444] text-[#ef4444]",
        starHoverClass: "hover:bg-[#fee2e2]",
      };
    case 2:
      return {
        badgeClass: "bg-[#ffedd5] text-[#c2410c]",
        cardClass: "border-[#fed7aa] bg-[#fff7ed]",
        face: "Regular",
        starClass: "fill-[#f97316] text-[#f97316]",
        starHoverClass: "hover:bg-[#ffedd5]",
      };
    case 3:
      return {
        badgeClass: "bg-[#fef9c3] text-[#a16207]",
        cardClass: "border-[#fde68a] bg-[#fffbeb]",
        face: "Bueno",
        starClass: "fill-[#eab308] text-[#eab308]",
        starHoverClass: "hover:bg-[#fef9c3]",
      };
    case 4:
      return {
        badgeClass: "bg-[#ecfccb] text-[#3f6212]",
        cardClass: "border-[#bef264] bg-[#f7fee7]",
        face: "Muy bueno",
        starClass: "fill-[#84cc16] text-[#84cc16]",
        starHoverClass: "hover:bg-[#ecfccb]",
      };
    case 5:
      return {
        badgeClass: "bg-[#dcfce7] text-[#166534]",
        cardClass: "border-[#86efac] bg-[#f0fdf4]",
        face: "Excelente",
        starClass: "fill-[#22c55e] text-[#22c55e]",
        starHoverClass: "hover:bg-[#dcfce7]",
      };
    default:
      return {
        badgeClass: "bg-[#eef2ff] text-[#5e6f8f]",
        cardClass: "border-[#dfe4f0] bg-[#f8faff]",
        face: "-",
        starClass: "fill-[#f5b94c] text-[#f5b94c]",
        starHoverClass: "hover:bg-[#eef3ff]",
      };
  }
}

export function WaitersCards({ brandSlug, mode = "all" }: WaitersCardsProps) {
  const searchParams = useSearchParams();
  const waiterIdFromQuery = searchParams.get("waiter");
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [store, setStore] = useState<StoreInfo>(EMPTY_STORE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
        const response = await fetch(`/api/public/${brandSlug}/waiters`, {
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
          setWaiters(loadedWaiters);
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
  }, [brandSlug, waiterIdFromQuery]);

  const brandName = useMemo(
    () => store.brandName?.trim() || formatBrandName(brandSlug),
    [store.brandName, brandSlug],
  );
  const filteredWaiters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return waiters;

    return waiters.filter((waiter) => {
      const fullName = `${waiter.firstName} ${waiter.lastName}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [waiters, search]);

  const hasWaiterContext = Boolean(selectedWaiter);
  const hasRatingConfig = ratingFeatures.length > 0;
  const showRatingSection = mode !== "tip" && (hasRatingConfig || hasWaiterContext);
  const showTipSection = mode !== "review";
  const isWaiterLocked = Boolean(waiterIdFromQuery && selectedWaiter);
  const hasValidFeatureScores =
    ratingFeatures.length === 0 || (stars.length === ratingFeatures.length && stars.every((value) => value >= 1 && value <= 5));
  const hasValidWaiterScore = !hasWaiterContext || (waiterServiceStars >= 1 && waiterServiceStars <= 5);
  const canSubmitRating = (hasRatingConfig || hasWaiterContext) && hasValidFeatureScores && hasValidWaiterScore;

  const submitRating = async () => {
    if (!canSubmitRating) {
      setRatingError("Completa todas las puntuaciones para enviar.");
      return;
    }

    setIsSubmittingRating(true);
    setRatingError(null);
    setRatingSuccess(null);

    try {
      const response = await fetch(`/api/public/${brandSlug}/rating`, {
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

  return (
    <section className="mx-auto w-full max-w-sm rounded-[34px] border border-white/70 bg-[#f4f6fb]/85 p-4 shadow-[0_20px_50px_rgba(17,24,39,0.14)] backdrop-blur md:max-w-5xl md:rounded-3xl md:p-6">
      <div className="flex h-full flex-col rounded-[26px] bg-[#e7ebf3] p-4 md:p-7">
        <div>
          <div className="flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#d7dceb] bg-[#f3f5fa] md:h-24 md:w-24">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={`Logo de ${brandName}`}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold text-[#46567a]">{brandName.charAt(0).toUpperCase() || "R"}</span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#cfd7e6] bg-white/80 p-4">
            <p className="text-sm font-semibold text-[#5e6f8f]">Datos del restaurante</p>
            <p className="mt-1 text-base font-semibold text-[#1f2937]">{brandName}</p>
            <div className="mt-3 grid gap-2 text-sm text-[#475569] sm:grid-cols-2">
              <p className="flex items-center gap-2 rounded-xl border border-[#dfe4f0] bg-[#f8faff] px-3 py-2">
                <Phone className="h-4 w-4 text-[#3b82f6]" />
                {store.phone || "Telefono no disponible"}
              </p>
              <p className="flex items-center gap-2 rounded-xl border border-[#dfe4f0] bg-[#f8faff] px-3 py-2">
                <MapPin className="h-4 w-4 text-[#3b82f6]" />
                {store.address || "Direccion no disponible"}
              </p>
            </div>
          </div>
        </div>

        {showRatingSection ? (
          <div className="mt-4 rounded-2xl border border-[#cfd7e6] bg-white/80 p-4">
            {hasWaiterContext ? (
              <div className="mb-3 rounded-2xl border border-[#d9e2f2] bg-[#f7faff] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#607193]">QR de mozo</p>
                <p className="mt-1 text-sm font-semibold text-[#1b2c4e]">
                  {selectedWaiter?.firstName} {selectedWaiter?.lastName}
                </p>
              </div>
            ) : null}

            <p className="text-sm font-semibold text-[#5e6f8f]">Califica tu experiencia</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              5 excelente, 4 muy bueno, 3 bueno, 2 regular, 1 malo.
            </p>

            <div className="mt-3 space-y-3">
              {hasWaiterContext ? (
                <div className={`rounded-xl border px-3 py-2 ${getRatingVisual(waiterServiceStars).cardClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#1f2937]">Atencion del mozo</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${getRatingVisual(waiterServiceStars).badgeClass}`}
                    >
                      {waiterServiceStars
                        ? `${RATING_LABELS[waiterServiceStars]} ${getRatingVisual(waiterServiceStars).face}`
                        : "-"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const visual = getRatingVisual(waiterServiceStars);
                      const active = waiterServiceStars >= value;
                      return (
                        <button
                          key={`waiter-service-${value}`}
                          type="button"
                          onClick={() => setWaiterServiceStars(value)}
                          className={`rounded-md p-1 transition-colors ${visual.starHoverClass}`}
                          aria-label={`Puntuar la atencion del mozo con ${value} estrellas`}
                        >
                          <Star className={`h-5 w-5 ${active ? visual.starClass : "text-[#b9c5dc]"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {ratingFeatures.map((feature, featureIndex) => {
                const selectedStars = stars[featureIndex] ?? 0;
                const visual = getRatingVisual(selectedStars);

                return (
                  <div key={`${feature}-${featureIndex}`} className={`rounded-xl border px-3 py-2 ${visual.cardClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#1f2937]">{feature}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${visual.badgeClass}`}>
                        {selectedStars ? `${RATING_LABELS[selectedStars]} ${visual.face}` : "-"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1">
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
                            className={`rounded-md p-1 transition-colors ${visual.starHoverClass}`}
                            aria-label={`Puntuar ${feature} con ${value} estrellas`}
                          >
                            <Star className={`h-5 w-5 ${active ? visual.starClass : "text-[#b9c5dc]"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="rating-comment">
                Comentario (opcional)
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Contanos tu experiencia..."
                className="mt-1 w-full rounded-xl border border-[#dfe4f0] bg-[#f8faff] px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>

            {ratingError ? <p className="mt-2 text-sm text-red-700">{ratingError}</p> : null}
            {ratingSuccess ? <p className="mt-2 text-sm text-[#0f8a61]">{ratingSuccess}</p> : null}

            <button
              type="button"
              onClick={() => {
                void submitRating();
              }}
              disabled={!canSubmitRating || isSubmittingRating}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#92dce2] bg-[#c4eef0] px-4 py-2 text-sm font-semibold text-[#07a9b2] transition-colors hover:bg-[#b5e6ea] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmittingRating ? "Enviando..." : "Enviar calificacion"}
            </button>
          </div>
        ) : null}

        {showTipSection ? (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="rounded-2xl border border-[#cfd7e6] bg-white/80 p-5">
              <p className="text-sm text-[#64748b]">Mozo seleccionado</p>
              <p className="mt-1 text-xl font-semibold text-[#1f2937]">
                {selectedWaiter ? `${selectedWaiter.firstName} ${selectedWaiter.lastName}` : "-"}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                {isWaiterLocked
                  ? "Este QR ya esta asociado a este mozo. Continua con el boton de pago."
                  : "Elegi un mozo de la lista y confirma desde el boton de pago."}
              </p>
            </div>

            {!isWaiterLocked ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-3">
                  {isLoading ? <p className="text-center text-sm text-[#6b7280]">Cargando mozos...</p> : null}
                  {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}

                  {!isLoading && !error && waiters.length > 0 ? (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8ba8]" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar mozo por nombre"
                        className="h-11 w-full rounded-2xl border border-[#cfd7e6] bg-white pl-10 pr-3 text-sm text-[#1f2937] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                      />
                    </div>
                  ) : null}

                  {!isLoading && !error && waiters.length === 0 ? (
                    <p className="rounded-2xl border border-[#d6deea] bg-white px-4 py-5 text-center text-sm text-[#6b7280]">
                      Este restaurante todavia no cargo mozos.
                    </p>
                  ) : null}

                  {!isLoading && !error && waiters.length > 0 && filteredWaiters.length === 0 ? (
                    <p className="rounded-2xl border border-[#d6deea] bg-white px-4 py-5 text-center text-sm text-[#6b7280]">
                      No encontramos mozos con ese nombre.
                    </p>
                  ) : null}

                  {!isLoading && !error && filteredWaiters.length > 0
                    ? filteredWaiters.map((waiter, index) => {
                        const isActive = selectedWaiter?.id === waiter.id;
                        return (
                          <motion.button
                            key={waiter.id}
                            type="button"
                            onClick={() => {
                              setSelectedWaiter(waiter);
                              setModalWaiter(waiter);
                            }}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                              isActive
                                ? "border-[#4353de] bg-gradient-to-r from-[#2f66dc] to-[#4c3fd8] text-white"
                                : "border-[#cfd7e6] bg-white text-[#1f2937]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                                  isActive ? "bg-white/18 text-white" : "bg-[#e7ecf9] text-[#2f66dc]"
                                }`}
                              >
                                {getInitials(waiter).charAt(0)}
                              </div>
                              <div className="leading-tight">
                                <p className="font-semibold">
                                  {waiter.firstName} {waiter.lastName.charAt(0)}.
                                </p>
                                <p className={`text-sm ${isActive ? "text-white/85" : "text-[#4b5563]"}`}>Mozo</p>
                              </div>
                            </div>
                            <ArrowRight className={`h-4 w-4 ${isActive ? "text-white" : "text-[#1f2937]"}`} />
                          </motion.button>
                        );
                      })
                    : null}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={waiters.length === 0 || !selectedWaiter}
              onClick={() => {
                if (!selectedWaiter) return;
                setModalWaiter(selectedWaiter);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#92dce2] bg-[#c4eef0] px-4 py-4 text-sm font-semibold text-[#07a9b2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              Transferi por Mercado Pago
            </button>
          </div>
        ) : null}
      </div>

      <WaiterModal waiter={modalWaiter} onClose={() => setModalWaiter(null)} />
    </section>
  );
}
