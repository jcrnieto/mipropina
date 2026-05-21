"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import type { OneSignalInstance } from "@/app/components/admin/onesignal.types";

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

type OneSignalInitProps = {
  externalId?: string;
};

export function OneSignalInit({ externalId }: OneSignalInitProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!appId || typeof window === "undefined" || initializedRef.current) {
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (oneSignal) => {
      if (initializedRef.current) {
        return;
      }

      initializedRef.current = true;

      await oneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== "production",
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: false,
                text: {
                  actionMessage:
                    "Activa las notificaciones para enterarte al instante si una mesa deja una puntuacion regular o mala.",
                  acceptButton: "Activar",
                  cancelButton: "Ahora no",
                },
              },
            ],
          },
        },
        notifyButton: {
          enable: false,
        },
      });

      if (externalId) {
        await oneSignal.login(externalId);
      }
    });
  }, [externalId]);

  if (!appId) {
    return null;
  }

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
