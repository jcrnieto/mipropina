import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { upsertAccountSnapshotByClerkId } from "@/app/lib/server/modules/account/account.service";
import { upsertAppUser } from "@/app/lib/server/modules/users/users.service";
import {
  type BillingStatus,
  type BillingSnapshot,
  hasActiveAdminAccess,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";

export type OnboardingData = {
  onboardingComplete: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  brandName?: string;
  brandSlug?: string;
  adminPath?: string;
  storePath?: string;
};

export type BillingData = BillingSnapshot;

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function readMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readMetadataNullableString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readMetadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function splitFullName(fullName?: string | null): { firstName?: string; lastName?: string } {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function getOnboardingDataFromUser(user: ClerkUser): OnboardingData {
  const metadata = user.publicMetadata as Record<string, unknown>;
  const metadataFirstName = readMetadataString(metadata, "firstName");
  const metadataLastName = readMetadataString(metadata, "lastName");
  const metadataFullName = readMetadataString(metadata, "fullName");
  const fallbackFromFullName = splitFullName(metadataFullName);

  return {
    onboardingComplete: metadata.onboardingComplete === true,
    firstName: metadataFirstName ?? fallbackFromFullName.firstName,
    lastName: metadataLastName ?? fallbackFromFullName.lastName,
    fullName: metadataFullName,
    phone: readMetadataString(metadata, "phone"),
    address: readMetadataString(metadata, "address"),
    brandName: readMetadataString(metadata, "brandName"),
    brandSlug: readMetadataString(metadata, "brandSlug"),
    adminPath: readMetadataString(metadata, "adminPath"),
    storePath: readMetadataString(metadata, "storePath"),
  };
}

export function getBillingDataFromUser(user: ClerkUser): BillingData {
  const metadata = user.publicMetadata as Record<string, unknown>;

  const modeRaw = readMetadataNullableString(metadata, "billingMode");
  const mode = modeRaw === "trial" || modeRaw === "subscription" ? modeRaw : null;

  const statusRaw = readMetadataNullableString(metadata, "billingStatus");
  const knownStatus: BillingStatus =
    statusRaw === "none" ||
    statusRaw === "trial_active" ||
    statusRaw === "trial_expired" ||
    statusRaw === "subscription_pending" ||
    statusRaw === "subscription_active" ||
    statusRaw === "subscription_paused" ||
    statusRaw === "subscription_cancelled"
      ? statusRaw
      : "none";

  const trialEndsAt = readMetadataNullableString(metadata, "trialEndsAt");
  let resolvedStatus = knownStatus;
  if (knownStatus === "trial_active" && trialEndsAt) {
    const endDate = new Date(trialEndsAt);
    if (Number.isFinite(endDate.getTime()) && endDate.getTime() <= Date.now()) {
      resolvedStatus = "trial_expired";
    }
  }

  return {
    mode,
    status: resolvedStatus,
    trialDays: readMetadataNumber(metadata, "trialDays"),
    trialStartedAt: readMetadataNullableString(metadata, "trialStartedAt"),
    trialEndsAt,
    mercadopagoPreapprovalId: readMetadataNullableString(metadata, "mercadopagoPreapprovalId"),
    mercadopagoPreapprovalStatus: readMetadataNullableString(metadata, "mercadopagoPreapprovalStatus"),
  };
}

export async function requireSignedInUser(): Promise<ClerkUser> {
  const traceId = crypto.randomUUID();
  const { userId } = await auth();
  console.log(`[onboarding-debug][${traceId}][auth.requireSignedInUser] auth resolved`, {
    hasUserId: Boolean(userId),
  });

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;

  const metadata = user.publicMetadata as Record<string, unknown>;
  const metadataFirstName = readMetadataString(metadata, "firstName") ?? null;
  const metadataLastName = readMetadataString(metadata, "lastName") ?? null;
  const metadataFullName = readMetadataString(metadata, "fullName") ?? null;
  const fallbackFromFullName = splitFullName(metadataFullName);
  const resolvedFirstName = metadataFirstName ?? fallbackFromFullName.firstName ?? null;
  const resolvedLastName = metadataLastName ?? fallbackFromFullName.lastName ?? null;
  const rebuiltFullName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(" ").trim();
  const resolvedFullName = metadataFullName ?? (rebuiltFullName || null);
  console.log(`[onboarding-debug][${traceId}][auth.requireSignedInUser] clerk user loaded`, {
    userId: user.id,
    primaryEmail,
    onboardingComplete: metadata.onboardingComplete === true,
  });

  await upsertAppUser({
    clerkUserId: user.id,
    email: primaryEmail,
    onboardingComplete: metadata.onboardingComplete === true,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    fullName: resolvedFullName,
    phone: readMetadataString(metadata, "phone") ?? null,
    address: readMetadataString(metadata, "address") ?? null,
    brandName: readMetadataString(metadata, "brandName") ?? null,
    brandSlug: readMetadataString(metadata, "brandSlug") ?? null,
    adminPath: readMetadataString(metadata, "adminPath") ?? null,
    storePath: readMetadataString(metadata, "storePath") ?? null,
    debugTraceId: traceId,
    debugSource: "auth.requireSignedInUser",
  });

  return user;
}

export async function requireOnboardedUser(): Promise<{
  user: ClerkUser;
  onboarding: OnboardingData;
  billing: BillingData;
}> {
  const user = await requireSignedInUser();
  const onboarding = getOnboardingDataFromUser(user);

  if (!onboarding.onboardingComplete || !onboarding.brandSlug) {
    redirect("/onboarding");
  }

  let billing = getBillingDataFromUser(user);
  if (billing.status === "trial_expired") {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        billingStatus: "trial_expired",
      },
    });

    await upsertAccountSnapshotByClerkId({
      clerkUserId: user.id,
      billingStatus: "trial_expired",
      trialStartedAt: billing.trialStartedAt,
      trialEndsAt: billing.trialEndsAt,
      mercadopagoPreapprovalId: billing.mercadopagoPreapprovalId,
      mercadopagoPreapprovalStatus: billing.mercadopagoPreapprovalStatus,
    });

    billing = {
      ...billing,
      status: "trial_expired",
    };
  }

  try {
    await upsertAccountSnapshotByClerkId({
      clerkUserId: user.id,
      billingStatus: billing.status,
      trialStartedAt: billing.trialStartedAt,
      trialEndsAt: billing.trialEndsAt,
      mercadopagoPreapprovalId: billing.mercadopagoPreapprovalId,
      mercadopagoPreapprovalStatus: billing.mercadopagoPreapprovalStatus,
    });
  } catch (error) {
    console.error("[account-sync] failed to upsert account snapshot from metadata", {
      clerkUserId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!hasActiveAdminAccess(billing)) {
    redirect("/onboarding?billing=required");
  }

  return { user, onboarding, billing };
}
