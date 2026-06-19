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
  getSubscriptionUnitAmount,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";
import { sendSubscriptionPendingEmail, sendTrialWelcomeEmail } from "@/app/api/mail/service";
import { validateOnboardingForm } from "../validations";
import { slugifyBrand } from "@/app/lib/brand";

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

export async function submitOnboarding(formData: FormData): Promise<void> {
  const traceId = crypto.randomUUID();
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const billingMode = parseBillingMode(formData.get("billingMode"));
  const trialDays = parseTrialDays(formData.get("trialDays"));

  const rawBrandName = String(formData.get("brandName") ?? "").trim();
  const rawRestaurantName = String(formData.get("restaurantName") ?? "").trim();
  const derivedBrandSlug = slugifyBrand(rawBrandName);
  const derivedRestaurantSlug = slugifyBrand(rawRestaurantName);

  // Debug log to help identify why a slug might be empty in development
  try {
    console.log("[onboarding-debug] derivedSlugs", {
      rawBrandName,
      derivedBrandSlug,
      rawRestaurantName,
      derivedRestaurantSlug,
    });
  } catch {
    /* ignore */
  }

  // Fallback: if slugify produced an empty slug, build a permissive fallback
  const safeBrandSlug =
    derivedBrandSlug && derivedBrandSlug.length >= 2
      ? derivedBrandSlug
      : rawBrandName
          .toLowerCase()
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `marca-${Date.now().toString(36)}`;

  const safeRestaurantSlug =
    derivedRestaurantSlug && derivedRestaurantSlug.length >= 2
      ? derivedRestaurantSlug
      : rawRestaurantName
          .toLowerCase()
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `local-${Date.now().toString(36)}`;

  const validation = validateOnboardingForm({
    brandName: rawBrandName,
    brandSlug: safeBrandSlug,
    restaurantName: rawRestaurantName,
    restaurantSlug: safeRestaurantSlug,
  });

  if (!validation.isValid) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=validation`);
  }

  const { brandName, brandSlug, restaurantName, restaurantSlug } = validation.values;
  if (!brandSlug || !restaurantSlug) {
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=brand-slug`);
  }

  const adminPath = `/admin/${brandSlug}`;
  const storePath = `/${brandSlug}/${restaurantSlug}`;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId as string);
  const primaryEmail =
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const recipientName = clerkUser.firstName || clerkUser.lastName || clerkUser.username || "Contacto Satix";

  const baseMetadata = {
    onboardingComplete: true,
    brandName,
    brandSlug,
    brandAccountSlug: brandSlug,
    restaurantName,
    adminPath,
    storePath,
  };

  const usersMipropinaId = await upsertAppUser({
    clerkUserId: userId as string,
    email: primaryEmail,
    brandName,
    brandSlug,
    adminPath,
    storePath,
    onboardingComplete: true,
    debugTraceId: traceId,
    debugSource: "onboarding.submit.base",
  });

  let brandId: string;
  try {
    const brand = await upsertBrandByClerkId({
      clerkUserId: userId as string,
      name: brandName,
      slug: brandSlug,
      adminPath,
      publicPath: brandSlug,
      onboardingCompleted: true,
    });

    brandId = brand.id;
    console.log("[onboarding] Brand created successfully", { brandId, brandSlug, traceId });
    
    const restaurantInput = {
      clerkUserId: userId as string,
      ...baseMetadata,
      brandId,
      brandName,
      branchName: restaurantName,
      slug: restaurantSlug,
      usersMipropinaId,
    };
    console.log("[onboarding] About to call upsertOnboardingRestaurantByClerkId", { 
      input: restaurantInput,
      traceId 
    });
    
    await upsertOnboardingRestaurantByClerkId(restaurantInput);
    console.log("[onboarding] Restaurant created successfully", { 
      restaurantSlug, 
      brandId, 
      traceId 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "no stack";
    console.error("[onboarding] failed to persist brand/restaurant", {
      error: errorMessage,
      stack: errorStack,
      traceId,
      brandSlug,
      restaurantSlug,
    });
    const reason = /Ya existe una marca/i.test(errorMessage)
      ? "brand-taken"
      : /Ya existe un local|Ya existe un restaurante|restaurants_mipropina|restaurant/i.test(errorMessage)
        ? "restaurant-taken"
        : "brand-slug";
    redirect(`/onboarding?plan=${billingMode}&trialDays=${trialDays}&error=${reason}`);
  }

  if (billingMode === "trial") {
    const trialWindow = computeTrialWindow(trialDays);
    await client.users.updateUserMetadata(userId as string, {
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
      clerkUserId: userId as string,
      billingStatus: "trial_active",
      trialStartedAt: trialWindow.startedAtIso,
      trialEndsAt: trialWindow.endsAtIso,
      mercadopagoPreapprovalId: null,
      mercadopagoPreapprovalStatus: null,
      canceledAt: null,
    });

    if (primaryEmail) {
      try {
        await sendTrialWelcomeEmail({
          email: primaryEmail,
          name: recipientName,
          brandName,
          trialDays,
          trialEndsAt: trialWindow.endsAtIso,
        });
      } catch (error) {
        console.error("[email] failed to send trial welcome email", error);
      }
    }

    redirect(adminPath);
  }

  if (!primaryEmail) {
    redirect(`/onboarding?plan=subscription&error=missing-email`);
  }

  let checkout: Awaited<ReturnType<typeof createMercadoPagoSubscriptionCheckout>>;
  try {
    checkout = await createMercadoPagoSubscriptionCheckout({
      brandId,
      payerEmail: primaryEmail as string,
      reason: `Suscripcion Satix - ${brandName}`,
      amount: getSubscriptionUnitAmount(),
      currencyId: "ARS",
      brandSlug,
    });
  } catch (error) {
    console.error("[billing] failed to create Mercado Pago subscription checkout", error);
    redirect("/onboarding?plan=subscription&error=mercadopago");
  }

  try {
    await client.users.updateUserMetadata(userId as string, {
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
      clerkUserId: userId as string,
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

  if (primaryEmail) {
    try {
      await sendSubscriptionPendingEmail({
        email: primaryEmail,
        name: recipientName,
        brandName,
      });
    } catch (error) {
      console.error("[email] failed to send subscription pending email", error);
    }
  }

  redirect(checkout.checkoutUrl);
}
