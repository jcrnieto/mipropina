const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

type LowRatingWhatsAppInput = {
  ownerPhone: string;
  brandName: string;
  brandSlug: string;
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

function normalizePhoneForTwilio(phone: string): string | null {
  const raw = phone.trim();
  if (!raw) return null;

  if (raw.startsWith("whatsapp:+")) {
    return raw;
  }

  const compact = raw.replace(/[^\d+]/g, "");
  if (!compact) return null;

  if (compact.startsWith("+")) {
    return `whatsapp:${compact}`;
  }

  const defaultCountryCode = readEnvString("WHATSAPP_DEFAULT_COUNTRY_CODE");
  if (!defaultCountryCode) {
    return null;
  }

  const normalizedCountry = defaultCountryCode.startsWith("+")
    ? defaultCountryCode
    : `+${defaultCountryCode.replace(/[^\d]/g, "")}`;

  if (normalizedCountry === "+") {
    return null;
  }

  return `whatsapp:${normalizedCountry}${compact}`;
}

function isWhatsAppAlertsEnabled(): boolean {
  return readEnvString("WHATSAPP_ALERTS_ENABLED") === "true";
}

function getTwilioConfig(): {
  accountSid: string;
  authToken: string;
  from: string;
} {
  const accountSid = readEnvString("TWILIO_ACCOUNT_SID");
  const authToken = readEnvString("TWILIO_AUTH_TOKEN");
  const from = readEnvString("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing Twilio WhatsApp env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM");
  }

  return {
    accountSid,
    authToken,
    from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
  };
}

function formatAlertMessage(input: LowRatingWhatsAppInput): string {
  const lines = [
    `Alerta de resena en ${input.brandName}`,
    `Local: /${input.brandSlug}`,
    `Promedio: ${input.averageStars.toFixed(1)} estrellas`,
    `Puntaje minimo: ${input.lowestStars} estrella(s)`,
  ];

  const comment = input.comment?.trim();
  if (comment) {
    lines.push(`Comentario: "${comment.slice(0, 220)}"`);
  }

  return lines.join("\n");
}

export async function sendWhatsAppLowRatingAlert(input: LowRatingWhatsAppInput): Promise<void> {
  if (!isWhatsAppAlertsEnabled()) {
    return;
  }

  const to = normalizePhoneForTwilio(input.ownerPhone);
  if (!to) {
    throw new Error("Owner phone could not be normalized for WhatsApp.");
  }

  const { accountSid, authToken, from } = getTwilioConfig();
  const url = `${TWILIO_API_BASE}/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: formatAlertMessage(input),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio WhatsApp send failed (${response.status}): ${errorText}`);
  }
}

export function shouldNotifyLowRating(starsInput: number[]): boolean {
  if (starsInput.length === 0) return false;

  const avgThresholdRaw = readEnvString("LOW_RATING_ALERT_AVG_THRESHOLD");
  const minThresholdRaw = readEnvString("LOW_RATING_ALERT_MIN_STAR_THRESHOLD");
  const avgThreshold = Number(avgThresholdRaw ?? "2");
  const minThreshold = Number(minThresholdRaw ?? "1");
  const safeAvgThreshold = Number.isFinite(avgThreshold) ? avgThreshold : 2;
  const safeMinThreshold = Number.isFinite(minThreshold) ? minThreshold : 1;
  const average = starsInput.reduce((sum, current) => sum + current, 0) / starsInput.length;
  const minimum = Math.min(...starsInput);

  return average <= safeAvgThreshold || minimum <= safeMinThreshold;
}
