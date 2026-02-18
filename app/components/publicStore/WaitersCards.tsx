"use client";

import { useEffect, useMemo, useState } from "react";
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

export function WaitersCards({ brandSlug }: WaitersCardsProps) {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [store, setStore] = useState<StoreInfo>(EMPTY_STORE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ratingFeatures, setRatingFeatures] = useState<string[]>([]);
  const [stars, setStars] = useState<number[]>([]);
  const [comment, setComment] = useState("");
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
          setStore(json.store ?? EMPTY_STORE);
          const loadedFeatures = (json.ratingFeatures ?? []).slice(0, 5);
          setRatingFeatures(loadedFeatures);
          setStars(loadedFeatures.map(() => 0));
          setWaiters(json.waiters ?? []);
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
  }, [brandSlug]);

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
  const hasRatingConfig = ratingFeatures.length > 0;
  const canSubmitRating = hasRatingConfig && stars.length === ratingFeatures.length && stars.every((value) => value >= 1 && value <= 5);

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

        {hasRatingConfig ? (
          <div className="mt-4 rounded-2xl border border-[#cfd7e6] bg-white/80 p-4">
            <p className="text-sm font-semibold text-[#5e6f8f]">Califica tu experiencia</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              5 excelente, 4 muy bueno, 3 bueno, 2 regular, 1 malo.
            </p>

            <div className="mt-3 space-y-3">
              {ratingFeatures.map((feature, featureIndex) => (
                <div key={`${feature}-${featureIndex}`} className="rounded-xl border border-[#dfe4f0] bg-[#f8faff] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#1f2937]">{feature}</p>
                    <span className="text-xs font-semibold text-[#5e6f8f]">
                      {stars[featureIndex] ? RATING_LABELS[stars[featureIndex]] : "-"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = (stars[featureIndex] ?? 0) >= value;
                      return (
                        <button
                          key={`${featureIndex}-${value}`}
                          type="button"
                          onClick={() =>
                            setStars((previous) =>
                              previous.map((item, itemIndex) => (itemIndex === featureIndex ? value : item)),
                            )
                          }
                          className="rounded-md p-1 transition-colors hover:bg-[#eef3ff]"
                          aria-label={`Puntuar ${feature} con ${value} estrellas`}
                        >
                          <Star
                            className={`h-5 w-5 ${active ? "fill-[#f5b94c] text-[#f5b94c]" : "text-[#b9c5dc]"}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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

        <div className="mt-4 flex flex-1 flex-col">
          <div className="rounded-2xl border border-[#cfd7e6] bg-white/80 p-5">
            <p className="text-sm text-[#64748b]">Mozo seleccionado</p>
            <p className="mt-1 text-xl font-semibold text-[#1f2937]">
              {selectedWaiter ? `${selectedWaiter.firstName} ${selectedWaiter.lastName}` : "-"}
            </p>
            <p className="mt-2 text-sm text-[#6b7280]">
              Elegi un mozo de la lista y confirma desde el boton de pago.
            </p>
          </div>

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
      </div>

      <WaiterModal waiter={modalWaiter} onClose={() => setModalWaiter(null)} />
    </section>
  );
}
