import {
  getAppUrl,
  mercadoPagoRequest,
  resolveMercadoPagoPayerEmail,
} from "@/app/lib/server/modules/payments/mercadopago.client";

export type BillingMode = "trial" | "subscription";
export type BillingStatus = "none" | "trial_active" | "trial_expired" | "subscription_pending" | "subscription_active" | "subscription_paused" | "subscription_cancelled";

export type BillingSnapshot = {
  mode: BillingMode | null;
  status: BillingStatus;
  trialDays: number | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  mercadopagoPreapprovalId: string | null;
  mercadopagoPreapprovalStatus: string | null;
};

type MercadoPagoPreapprovalResponse = {
  id: string;
  status: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
};

export function computeTrialWindow(days: number): {
  startedAtIso: string;
  endsAtIso: string;
} {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);

  return {
    startedAtIso: now.toISOString(),
    endsAtIso: end.toISOString(),
  };
}

export function resolveBillingStatusFromPreapprovalStatus(status: string | null | undefined): BillingStatus {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "authorized") {
    return "subscription_active";
  }

  if (normalized === "pending") {
    return "subscription_pending";
  }

  if (normalized === "paused") {
    return "subscription_paused";
  }

  if (normalized === "cancelled") {
    return "subscription_cancelled";
  }

  return "subscription_pending";
}

export function hasActiveAdminAccess(snapshot: BillingSnapshot, now = new Date()): boolean {
  if (snapshot.status === "subscription_active") {
    return true;
  }

  if (snapshot.status !== "trial_active") {
    return false;
  }

  if (!snapshot.trialEndsAt) {
    return false;
  }

  const endsAt = new Date(snapshot.trialEndsAt);
  return Number.isFinite(endsAt.getTime()) && endsAt.getTime() > now.getTime();
}

export async function createMercadoPagoSubscriptionCheckout(input: {
  clerkUserId: string;
  payerEmail: string;
  reason: string;
  amount: number;
  currencyId?: string;
  brandSlug?: string | null;
}): Promise<{
  preapprovalId: string;
  checkoutUrl: string;
  status: string;
}> {
  const appUrl = getAppUrl();
  const normalizedBrandSlug = input.brandSlug?.trim();
  const backUrl = normalizedBrandSlug ? `${appUrl}/admin/${normalizedBrandSlug}` : `${appUrl}/admin`;
  const payerEmail = resolveMercadoPagoPayerEmail(input.payerEmail);
  const response = await mercadoPagoRequest<MercadoPagoPreapprovalResponse>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: input.reason,
      payer_email: payerEmail,
      external_reference: `clerk:${input.clerkUserId}`,
      back_url: backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: input.currencyId ?? "ARS",
      },
    }),
  });

  const checkoutUrl = response.init_point ?? response.sandbox_init_point;
  if (!checkoutUrl) {
    throw new Error("Mercado Pago did not return checkout URL");
  }

  return {
    preapprovalId: response.id,
    checkoutUrl,
    status: response.status,
  };
}

export async function getMercadoPagoPreapprovalById(preapprovalId: string): Promise<{
  id: string;
  status: string;
  externalReference: string | null;
}> {
  const response = await mercadoPagoRequest<MercadoPagoPreapprovalResponse>(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "GET",
  });

  return {
    id: response.id,
    status: response.status,
    externalReference: response.external_reference ?? null,
  };
}

export function readClerkUserIdFromExternalReference(externalReference: string | null): string | null {
  if (!externalReference) {
    return null;
  }

  if (!externalReference.startsWith("clerk:")) {
    return null;
  }

  const userId = externalReference.slice("clerk:".length).trim();
  return userId.length > 0 ? userId : null;
}
