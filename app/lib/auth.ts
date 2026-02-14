import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { upsertAppUser } from "./supabase/admin";

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

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function readMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
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

  // Ensure a base row exists in Supabase as soon as the user is authenticated.
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
}> {
  const user = await requireSignedInUser();
  const onboarding = getOnboardingDataFromUser(user);

  if (!onboarding.onboardingComplete || !onboarding.brandSlug) {
    redirect("/onboarding");
  }

  return { user, onboarding };
}
