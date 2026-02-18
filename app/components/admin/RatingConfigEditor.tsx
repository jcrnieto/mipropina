"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Star, Trash2 } from "lucide-react";
import { RATING_FEATURE_MAX_LENGTH, RATING_MAX_FEATURES } from "@/app/validations";

type ApiResponse = {
  ok: boolean;
  features?: string[];
  error?: string;
};

export function RatingConfigEditor() {
  const [features, setFeatures] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const response = await fetch("/api/admin/rating-config", { method: "GET", cache: "no-store" });
        const json = (await response.json()) as ApiResponse;

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo cargar la configuracion.");
        }

        if (isMounted) {
          const loaded = (json.features ?? []).slice(0, RATING_MAX_FEATURES);
          setFeatures(loaded.length > 0 ? loaded : [""]);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la configuracion.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const nonEmptyCount = useMemo(
    () => features.map((item) => item.trim()).filter((item) => item.length > 0).length,
    [features],
  );

  const canAddRow = features.length < RATING_MAX_FEATURES;

  const handleAddRow = () => {
    if (!canAddRow) return;
    setFeatures((previous) => [...previous, ""]);
  };

  const handleRemoveRow = (index: number) => {
    setFeatures((previous) => {
      const next = previous.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/rating-config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar la configuracion.");
      }

      const saved = (json.features ?? []).slice(0, RATING_MAX_FEATURES);
      setFeatures(saved.length > 0 ? saved : [""]);
      setSuccess("Caracteristicas guardadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la configuracion.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <h2 className="mb-1 font-serif text-4xl font-bold leading-none text-[#1d1d1b]">Calificaciones</h2>
      <p className="mb-5 text-sm text-[#7a7065]">
        Carga hasta {RATING_MAX_FEATURES} caracteristicas para que tus clientes puntuen con estrellas (1 a 5).
      </p>

      {isLoading ? <p className="text-sm text-[#7a7065]">Cargando configuracion...</p> : null}

      {!isLoading ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={`feature-${index}`} className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e3ddd6] bg-[#f6f4f1] text-[#c68d4b]">
                  <Star className="h-4 w-4" />
                </div>

                <input
                  value={feature}
                  maxLength={RATING_FEATURE_MAX_LENGTH}
                  onChange={(event) =>
                    setFeatures((previous) =>
                      previous.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                    )
                  }
                  placeholder={`Caracteristica ${index + 1} (ej: Atencion del mozo)`}
                  className="h-10 w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-3.5 text-sm text-[#1d1d1b] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  disabled={features.length === 1}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] text-[#7a7065] transition-colors hover:bg-[#efece8] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Eliminar caracteristica"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={!canAddRow}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar caracteristica
            </button>
            <p className="text-sm text-[#7a7065]">
              {nonEmptyCount}/{RATING_MAX_FEATURES} configuradas
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-[#0f8a61]">{success}</p> : null}

          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar configuracion"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
