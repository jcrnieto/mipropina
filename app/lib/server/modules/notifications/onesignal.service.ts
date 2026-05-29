type LowRatingPushInput = {
  ownerAuthUserId: string;
  brandName: string;
  brandSlug: string;
  restaurantSlug?: string | null;
  averageStars: number;
  lowestStars: number;
  comment?: string | null;
};

type OneSignalPushInput = {
  externalId: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
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
  await sendOneSignalPushToExternalId({
    externalId: input.ownerAuthUserId,
    title: `Alerta de resena en ${input.brandName}`,
    body: formatPushBody(input),
    url: buildNotificationUrl(input),
    data: {
      type: "low_rating",
      brandSlug: input.brandSlug,
      restaurantSlug: input.restaurantSlug ?? null,
      averageStars: input.averageStars,
      lowestStars: input.lowestStars,
    },
  });
}

export async function sendOneSignalPushToExternalId(input: OneSignalPushInput): Promise<void> {
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
        external_id: [input.externalId],
      },
      headings: {
        es: input.title,
        en: input.title,
      },
      contents: {
        es: input.body,
        en: input.body,
      },
      url: input.url,
      data: input.data,
    }),
    cache: "no-store",
  });

  const responseText = await response.text();
  let responseJson: unknown = null;
  try {
    responseJson = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseJson = null;
  }

  if (!response.ok) {
    throw new Error(`OneSignal push send failed (${response.status}): ${responseText}`);
  }

  if (responseJson && typeof responseJson === "object") {
    const payload = responseJson as { recipients?: unknown; errors?: unknown; id?: unknown };
    if (payload.errors) {
      throw new Error(`OneSignal push send returned errors: ${JSON.stringify(payload.errors)}`);
    }

    if (typeof payload.recipients === "number" && payload.recipients < 1) {
      throw new Error(`OneSignal push send reached 0 recipients for external_id ${input.externalId}.`);
    }

    if (typeof payload.id === "string" && payload.id.length === 0) {
      throw new Error(`OneSignal push send did not return a notification id for external_id ${input.externalId}.`);
    }
  }
}
