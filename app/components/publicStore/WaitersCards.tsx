"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CreditCard } from "lucide-react";
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

export function WaitersCards({ brandSlug }: WaitersCardsProps) {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);

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
          waiters?: Waiter[];
          error?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudieron cargar los mozos");
        }

        if (isMounted) {
          const loaded = json.waiters ?? [];
          setWaiters(loaded);
          if (loaded.length > 0) {
            setSelectedWaiter((current) => current ?? loaded[0]);
          }
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

  const brandName = useMemo(() => formatBrandName(brandSlug), [brandSlug]);

  return (
    <section className="mx-auto w-full max-w-sm min-h-[calc(100dvh-4rem)] rounded-[34px] border border-white/70 bg-[#f4f6fb]/85 p-4 shadow-[0_20px_50px_rgba(17,24,39,0.14)] backdrop-blur md:min-h-0 md:max-w-5xl md:rounded-3xl md:p-6">
      <div className="flex h-full flex-col rounded-[26px] bg-[#e7ebf3] p-4 md:grid md:grid-cols-[1fr_1.15fr] md:gap-6 md:p-7">
        <div className="md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6b7280]">mipropina.app</p>
            <div className="mt-2 text-center md:mt-5 md:text-left">
              <h2 className="text-[29px] font-bold leading-none text-[#1f2937] md:text-[44px]">{brandName}</h2>
              <p className="mt-2 text-sm text-[#64748b] md:text-base">Elegi a tu mozo</p>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-[#cfd7e6] bg-white/80 p-5 md:mt-6 md:block">
            <p className="text-sm text-[#64748b]">Mozo seleccionado</p>
            <p className="mt-1 text-xl font-semibold text-[#1f2937]">
              {selectedWaiter ? `${selectedWaiter.firstName} ${selectedWaiter.lastName}` : "-"}
            </p>
            <p className="mt-2 text-sm text-[#6b7280]">
              Elegi un mozo de la lista y confirma desde el boton de pago.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col md:mt-0">
          <div className="space-y-3">
            {isLoading ? <p className="text-center text-sm text-[#6b7280]">Cargando mozos...</p> : null}
            {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}

            {!isLoading && !error && waiters.length === 0 ? (
              <p className="rounded-2xl border border-[#d6deea] bg-white px-4 py-5 text-center text-sm text-[#6b7280]">
                Este restaurante todavia no cargo mozos.
              </p>
            ) : null}

            {!isLoading && !error && waiters.length > 0
              ? waiters.map((waiter, index) => {
                  const isActive = selectedWaiter?.id === waiter.id;
                  return (
                    <motion.button
                      key={waiter.id}
                      type="button"
                      onClick={() => setSelectedWaiter(waiter)}
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

          <button
            type="button"
            disabled={waiters.length === 0}
            onClick={() => {
              if (!waiters.length) return;
              setSelectedWaiter((current) => current ?? waiters[0]);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#92dce2] bg-[#c4eef0] px-4 py-4 text-sm font-semibold text-[#07a9b2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            Transferi por Mercado Pago
          </button>
        </div>
      </div>

      <WaiterModal waiter={selectedWaiter} onClose={() => setSelectedWaiter(null)} />
    </section>
  );
}
