"use client";

import { useEffect, useState } from "react";
import { Bell, Save } from "lucide-react";

export function NotificationsManager({
  brandSlug,
  restaurantSlug,
}: {
  brandSlug: string;
  restaurantSlug: string;
}) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ensureBrowserPushPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false;
    }

    if (!("Notification" in window)) {
      setError("Este navegador no soporta notificaciones web.");
      return false;
    }

    if (window.Notification.permission === "granted") {
      return true;
    }

    if (window.Notification.permission === "denied") {
      setError("El navegador tiene bloqueadas las notificaciones para este sitio.");
      return false;
    }

    const queue = window.OneSignalDeferred;
    if (!queue) {
      setError("OneSignal todavia se esta cargando. Espera unos segundos y volve a intentarlo.");
      return false;
    }

    await new Promise<void>((resolve, reject) => {
      queue.push(async (oneSignal) => {
        try {
          if (!oneSignal.Notifications.isPushSupported()) {
            setError("Este navegador no soporta notificaciones push.");
            resolve();
            return;
          }

          await oneSignal.Slidedown.promptPush();
          resolve();
        } catch (promptError) {
          reject(promptError);
        }
      });
    });

    const updatedPermission = window.Notification.permission as NotificationPermission;
    if (updatedPermission !== "granted") {
      setError("No se activo el permiso del navegador. Sin ese permiso no podemos enviarte alertas.");
      return false;
    }

    return true;
  };

  useEffect(() => {
    let isMounted = true;
    const query = new URLSearchParams({ brandSlug, restaurantSlug });

    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/admin/notifications-config?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json()) as {
          ok: boolean;
          enabled?: boolean;
          error?: string;
        };

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "No se pudo cargar la configuracion.");
        }

        if (isMounted) {
          setIsEnabled(json.enabled ?? false);
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
  }, [brandSlug, restaurantSlug]);

  const handleToggle = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const nextEnabled = !isEnabled;
      if (nextEnabled) {
        const hasBrowserPermission = await ensureBrowserPushPermission();
        if (!hasBrowserPermission) {
          return;
        }
      }

      const query = new URLSearchParams({ brandSlug, restaurantSlug });
      const response = await fetch(`/api/admin/notifications-config?${query.toString()}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        enabled?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "No se pudo guardar la configuracion.");
      }

      setIsEnabled(json.enabled ?? false);
      setSuccess(json.enabled ? "Notificaciones activadas." : "Notificaciones desactivadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la configuracion.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#ecf2ff] p-2 text-[#2f66dc]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#122443]">Notificaciones</h2>
            <p className="mt-1 text-sm text-[#607193]">
              Activa las notificaciones para recibir alertas de nuevas reseñas en este local.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-[#607193]">Cargando configuracion...</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[#f8fbff] p-4">
            <div>
              <p className="text-sm font-semibold text-[#1b2c4e]">
                {isEnabled ? "Notificaciones activas" : "Notificaciones desactivadas"}
              </p>
              <p className="mt-1 text-xs text-[#607193]">
                {isEnabled
                  ? "Recibirás notificaciones de nuevas reseñas en este local."
                  : "No recibirás notificaciones de nuevas reseñas para este local."}
              </p>
            </div>
            <div
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isEnabled ? "bg-[#2f66dc]" : "bg-[#dfe5f2]"
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  isEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-[#0f8a61]">{success}</p>}

          <button
            type="button"
            onClick={handleToggle}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : isEnabled ? "Desactivar notificaciones" : "Activar notificaciones"}
          </button>
        </div>
      )}
    </section>
  );
}
