"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Upload } from "lucide-react";

type MenuSnapshot = {
  fileUrl: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number | null;
  isActive: boolean;
} | null;

function formatBytes(input: number | null): string {
  if (!input || input <= 0) return "-";
  if (input < 1024) return `${input} B`;
  if (input < 1024 * 1024) return `${(input / 1024).toFixed(1)} KB`;
  return `${(input / (1024 * 1024)).toFixed(1)} MB`;
}

export function RestaurantMenuUploader() {
  const [menu, setMenu] = useState<MenuSnapshot>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadCurrentMenu = async () => {
      try {
        const response = await fetch("/api/admin/menu", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as {
          ok: boolean;
          menu?: MenuSnapshot;
          error?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo cargar la carta actual");
        }

        if (mounted) {
          setMenu(json.menu ?? null);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la carta actual");
        }
      } finally {
        if (mounted) {
          setIsLoadingCurrent(false);
        }
      }
    };

    void loadCurrentMenu();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/menu", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as {
        ok: boolean;
        menu?: MenuSnapshot;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo subir la carta");
      }

      setMenu(json.menu ?? null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la carta");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <h2 className="mb-4 font-serif text-4xl font-bold leading-none text-[#1d1d1b]">Carta Digital</h2>

      <p className="text-sm text-[#7a7065]">
        Subi un archivo PDF, JPG o PNG (maximo 10 MB). Se mostrara en la seccion Menu del store publico.
      </p>

      <div className="mt-4 rounded-xl border border-[#ddd6ce] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg border border-[#d9d2ca] bg-[#f6f4f1] p-2">
              <FileText className="h-4 w-4 text-[#4d4d4d]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1d1d1b]">
                {menu ? "Carta cargada" : isLoadingCurrent ? "Cargando..." : "No hay carta cargada"}
              </p>
              <p className="mt-1 text-xs text-[#7a7065]">
                {menu ? `${menu.mimeType} • ${formatBytes(menu.fileSizeBytes)}` : "Todavia no subiste un archivo."}
              </p>
            </div>
          </div>

          {menu?.fileUrl ? (
            <a
              href={menu.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d9d2ca] bg-[#f6f4f1] px-3 py-1.5 text-xs font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8]"
            >
              Ver
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || isLoadingCurrent}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {isUploading ? "Subiendo..." : menu ? "Cambiar carta" : "Subir carta"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={isUploading || isLoadingCurrent}
        onChange={handleFile}
        className="hidden"
      />
    </section>
  );
}
