"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Save, Wallet } from "lucide-react";

type GeneralTipLinkEditorProps = {
  brandSlug: string;
  restaurantSlug: string;
};

type ApiResponse = {
  ok: boolean;
  generalTipLink?: string | null;
  error?: string;
};

export function GeneralTipLinkEditor({ brandSlug, restaurantSlug }: GeneralTipLinkEditorProps) {
  const [generalTipLink, setGeneralTipLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const query = new URLSearchParams({ brandSlug, restaurantSlug });

    const loadLink = async () => {
      try {
        const response = await fetch(`/api/admin/general-tip-link?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as ApiResponse;

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo cargar el link de propina.");
        }

        if (isMounted) {
          setGeneralTipLink(json.generalTipLink ?? "");
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el link de propina.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLink();
    return () => {
      isMounted = false;
    };
  }, [brandSlug, restaurantSlug]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const query = new URLSearchParams({ brandSlug, restaurantSlug });
      const response = await fetch(`/api/admin/general-tip-link?${query.toString()}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generalTipLink }),
      });

      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar el link de propina.");
      }

      setGeneralTipLink(json.generalTipLink ?? "");
      setSuccess(json.generalTipLink ? "Link de propina general guardado." : "Link de propina general eliminado.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el link de propina.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#ecf2ff] p-2 text-[#2f66dc]">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-[#122443]">Propina general</h2>
          <p className="mt-1 text-sm text-[#607193]">
            Link de pago para el QR general cuando el cliente no elige un mozo.
          </p>
        </div>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-[#607193]">Cargando link de propina...</p> : null}

      {!isLoading ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="general-tip-link" className="text-sm font-medium text-[#22365f]">
              Link de pago
            </label>
            <input
              id="general-tip-link"
              type="url"
              inputMode="url"
              value={generalTipLink}
              onChange={(event) => setGeneralTipLink(event.target.value)}
              placeholder="https://link.mercadopago.com.ar/tu-local"
              className="h-11 w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
            />
            <p className="text-xs text-[#607193]">
              Si lo dejás vacío, la propina general no estará disponible.
            </p>
          </div>

          {generalTipLink ? (
            <a
              href={generalTipLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2f66dc] hover:text-[#2457c4]"
            >
              Probar link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-[#0f8a61]">{success}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar link"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
