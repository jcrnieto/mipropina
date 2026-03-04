const MERCADOPAGO_API_BASE = "https://api.mercadopago.com";

export type MercadoPagoRuntimeMode = "local-test" | "deploy-production";

function readEnvString(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getMercadoPagoRuntimeMode(): MercadoPagoRuntimeMode {
  const appUrl = readEnvString("NEXT_PUBLIC_APP_URL") ?? "";
  const isLocalByUrl = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const isVercel = process.env.VERCEL === "1";

  if (!isVercel && (isLocalByUrl || process.env.NODE_ENV !== "production")) {
    return "local-test";
  }

  return "deploy-production";
}

export function getMercadoPagoAccessToken(): string {
  const mode = getMercadoPagoRuntimeMode();

  if (mode === "local-test") {
    const testToken = readEnvString("MP_ACCESS_TOKEN_TEST");
    if (!testToken) {
      throw new Error("Missing MP_ACCESS_TOKEN_TEST for local environment");
    }
    return testToken;
  }

  const productionToken = readEnvString("MERCADOPAGO_ACCESS_TOKEN");
  if (!productionToken) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN for deployed environment");
  }
  return productionToken;
}

export function resolveMercadoPagoPayerEmail(defaultEmail: string): string {
  const mode = getMercadoPagoRuntimeMode();
  if (mode !== "local-test") {
    return defaultEmail;
  }

  const testEmail = readEnvString("MP_PAYER_EMAIL_TEST");
  if (!testEmail) {
    throw new Error("Missing MP_PAYER_EMAIL_TEST for local environment");
  }

  return testEmail;
}

export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  return appUrl.replace(/\/+$/, "");
}

export async function mercadoPagoRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${MERCADOPAGO_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}
