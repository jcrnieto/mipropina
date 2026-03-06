"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, UtensilsCrossed, X } from "lucide-react";

export function RestaurantPhotoUploader() {
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLogo = async () => {
      try {
        const response = await fetch("/api/admin/logo", { method: "GET", cache: "no-store" });
        const json = (await response.json()) as {
          ok: boolean;
          imageUrl?: string | null;
          error?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo cargar el logo actual");
        }

        if (isMounted && json.imageUrl) {
          setLogo(encodeURI(json.imageUrl));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el logo actual");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCurrent(false);
        }
      }
    };

    void loadCurrentLogo();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const localPreviewUrl = URL.createObjectURL(file);
    setLogo(localPreviewUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as {
        ok: boolean;
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok || !json.ok || !json.imageUrl) {
        throw new Error(json.error || "No se pudo subir el logo");
      }

      URL.revokeObjectURL(localPreviewUrl);
      setLogo(encodeURI(json.imageUrl));
    } catch (uploadError) {
      URL.revokeObjectURL(localPreviewUrl);
      setLogo(null);
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el logo");
    } finally {
      setIsUploading(false);
    }

    // Permite volver a elegir el mismo archivo.
    event.target.value = "";
  };

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <h2 className="mb-1 font-display text-2xl font-bold text-[#122443]">Logo del Restaurante</h2>
      <p className="mb-5 text-sm text-[#607193]">Este logo se mostrara en la experiencia publica del cliente.</p>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#d6dfef] bg-[#f8fbff] transition-colors hover:border-[#8aa7e8]">
          {logo ? (
            <>
              <Image src={logo} alt="Logo del restaurante" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md transition-transform hover:scale-110"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <UtensilsCrossed className="h-10 w-10 text-[#8ca2ce]" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[#607193]">
            Subi el logo de tu restaurante. Se mostrara en la tienda publica.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isLoadingCurrent}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {isLoadingCurrent ? "Cargando..." : isUploading ? "Subiendo..." : logo ? "Cambiar logo" : "Subir logo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={isUploading || isLoadingCurrent}
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>
    </section>
  );
}
