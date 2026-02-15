"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, UserRoundPlus, X } from "lucide-react";
import { Waiter } from "./waiters.types";

type WaiterForm = Omit<Waiter, "id" | "photo">;

type WaitersManagerProps = {
  onCreated: (waiter: Waiter) => void;
  onUpdated: (waiter: Waiter) => void;
  editingWaiter: Waiter | null;
  onCancelEdit: () => void;
};

const initialForm: WaiterForm = {
  firstName: "",
  lastName: "",
  dni: "",
  phone: "",
  mercadopagoLink: "",
};

function isMercadoPagoLink(url: string) {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();
    const hasPath = parsed.pathname.length > 1;
    const isMercadoPagoHost =
      hostname === "mercadopago.com" ||
      hostname.endsWith(".mercadopago.com") ||
      hostname === "mercadopago.com.ar" ||
      hostname.endsWith(".mercadopago.com.ar");

    return (parsed.protocol === "https:" || parsed.protocol === "http:") && isMercadoPagoHost && hasPath;
  } catch {
    return false;
  }
}

export function WaitersManager({
  onCreated,
  onUpdated,
  editingWaiter,
  onCancelEdit,
}: WaitersManagerProps) {
  const [form, setForm] = useState<WaiterForm>(initialForm);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(editingWaiter);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.firstName.trim() &&
        form.lastName.trim() &&
        form.dni.trim() &&
        form.phone.trim() &&
        form.mercadopagoLink.trim(),
    );
  }, [form]);

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  useEffect(() => {
    if (!editingWaiter) {
      setForm(initialForm);
      setPhoto(null);
      setError("");
      return;
    }

    setForm({
      firstName: editingWaiter.firstName,
      lastName: editingWaiter.lastName,
      dni: editingWaiter.dni,
      phone: editingWaiter.phone,
      mercadopagoLink: editingWaiter.mercadopagoLink,
    });
    setPhoto(editingWaiter.photo);
    setError("");
  }, [editingWaiter]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completa todos los campos.");
      return;
    }

    if (!isMercadoPagoLink(form.mercadopagoLink)) {
      setError("El link debe ser una URL valida de Mercado Pago.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/admin/waiters/${editingWaiter!.id}` : "/api/admin/waiters";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.firstName,
          lastName: form.lastName,
          dni: form.dni,
          phone: form.phone,
          mercadopagoLink: form.mercadopagoLink,
          image: photo,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
        waiter?: Waiter;
      };

      if (!response.ok || !json.ok || !json.waiter) {
        throw new Error(json.error || "No se pudo crear el mozo");
      }

      if (isEditing) {
        onUpdated(json.waiter);
      } else {
        onCreated(json.waiter);
      }
      setForm(initialForm);
      setPhoto(null);
      if (isEditing) {
        onCancelEdit();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el mozo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <h2 className="mb-5 font-serif text-4xl font-bold leading-none text-[#1d1d1b]">
        {isEditing ? "Editar Mozo" : "Agregar Mozo"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#e7cda8] bg-[#f3f1ee]">
            {photo ? (
              <>
                <Image src={photo} alt="Foto del mozo" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <Camera className="h-5 w-5 text-[#b7afa4]" />
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm text-[#7a7065] hover:text-[#5f5448]"
            >
              Toca para subir la foto del mozo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-[#1d1d1b]">Nombre</span>
            <input
              value={form.firstName}
              onChange={(event) => setForm((previous) => ({ ...previous, firstName: event.target.value }))}
              placeholder="Ej: Juan"
              className="w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm text-[#1d1d1b] outline-none placeholder:text-[#9a9085] focus:border-[#cc9a5b]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-[#1d1d1b]">Apellido</span>
            <input
              value={form.lastName}
              onChange={(event) => setForm((previous) => ({ ...previous, lastName: event.target.value }))}
              placeholder="Ej: Perez"
              className="w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm text-[#1d1d1b] outline-none placeholder:text-[#9a9085] focus:border-[#cc9a5b]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-[#1d1d1b]">DNI</span>
            <input
              value={form.dni}
              onChange={(event) => setForm((previous) => ({ ...previous, dni: event.target.value }))}
              placeholder="Ej: 30111222"
              className="w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm text-[#1d1d1b] outline-none placeholder:text-[#9a9085] focus:border-[#cc9a5b]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-[#1d1d1b]">Telefono</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              placeholder="Ej: 11 5555 2222"
              className="w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm text-[#1d1d1b] outline-none placeholder:text-[#9a9085] focus:border-[#cc9a5b]"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-[#1d1d1b]">Link de Mercado Pago</span>
          <input
            value={form.mercadopagoLink}
            onChange={(event) => setForm((previous) => ({ ...previous, mercadopagoLink: event.target.value }))}
            placeholder="https://www.mercadopago.com.ar/..."
            className="w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm text-[#1d1d1b] outline-none placeholder:text-[#9a9085] focus:border-[#cc9a5b]"
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e68f2d] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d78223] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserRoundPlus className="h-4 w-4" />
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar mozo"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="ml-2 inline-flex items-center rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-5 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8]"
          >
            Cancelar
          </button>
        ) : null}
      </form>
    </section>
  );
}
