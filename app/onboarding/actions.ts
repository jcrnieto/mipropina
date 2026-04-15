"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { upsertAppUser } from "@/app/lib/server/modules/users/users.service";
import { upsertBrandByClerkId } from "@/app/lib/server/modules/brands/brands.service";
import { upsertAccountSnapshotByBrandId } from "@/app/lib/server/modules/account/account.service";
import { upsertOnboardingRestaurantByClerkId } from "@/app/lib/server/modules/restaurants/restaurants.service";
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
    brandName: String(formData.get("brandName") ?? ""),
    brandSlug: String(formData.get("brandSlug") ?? ""),
    restaurantName: String(formData.get("restaurantName") ?? ""),
    restaurantSlug: String(formData.get("restaurantSlug") ?? ""),
  });

  if (!validation.isValid) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=validation`);
  }

  const { brandName, brandSlug, restaurantName, restaurantSlug } = validation.values;
  if (!brandSlug || !restaurantSlug) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=brand-slug`);
  }

  const adminPath = "/admin";
  const storePath = `/${restaurantSlug}`;
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const primaryEmail =
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  const baseMetadata = {
    onboardingComplete: true,
    brandName,
    brandSlug: restaurantSlug,
    brandAccountSlug: brandSlug,
    restaurantName,
    adminPath,
    storePath,
  };

  await upsertAppUser({
    clerkUserId: userId,
    email: primaryEmail,
    brandName,
    brandSlug: restaurantSlug,
    adminPath,
    storePath,
    onboardingComplete: true,
    debugTraceId: traceId,
    debugSource: "onboarding.submit.base",
  });

  let brandId: string;
  try {
    const brand = await upsertBrandByClerkId({
      clerkUserId: userId,
      name: brandName,
      slug: brandSlug,
      adminPath,
      publicPath: null,
      onboardingCompleted: true,
    });

    brandId = brand.id;
    await upsertOnboardingRestaurantByClerkId({
      clerkUserId: userId,
      brandId,
      brandName,
      branchName: restaurantName,
      slug: restaurantSlug,
    });
  } catch (error) {
    console.error("[onboarding] failed to persist brand/restaurant", error);
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=brand-slug`);
  }

  if (billingMode === "trial") {
    const trialWindow = computeTrialWindow(trialDays);
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...baseMetadata,
        brandId,
        billingMode: "trial",
        billingStatus: "trial_active",
        trialDays,
        trialStartedAt: trialWindow.startedAtIso,
        trialEndsAt: trialWindow.endsAtIso,
        mercadopagoPreapprovalId: null,
        mercadopagoPreapprovalStatus: null,
      },
    });

    await upsertAccountSnapshotByBrandId({
      brandId,
      clerkUserId: userId,
      billingStatus: "trial_active",
      trialStartedAt: trialWindow.startedAtIso,
      trialEndsAt: trialWindow.endsAtIso,
      mercadopagoPreapprovalId: null,
      mercadopagoPreapprovalStatus: null,
      canceledAt: null,
    });

    redirect("/admin");
  }

  if (!primaryEmail) {
    redirect(`/onboarding?plan=subscription&error=missing-email`);
  }

  let checkout: Awaited<ReturnType<typeof createMercadoPagoSubscriptionCheckout>>;
  try {
    checkout = await createMercadoPagoSubscriptionCheckout({
      brandId,
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
        brandId,
        billingMode: "subscription",
        billingStatus: "subscription_pending",
        trialDays: null,
        trialStartedAt: null,
        trialEndsAt: null,
        mercadopagoPreapprovalId: checkout.preapprovalId,
        mercadopagoPreapprovalStatus: checkout.status,
      },
    });
    await upsertAccountSnapshotByBrandId({
      brandId,
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
