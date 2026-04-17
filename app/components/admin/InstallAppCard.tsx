"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Download,
  MonitorSmartphone,
  Share2,
  Smartphone,
} from "lucide-react";
import type { OneSignalInstance } from "@/app/components/admin/onesignal.types";

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [isActivatingNotifications, setIsActivatingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsStandalone(isStandaloneMode());
    setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
      setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");
    };
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else if (legacyMediaQuery.addListener) {
      legacyMediaQuery.addListener(handleDisplayModeChange);
    }
    window.addEventListener("appinstalled", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else if (legacyMediaQuery.removeListener) {
        legacyMediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener("appinstalled", handleDisplayModeChange);
    };
  }, []);

  async function handleNotificationPrompt() {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationMessage("Este navegador no soporta notificaciones web.");
      return;
    }

    if (isIos && !isStandalone) {
      setNotificationMessage(
        "En iPhone primero instala la app en pantalla de inicio y luego vuelve a activar notificaciones.",
      );
      return;
    }

    setIsActivatingNotifications(true);
    setNotificationMessage("");

    try {
      const currentPermission = window.Notification.permission;
      setNotificationPermission(currentPermission);

      if (currentPermission === "granted") {
        setNotificationMessage("Las notificaciones ya están activas en este dispositivo.");
        return;
      }

      if (currentPermission === "denied") {
        setNotificationMessage(
          "Este navegador ya bloqueó las notificaciones. Tienes que habilitarlas manualmente desde la configuración del sitio.",
        );
        return;
      }

      const queue = window.OneSignalDeferred;
      if (!queue) {
        setNotificationMessage("OneSignal todavía se está cargando. Espera unos segundos y vuelve a intentarlo.");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        queue.push(async (oneSignal) => {
          try {
            if (!oneSignal.Notifications.isPushSupported()) {
              setNotificationPermission("unsupported");
              setNotificationMessage("Este navegador no soporta notificaciones push.");
              resolve();
              return;
            }

            await oneSignal.Slidedown.promptPush();

            const updatedPermission = window.Notification.permission;
            setNotificationPermission(updatedPermission);

            if (updatedPermission === "granted") {
              setNotificationMessage(
                "Notificaciones activadas. Te avisaremos cuando una mesa deje una puntuación regular o mala.",
              );
            } else {
              setNotificationMessage(
                "No se activaron las notificaciones. Puedes volver a intentarlo desde este botón.",
              );
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch {
      setNotificationMessage("No pudimos abrir el permiso de notificaciones. Prueba nuevamente desde este dispositivo.");
    } finally {
      setIsActivatingNotifications(false);
    }
  }

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

  const notificationHelperText =
    notificationPermission === "granted"
      ? "Este dispositivo ya quedó listo para recibir alertas."
      : notificationPermission === "denied"
        ? "El navegador bloqueó las notificaciones. Debes habilitarlas manualmente en la configuración del sitio."
        : notificationPermission === "unsupported"
          ? "Este navegador no puede recibir notificaciones push web."
          : isIos && !isStandalone
            ? "En iPhone primero instala la app en pantalla de inicio. Después podrás activar las notificaciones."
            : "Activa las notificaciones para enterarte al instante cuando una mesa califique regular o mal.";

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-5 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#dce4f2] bg-[#fbfdff] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-2xl bg-[#edf4ff] p-2 text-[#2f66dc]">
                <MonitorSmartphone className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[#122443]">Instalar en tu celular</h2>
              <p className="mt-1 text-sm text-[#607193]">{helperText}</p>
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
        </div>

        <div className="rounded-2xl border border-[#dce4f2] bg-[#fbfdff] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-2xl bg-[#ecfdf3] p-2 text-[#1c9a5f]">
                {notificationPermission === "granted" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <BellRing className="h-5 w-5" />
                )}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[#122443]">Activar notificaciones</h2>
              <p className="mt-1 text-sm text-[#607193]">{notificationHelperText}</p>
            </div>

            <button
              type="button"
              onClick={handleNotificationPrompt}
              disabled={
                isActivatingNotifications ||
                notificationPermission === "granted" ||
                notificationPermission === "unsupported"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#139c71] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f835f] disabled:cursor-not-allowed disabled:bg-[#b8d7cb]"
            >
              <Bell className="h-4 w-4" />
              {notificationPermission === "granted"
                ? "Notificaciones activas"
                : isActivatingNotifications
                  ? "Activando..."
                  : "Activar notificaciones"}
            </button>
          </div>

          {notificationMessage ? (
            <p className="mt-4 rounded-xl border border-[#dce4f2] bg-white px-3 py-2 text-sm text-[#46607f]">
              {notificationMessage}
            </p>
          ) : null}
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
              <p>2. Toca el menu de tres puntos.</p>
              <p>3. Elige Instalar app o Agregar a pantalla principal.</p>
              <p>4. Confirma para tener el acceso directo.</p>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
