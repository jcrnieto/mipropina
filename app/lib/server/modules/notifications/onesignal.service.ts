type LowRatingPushInput = {
  ownerAuthUserId: string;
  brandName: string;
  brandSlug: string;
  restaurantSlug?: string | null;
  averageStars: number;
  lowestStars: number;
  comment?: string | null;
};

function readEnvString(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOneSignalConfig(): {
  appId: string;
  restApiKey: string;
} {
  const appId = readEnvString("ONESIGNAL_APP_ID") ?? readEnvString("NEXT_PUBLIC_ONESIGNAL_APP_ID");
  const restApiKey = readEnvString("ONESIGNAL_REST_API_KEY");

  if (!appId || !restApiKey) {
    throw new Error("Missing OneSignal env vars: ONESIGNAL_REST_API_KEY and ONESIGNAL_APP_ID/NEXT_PUBLIC_ONESIGNAL_APP_ID");
  }

  return { appId, restApiKey };
}

function getAppBaseUrl(): string | null {
  const raw = readEnvString("NEXT_PUBLIC_APP_URL");
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

function buildNotificationUrl(input: LowRatingPushInput): string | undefined {
  const baseUrl = getAppBaseUrl();
  if (!baseUrl) return undefined;

  const path = input.restaurantSlug
    ? `/admin/${input.brandSlug}/${input.restaurantSlug}#analytics`
    : `/admin/${input.brandSlug}#analytics`;

  return `${baseUrl}${path}`;
}

function formatPushBody(input: LowRatingPushInput): string {
  const parts = [
    `Promedio ${input.averageStars.toFixed(1)} estrellas`,
    `puntaje minimo ${input.lowestStars}`,
  ];
  const comment = input.comment?.trim();
  if (comment) {
    parts.push(`"${comment.slice(0, 120)}"`);
  }

  return parts.join(" - ");
}

export async function sendOneSignalLowRatingAlert(input: LowRatingPushInput): Promise<void> {
  const { appId, restApiKey } = getOneSignalConfig();
  const response = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: {
      Authorization: `Key ${restApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: {
        external_id: [input.ownerAuthUserId],
      },
      headings: {
        es: `Alerta de resena en ${input.brandName}`,
        en: `Review alert for ${input.brandName}`,
      },
      contents: {
        es: formatPushBody(input),
        en: formatPushBody(input),
      },
      url: buildNotificationUrl(input),
      data: {
        type: "low_rating",
        brandSlug: input.brandSlug,
        restaurantSlug: input.restaurantSlug ?? null,
        averageStars: input.averageStars,
        lowestStars: input.lowestStars,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OneSignal push send failed (${response.status}): ${errorText}`);
  }
}
