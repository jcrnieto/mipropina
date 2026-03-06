"use client";

import Image from "next/image";
import { Trash2, UsersRound } from "lucide-react";
import { Waiter } from "./waiters.types";

type WaitersListProps = {
  waiters: Waiter[];
  isLoading: boolean;
  error: string | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onEdit: (waiter: Waiter) => void;
};

export function WaitersList({
  waiters,
  isLoading,
  error,
  deletingId,
  onDelete,
  onEdit,
}: WaitersListProps) {
  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-2xl font-bold text-[#122443]">Equipo de Mozos</h2>

        <span className="inline-flex items-center gap-1 rounded-full border border-[#d6dfef] bg-[#f8fbff] px-3 py-1 text-sm font-medium text-[#2f66dc]">
          <UsersRound className="h-3.5 w-3.5" />
          {waiters.length}
        </span>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <p className="text-sm text-[#607193]">Cargando mozos...</p>
        </div>
      ) : waiters.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f5ff]">
            <UsersRound className="h-8 w-8 text-[#8ca2ce]" />
          </div>

          <p className="text-2xl font-semibold leading-tight text-[#495b7f]">Todavia no hay mozos cargados</p>
          <p className="mt-1 text-sm text-[#8796b4]">Usa el formulario de arriba para agregar tu primer mozo.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {waiters.map((waiter) => (
            <article key={waiter.id} className="rounded-xl border border-[#d8e0ef] bg-[#f9fbff] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#edf2fd]">
                    {waiter.photo ? (
                      <Image
                        src={waiter.photo}
                        alt={`Foto de ${waiter.firstName}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#7e8fb0]">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#1b2c4e]">
                      {waiter.firstName} {waiter.lastName}
                    </p>
                    <p className="text-sm text-[#607193]">DNI: {waiter.dni}</p>
                    <p className="text-sm text-[#607193]">Telefono: {waiter.phone}</p>
                    <a
                      href={waiter.mercadopagoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#2f66dc] underline"
                    >
                      Abrir link de Mercado Pago
                    </a>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={deletingId === waiter.id}
                    onClick={() => onDelete(waiter.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#d6dfef] bg-white px-2 py-1 text-xs text-[#607193] hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === waiter.id ? "Eliminando..." : "Eliminar"}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === waiter.id}
                    onClick={() => onEdit(waiter)}
                    className="inline-flex items-center justify-center rounded-md border border-[#d6dfef] bg-white px-2 py-1 text-xs text-[#607193] hover:bg-[#eef3ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

