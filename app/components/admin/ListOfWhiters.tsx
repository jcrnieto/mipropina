"use client";

import Image from "next/image";
import { Trash2, UsersRound } from "lucide-react";
import { Waiter } from "./waiters.types";

type ListOfWhitersProps = {
  waiters: Waiter[];
  isLoading: boolean;
  error: string | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onEdit: (waiter: Waiter) => void;
};

export function ListOfWhiters({
  waiters,
  isLoading,
  error,
  deletingId,
  onDelete,
  onEdit,
}: ListOfWhitersProps) {
  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <div className="flex items-start justify-between">
        <h2 className="font-serif text-4xl font-bold leading-none text-[#1d1d1b]">Equipo de Mozos</h2>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#f7efe4] px-3 py-1 text-sm font-medium text-[#d48321]">
          <UsersRound className="h-3.5 w-3.5" />
          {waiters.length}
        </span>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <p className="text-sm text-[#7a7065]">Cargando mozos...</p>
        </div>
      ) : waiters.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-[#ebe8e3]">
            <UsersRound className="h-8 w-8 text-[#bbb4ab]" />
          </div>

          <p className="text-[31px] leading-tight text-[#7a7065]">Todavia no hay mozos cargados</p>
          <p className="mt-1 text-sm text-[#aaa194]">Usa el formulario de arriba para agregar tu primer mozo</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {waiters.map((waiter) => (
            <article key={waiter.id} className="rounded-xl border border-[#ddd6ce] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#f3f1ee]">
                    {waiter.photo ? (
                      <Image
                        src={waiter.photo}
                        alt={`Foto de ${waiter.firstName}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#9a9085]">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#1d1d1b]">
                      {waiter.firstName} {waiter.lastName}
                    </p>
                    <p className="text-sm text-[#7a7065]">DNI: {waiter.dni}</p>
                    <p className="text-sm text-[#7a7065]">Telefono: {waiter.phone}</p>
                    <a
                      href={waiter.mercadopagoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#b96c19] underline"
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
                    className="inline-flex items-center gap-1 rounded-md border border-[#ddd6ce] px-2 py-1 text-xs text-[#7a7065] hover:bg-[#f6f4f1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === waiter.id ? "Eliminando..." : "Eliminar"}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === waiter.id}
                    onClick={() => onEdit(waiter)}
                    className="inline-flex items-center justify-center rounded-md border border-[#ddd6ce] px-2 py-1 text-xs text-[#7a7065] hover:bg-[#f6f4f1] disabled:cursor-not-allowed disabled:opacity-50"
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
