import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { upsertAccountSnapshotByClerkId } from "@/app/lib/server/modules/account/account.service";
import {
  getBillingDataFromUser,
  getOnboardingDataFromUser,
  requireSignedInUser,
} from "@/app/lib/auth";
import {
  getMercadoPagoPreapprovalById,
  hasActiveAdminAccess,
  readClerkUserIdFromExternalReference,
  resolveBillingStatusFromPreapprovalStatus,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";
import { buildAdminPath } from "@/app/lib/brand";

type ReturnPageProps = {
  searchParams: Promise<{
    preapproval_id?: string;
  }>;
};

export default async function BillingReturnPage({ searchParams }: ReturnPageProps) {
  const [user, query] = await Promise.all([requireSignedInUser(), searchParams]);
  const billing = getBillingDataFromUser(user);
  const preapprovalId = query.preapproval_id ?? billing.mercadopagoPreapprovalId ?? undefined;
  const onboarding = getOnboardingDataFromUser(user);

  if (!onboarding.brandSlug) {
    redirect("/onboarding?error=missing-brand");
  }

  if (!preapprovalId) {
    redirect("/onboarding?plan=subscription&error=missing-preapproval");
  }

  try {
    const preapproval = await getMercadoPagoPreapprovalById(preapprovalId);
    const externalClerkUserId = readClerkUserIdFromExternalReference(preapproval.externalReference);

    if (!externalClerkUserId || externalClerkUserId !== user.id) {
      redirect("/onboarding?plan=subscription&error=invalid-reference");
    }

    const billingStatus = resolveBillingStatusFromPreapprovalStatus(preapproval.status);

    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        billingMode: "subscription",
        billingStatus,
        mercadopagoPreapprovalId: preapproval.id,
        mercadopagoPreapprovalStatus: preapproval.status,
      },
    });

    await upsertAccountSnapshotByClerkId({
      clerkUserId: user.id,
      billingStatus,
      trialStartedAt: null,
      trialEndsAt: null,
      mercadopagoPreapprovalId: preapproval.id,
      mercadopagoPreapprovalStatus: preapproval.status,
      canceledAt: billingStatus === "subscription_cancelled" ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("[billing-return] failed to sync preapproval", error);
    redirect("/onboarding?plan=subscription&error=mercadopago-return");
  }

  const refreshedUser = await requireSignedInUser();
  const refreshedBilling = getBillingDataFromUser(refreshedUser);
  if (hasActiveAdminAccess(refreshedBilling)) {
    redirect(buildAdminPath(onboarding.brandSlug));
  }

  redirect("/onboarding?billing=required");
}
