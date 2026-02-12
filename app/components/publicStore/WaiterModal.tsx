"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Heart, User, X } from "lucide-react";

type Waiter = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  photo: string | null;
};

type WaiterModalProps = {
  waiter: Waiter | null;
  onClose: () => void;
};

export default function WaiterModal({ waiter, onClose }: WaiterModalProps) {
  const isOpen = Boolean(waiter);
  const initials = waiter ? `${waiter.firstName[0] ?? ""}${waiter.lastName[0] ?? ""}` : "";

  const handlePayment = () => {
    if (!waiter?.mercadopagoLink) return;
    window.open(waiter.mercadopagoLink, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {isOpen && waiter ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 36 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 36 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f1ee] text-[#7a7065] transition-colors hover:text-[#1d1d1b]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#f3f1ee] ring-4 ring-[#e7cda8]">
                  {waiter.photo ? (
                    <img
                      src={waiter.photo}
                      alt={`${waiter.firstName} ${waiter.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-[#b96c19]">{initials || "M"}</span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-[#1d1d1b]">
                  {waiter.firstName} {waiter.lastName}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-[#7a7065]">
                  <User className="h-3.5 w-3.5" /> Mozo
                </p>

                <div className="my-6 h-px w-full bg-[#e3ddd6]" />

                <p className="mb-6 text-sm leading-relaxed text-[#7a7065]">
                  Queres dejarle una propina a{" "}
                  <span className="font-semibold text-[#1d1d1b]">{waiter.firstName}</span>? Seras
                  redirigido a Mercado Pago para completar el pago de forma segura.
                </p>

                <button
                  type="button"
                  onClick={handlePayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e68f2d] px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                >
                  <Heart className="h-4 w-4" />
                  Dejar propina
                  <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
                </button>

                <p className="mt-3 text-xs text-[#7a7065]">Pago seguro con Mercado Pago</p>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
