"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { buildAdminPath, buildStorePath, slugifyBrand } from "../lib/brand";
import { upsertAppUser } from "@/app/lib/server/modules/users/users.service";
import { upsertAccountSnapshotByClerkId } from "@/app/lib/server/modules/account/account.service";
import {
  computeTrialWindow,
  createMercadoPagoSubscriptionCheckout,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";
import { validateOnboardingForm } from "../validations";

type BillingMode = "trial" | "subscription";

function parseBillingMode(value: FormDataEntryValue | null): BillingMode {
  return value === "subscription" ? "subscription" : "trial";
}

function parseTrialDays(value: FormDataEntryValue | null): number {
  const raw = typeof value === "string" ? Number(value) : NaN;
  if (raw === 14) {
    return 14;
  }
  return 7;
}

function getSubscriptionAmount(): number {
  const raw = process.env.MERCADOPAGO_SUBSCRIPTION_AMOUNT_ARS;
  if (!raw) {
    return 15000;
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid MERCADOPAGO_SUBSCRIPTION_AMOUNT_ARS");
  }

  return amount;
}

export async function submitOnboarding(formData: FormData): Promise<void> {
  const traceId = crypto.randomUUID();
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const billingMode = parseBillingMode(formData.get("billingMode"));
  const trialDays = parseTrialDays(formData.get("trialDays"));

  const validation = validateOnboardingForm({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    brandName: String(formData.get("brandName") ?? ""),
  });

  if (!validation.isValid) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=validation`);
  }

  const { firstName, lastName, phone, address, brandName } = validation.values;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const brandSlug = slugifyBrand(brandName);

  if (!brandSlug) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=brand-slug`);
  }

  const adminPath = buildAdminPath(brandSlug);
  const storePath = buildStorePath(brandSlug);
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const primaryEmail =
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  const baseMetadata = {
    onboardingComplete: true,
    firstName,
    lastName,
    fullName,
    phone,
    address,
    brandName,
    brandSlug,
    adminPath,
    storePath,
  };

  if (billingMode === "trial") {
    const trialWindow = computeTrialWindow(trialDays);
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...baseMetadata,
        billingMode: "trial",
        billingStatus: "trial_active",
        trialDays,
        trialStartedAt: trialWindow.startedAtIso,
        trialEndsAt: trialWindow.endsAtIso,
        mercadopagoPreapprovalId: null,
        mercadopagoPreapprovalStatus: null,
      },
    });

    await upsertAppUser({
      clerkUserId: userId,
      email: primaryEmail,
      firstName,
      lastName,
      fullName,
      phone,
      address,
      brandName,
      brandSlug,
      adminPath,
      storePath,
      onboardingComplete: true,
      debugTraceId: traceId,
      debugSource: "onboarding.submit.trial",
    });

    await upsertAccountSnapshotByClerkId({
      clerkUserId: userId,
      billingStatus: "trial_active",
      trialStartedAt: trialWindow.startedAtIso,
      trialEndsAt: trialWindow.endsAtIso,
      mercadopagoPreapprovalId: null,
      mercadopagoPreapprovalStatus: null,
      canceledAt: null,
    });

    redirect(adminPath);
  }

  if (!primaryEmail) {
    redirect(`/onboarding?plan=subscription&error=missing-email`);
  }

  let checkout: Awaited<ReturnType<typeof createMercadoPagoSubscriptionCheckout>>;
  try {
    checkout = await createMercadoPagoSubscriptionCheckout({
      clerkUserId: userId,
      payerEmail: primaryEmail,
      reason: `Suscripcion MiPropina - ${brandName}`,
      amount: getSubscriptionAmount(),
      currencyId: "ARS",
      brandSlug,
    });
  } catch (error) {
    console.error("[billing] failed to create Mercado Pago subscription checkout", error);
    redirect("/onboarding?plan=subscription&error=mercadopago");
  }

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...baseMetadata,
        billingMode: "subscription",
        billingStatus: "subscription_pending",
        trialDays: null,
        trialStartedAt: null,
        trialEndsAt: null,
        mercadopagoPreapprovalId: checkout.preapprovalId,
        mercadopagoPreapprovalStatus: checkout.status,
      },
    });

    await upsertAppUser({
      clerkUserId: userId,
      email: primaryEmail,
      firstName,
      lastName,
      fullName,
      phone,
      address,
      brandName,
      brandSlug,
      adminPath,
      storePath,
      onboardingComplete: true,
      debugTraceId: traceId,
      debugSource: "onboarding.submit.subscription",
    });

    await upsertAccountSnapshotByClerkId({
      clerkUserId: userId,
      billingStatus: "subscription_pending",
      trialStartedAt: null,
      trialEndsAt: null,
      mercadopagoPreapprovalId: checkout.preapprovalId,
      mercadopagoPreapprovalStatus: checkout.status,
      canceledAt: null,
    });
  } catch (error) {
    console.error("[billing] checkout created but persistence failed; continuing to Mercado Pago", {
      traceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  redirect(checkout.checkoutUrl);
}
