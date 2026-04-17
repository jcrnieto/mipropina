"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type OneSignalPromptOptions = {
  force?: boolean;
};

type OneSignalInstance = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Slidedown: {
    promptPush: (options?: OneSignalPromptOptions) => Promise<void>;
  };
  Notifications: {
    permission: boolean;
    isPushSupported: () => boolean;
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalInstance;
    OneSignalDeferred?: Array<(oneSignal: OneSignalInstance) => void | Promise<void>>;
  }
}

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
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerParam: {
          scope: "/push/onesignal/",
        },
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
