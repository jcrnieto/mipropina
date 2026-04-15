"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Plus, Store, ArrowRight, Trash2 } from "lucide-react";
import { buildAdminPath, buildStorePath, slugifyBrand } from "@/app/lib/brand";

type RestaurantItem = {
  id: string;
  brandName: string;
  branchName: string;
  slug: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  image: string | null;
  isActive: boolean;
};

type RestaurantsManagerProps = {
  initialRestaurants: RestaurantItem[];
  billingStatus: string;
};

type RestaurantForm = {
  brandName: string;
  branchName: string;
  slug: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
};

const INITIAL_FORM: RestaurantForm = {
  brandName: "",
  branchName: "",
  slug: "",
  phone: "",
  address: "",
  instagram: "",
  facebook: "",
  tiktok: "",
};

function normalizeSlugDraft(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");
}

export function RestaurantsManager({ initialRestaurants, billingStatus }: RestaurantsManagerProps) {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>(initialRestaurants);
  const [form, setForm] = useState<RestaurantForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usageLabel = useMemo(() => `${restaurants.length} local${restaurants.length === 1 ? "" : "es"} activo${restaurants.length === 1 ? "" : "s"}`, [restaurants.length]);

  useEffect(() => {
    setRestaurants(initialRestaurants);
  }, [initialRestaurants]);

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/restaurants", { method: "GET", cache: "no-store" });
      const json = (await response.json()) as {
        ok: boolean;
        restaurants?: RestaurantItem[];
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudieron cargar los locales.");
      }

      setRestaurants(json.restaurants ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los locales.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandNameChange = (value: string) => {
    setForm((previous) => {
      const next = { ...previous, brandName: value };
      if (!previous.slug || previous.slug === slugifyBrand(previous.brandName || "")) {
        next.slug = slugifyBrand(value);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.brandName.trim() || !form.slug.trim()) {
      setError("Completa al menos la marca y el slug del local.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo crear el local.");
      }

      setForm(INITIAL_FORM);
      setSuccess("Local creado correctamente.");
      await loadRestaurants();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el local.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (restaurant: RestaurantItem) => {
    const label = restaurant.branchName || restaurant.brandName || restaurant.slug;
    const confirmed = window.confirm(`Vas a eliminar el local "${label}". Esta accion lo desactivara del panel. Deseas continuar?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingId(restaurant.id);

    try {
      const response = await fetch(`/api/admin/restaurants?restaurantId=${encodeURIComponent(restaurant.id)}`, {
        method: "DELETE",
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo eliminar el local.");
      }

      setSuccess("Local eliminado correctamente.");
      await loadRestaurants();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el local.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#d8e0ef] bg-white p-6 shadow-[0_18px_45px_rgba(29,51,97,0.10)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6b7a99]">Cuenta</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-[#0f1b35] md:text-4xl">Tus locales</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5a6a8a] md:text-base">
              Gestiona las sucursales de tu cuenta y entra al panel operativo de cada restaurante.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center rounded-full border border-[#cedaf8] bg-[#f0f4ff] px-3 py-1.5 text-xs font-semibold text-[#2f4f9c]">
              {billingStatus}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6dfef] bg-[#f8fbff] px-3 py-1.5 text-sm font-medium text-[#2f66dc]">
              <Store className="h-4 w-4" />
              {usageLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[#ecf2ff] p-2 text-[#2f66dc]">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#122443]">Agregar local</h2>
              <p className="text-sm text-[#607193]">Crea una nueva sucursal para operarla por separado.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-[#22365f]">Marca</span>
                <input
                  value={form.brandName}
                  onChange={(event) => handleBrandNameChange(event.target.value)}
                  placeholder="Ej: Mostaza"
                  className="w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm text-[#1b2c4e] outline-none placeholder:text-[#95a4c0] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-[#22365f]">Sucursal</span>
                <input
                  value={form.branchName}
                  onChange={(event) => setForm((previous) => ({ ...previous, branchName: event.target.value }))}
                  placeholder="Ej: Palermo"
                  className="w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm text-[#1b2c4e] outline-none placeholder:text-[#95a4c0] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#22365f]">Slug</span>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, slug: normalizeSlugDraft(event.target.value) }))
                }
                placeholder="Ej: mostaza-palermo"
                className="w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm text-[#1b2c4e] outline-none placeholder:text-[#95a4c0] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-[#22365f]">Telefono</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                  placeholder="Ej: 11 5555 2222"
                  className="w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm text-[#1b2c4e] outline-none placeholder:text-[#95a4c0] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-[#22365f]">Direccion</span>
                <input
                  value={form.address}
                  onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
                  placeholder="Ej: Av. Santa Fe 1234"
                  className="w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-4 py-2 text-sm text-[#1b2c4e] outline-none placeholder:text-[#95a4c0] focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />
              </label>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-[#0f8a61]">{success}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2f66dc] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Creando..." : "Crear local"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#122443]">Locales activos</h2>
              <p className="text-sm text-[#607193]">Cada local tiene su propio panel, mozos, QR y analytics.</p>
            </div>
            {isLoading ? <p className="text-sm text-[#607193]">Actualizando...</p> : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {restaurants.length === 0 ? (
              <div className="rounded-2xl border border-[#dfe6f3] bg-[#f7faff] p-5 text-sm text-[#607193]">
                Aun no hay locales cargados en esta cuenta.
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="rounded-2xl border border-[#dfe6f3] bg-[#f7faff] p-4 shadow-[0_8px_20px_rgba(30,48,90,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#122443]">{restaurant.brandName || "Sin nombre"}</p>
                      <p className="text-sm text-[#607193]">{restaurant.branchName || "Sucursal principal"}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-[#d6dfef] bg-white px-2.5 py-1 text-xs font-semibold text-[#2f66dc]">
                      {restaurant.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#52637f]">
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#2f66dc]" />
                      /{restaurant.slug}
                    </p>
                    <p>{restaurant.address || "Direccion sin cargar"}</p>
                    <p>{restaurant.phone || "Telefono sin cargar"}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildAdminPath(restaurant.slug)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2457c4]"
                    >
                      Abrir panel
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={buildStorePath(restaurant.slug)}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d6dfef] bg-white px-4 py-2 text-sm font-medium text-[#1c376f] transition hover:bg-[#f7f9ff]"
                    >
                      Ver sitio
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(restaurant)}
                      disabled={deletingId === restaurant.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#f0c8c8] bg-white px-4 py-2 text-sm font-medium text-[#b04343] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === restaurant.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
