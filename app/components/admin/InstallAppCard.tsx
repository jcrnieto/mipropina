"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, Share2, Smartphone } from "lucide-react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsStandalone(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }
    window.addEventListener("appinstalled", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener("appinstalled", handleDisplayModeChange);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setIsStandalone(isStandaloneMode());
  }

  const helperText = isStandalone
    ? "Ya la tienes instalada en este celular."
    : deferredPrompt
      ? "Puedes instalar este panel para abrirlo como acceso directo."
      : isIos
        ? "En iPhone se agrega desde Safari con Compartir y luego Agregar a pantalla de inicio."
        : isAndroid
          ? "En Android puedes instalarla o agregarla a la pantalla principal en pocos segundos."
          : "Puedes guardarla en la pantalla principal para entrar más rápido al panel.";

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-5 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-2xl bg-[#edf4ff] p-2 text-[#2f66dc]">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-[#122443]">Instalar en tu celular</h2>
          <p className="mt-1 text-sm text-[#607193]">
            {helperText}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isStandalone ? (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2457c5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e49a5]"
            >
              <Download className="h-4 w-4" />
              Instalar en mi celular
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setShowInstructions((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e0ef] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#23427a] transition hover:bg-[#eef4ff]"
          >
            <Smartphone className="h-4 w-4" />
            Ver instrucciones
          </button>
        </div>
      </div>

      {showInstructions ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-[#dce4f2] bg-[#f8fbff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7093]">iPhone</p>
            <h3 className="mt-1 text-base font-semibold text-[#1a2c52]">Safari</h3>
            <div className="mt-3 space-y-2 text-sm text-[#607193]">
              <p>1. Abre esta web en Safari.</p>
              <p className="inline-flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#2f66dc]" />
                2. Toca Compartir.
              </p>
              <p>3. Elige Agregar a pantalla de inicio.</p>
              <p>4. Confirma para crear el acceso directo.</p>
            </div>
          </article>

          <article className="rounded-2xl border border-[#dce4f2] bg-[#f8fbff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7093]">Android</p>
            <h3 className="mt-1 text-base font-semibold text-[#1a2c52]">Chrome</h3>
            <div className="mt-3 space-y-2 text-sm text-[#607193]">
              <p>1. Abre esta web en Chrome.</p>
              <p>2. Toca el menú de tres puntos.</p>
              <p>3. Elige Instalar app o Agregar a pantalla principal.</p>
              <p>4. Confirma para tener el acceso directo.</p>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
