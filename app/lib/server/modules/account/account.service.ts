import {
  type AccountMipropinaPayload,
  type AccountMipropinaStatus,
  insertAccount,
  patchAccountByClerkId,
} from "@/app/lib/server/modules/account/account.repository";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import type { BillingStatus } from "@/app/lib/server/modules/subscriptions/subscriptions.service";

type AccountSnapshotInput = {
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

export async function upsertAccountSnapshotByClerkId(input: AccountSnapshotInput): Promise<void> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert account_mipropina without users_mipropina row");
  }

  const status = mapBillingToAccountStatus(input.billingStatus);
  const payload: AccountMipropinaPayload = {
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

  const patchedRows = await patchAccountByClerkId(input.clerkUserId, payload);
  if (patchedRows.length > 0) {
    return;
  }

  await insertAccount(payload);
}

