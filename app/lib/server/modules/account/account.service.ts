import {
  type AccountMipropinaPayload,
  type AccountMipropinaStatus,
  getAccountByClerkId,
  getAccountByBrandId,
  insertAccount,
  patchAccountByClerkId,
  patchAccountByBrandId,
} from "@/app/lib/server/modules/account/account.repository";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import type { BillingSnapshot, BillingStatus } from "@/app/lib/server/modules/subscriptions/subscriptions.service";

type AccountSnapshotInput = {
  brandId: string;
  clerkUserId: string;
  billingStatus: BillingStatus;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  mercadopagoPreapprovalId?: string | null;
  mercadopagoPreapprovalStatus?: string | null;
  mpLastEventId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  lastPaymentId?: string | null;
  lastPaymentStatus?: string | null;
  lastPaymentAt?: string | null;
  nextBillingAt?: string | null;
  canceledAt?: string | null;
};

function mapBillingToAccountStatus(billingStatus: BillingStatus): AccountMipropinaStatus {
  switch (billingStatus) {
    case "trial_active":
      return "trial_active";
    case "trial_expired":
      return "trial_expired";
    case "subscription_active":
      return "active";
    case "subscription_paused":
      return "past_due";
    case "subscription_cancelled":
      return "canceled";
    case "subscription_pending":
      return "incomplete";
    case "none":
    default:
      return "incomplete";
  }
}

export async function upsertAccountSnapshotByBrandId(input: AccountSnapshotInput): Promise<void> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert account_mipropina without users_mipropina row");
  }

  const status = mapBillingToAccountStatus(input.billingStatus);
  const payload: AccountMipropinaPayload = {
    brand_id: input.brandId,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    status,
    trial_start: input.trialStartedAt ?? null,
    trial_end: input.trialEndsAt ?? null,
    mp_preapproval_id: input.mercadopagoPreapprovalId ?? null,
    mp_preapproval_status: input.mercadopagoPreapprovalStatus ?? null,
    mp_last_event_id: input.mpLastEventId ?? null,
    current_period_start: input.currentPeriodStart ?? null,
    current_period_end: input.currentPeriodEnd ?? null,
    last_payment_id: input.lastPaymentId ?? null,
    last_payment_status: input.lastPaymentStatus ?? null,
    last_payment_at: input.lastPaymentAt ?? null,
    next_billing_at: input.nextBillingAt ?? null,
    canceled_at: input.canceledAt ?? null,
  };

  const patchedRows = await patchAccountByBrandId(input.brandId, payload);
  if (patchedRows.length > 0) {
    return;
  }

  await insertAccount(payload);
}

function mapAccountStatusToBillingStatus(status: AccountMipropinaStatus): BillingStatus {
  switch (status) {
    case "trial_active":
      return "trial_active";
    case "trial_expired":
      return "trial_expired";
    case "active":
      return "subscription_active";
    case "past_due":
      return "subscription_paused";
    case "canceled":
      return "subscription_cancelled";
    case "incomplete":
    default:
      return "subscription_pending";
  }
}

function mapAccountToBillingSnapshot(account: {
  status: AccountMipropinaStatus;
  trial_start?: string | null;
  trial_end?: string | null;
  mp_preapproval_id?: string | null;
  mp_preapproval_status?: string | null;
}): BillingSnapshot {
  let status = mapAccountStatusToBillingStatus(account.status);
  const trialEndsAt = account.trial_end ?? null;

  if (status === "trial_active" && trialEndsAt) {
    const endDate = new Date(trialEndsAt);
    if (Number.isFinite(endDate.getTime()) && endDate.getTime() <= Date.now()) {
      status = "trial_expired";
    }
  }

  return {
    mode: status === "trial_active" || status === "trial_expired" ? "trial" : "subscription",
    status,
    trialDays: null,
    trialStartedAt: account.trial_start ?? null,
    trialEndsAt,
    mercadopagoPreapprovalId: account.mp_preapproval_id ?? null,
    mercadopagoPreapprovalStatus: account.mp_preapproval_status ?? null,
  };
}

export async function getBillingSnapshotByBrandId(
  brandId: string,
  clerkUserId?: string | null,
): Promise<BillingSnapshot> {
  let account = await getAccountByBrandId(brandId);

  if (!account && clerkUserId) {
    const legacyAccount = await getAccountByClerkId(clerkUserId);
    if (legacyAccount) {
      await patchAccountByClerkId(clerkUserId, {
        brand_id: brandId,
      });
      account = {
        ...legacyAccount,
        brand_id: brandId,
      };
    }
  }

  if (!account) {
    return {
      mode: null,
      status: "none",
      trialDays: null,
      trialStartedAt: null,
      trialEndsAt: null,
      mercadopagoPreapprovalId: null,
      mercadopagoPreapprovalStatus: null,
    };
  }

  return mapAccountToBillingSnapshot(account);
}
