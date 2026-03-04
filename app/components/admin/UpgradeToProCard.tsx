"use client";

import { useState } from "react";
import { ArrowRight, Crown } from "lucide-react";

type UpgradeToProCardProps = {
  trialEndsAt: string | null;
};

export function UpgradeToProCard({ trialEndsAt }: UpgradeToProCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialEndLabel = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("es-AR") : null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/subscriptions", {
        method: "POST",
      });

      const json = (await response.json()) as {
        ok: boolean;
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !json.ok || !json.checkoutUrl) {
        throw new Error(json.error || "No se pudo iniciar Mercado Pago.");
      }

      window.location.href = json.checkoutUrl;
    } catch (upgradeError) {
      setError(upgradeError instanceof Error ? upgradeError.message : "No se pudo iniciar Mercado Pago.");
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#f5d8ad] bg-[#fff4e4] px-4 py-4 text-[#8d5b16]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm">
            Prueba activa{trialEndLabel ? ` hasta el ${trialEndLabel}` : ""}.
          </p>
          <p className="mt-1 text-xs text-[#98621a]">
            Pasate a Pro para mantener acceso continuo al panel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#d48321] px-4 text-sm font-semibold text-white transition hover:bg-[#bb741f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Crown className="h-4 w-4" />
          {isLoading ? "Redirigiendo..." : "Pasar a Pro"}
          {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-[#9f2f2f]">{error}</p> : null}
    </section>
  );
}
