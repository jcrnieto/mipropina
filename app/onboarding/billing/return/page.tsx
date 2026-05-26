import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { upsertAccountSnapshotByBrandId } from "@/app/lib/server/modules/account/account.service";
import {
  getBillingDataForBrand,
  resolveOnboardingDataForUser,
  requireSignedInUser,
} from "@/app/lib/auth";
import {
  getMercadoPagoPreapprovalById,
  hasActiveAdminAccess,
  readBrandIdFromExternalReference,
  resolveBillingStatusFromPreapprovalStatus,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";

type ReturnPageProps = {
  searchParams: Promise<{
    preapproval_id?: string;
  }>;
};

export default async function BillingReturnPage({ searchParams }: ReturnPageProps) {
  const query = await searchParams;
  const returnPath = query.preapproval_id
    ? `/onboarding/billing/return?preapproval_id=${encodeURIComponent(query.preapproval_id)}`
    : "/onboarding/billing/return";
  const user = await requireSignedInUser(returnPath);
  const onboarding = await resolveOnboardingDataForUser(user);
  const billing = await getBillingDataForBrand(onboarding.brandId, user.id);
  const preapprovalId = query.preapproval_id ?? billing.mercadopagoPreapprovalId ?? undefined;

  if (!onboarding.brandId) {
    redirect("/onboarding?error=missing-brand");
  }

  if (!preapprovalId) {
    redirect("/onboarding?plan=subscription&error=missing-preapproval");
  }

  try {
    const preapproval = await getMercadoPagoPreapprovalById(preapprovalId);
    const externalBrandId = readBrandIdFromExternalReference(preapproval.externalReference);

    if (!externalBrandId || externalBrandId !== onboarding.brandId) {
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

    await upsertAccountSnapshotByBrandId({
      brandId: onboarding.brandId,
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
  const refreshedOnboarding = await resolveOnboardingDataForUser(refreshedUser);
  const refreshedBilling = await getBillingDataForBrand(refreshedOnboarding.brandId, refreshedUser.id);
  if (hasActiveAdminAccess(refreshedBilling)) {
    redirect(refreshedOnboarding.adminPath ?? "/admin");
  }

  redirect("/onboarding?billing=required");
}
