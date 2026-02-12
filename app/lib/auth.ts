import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { upsertAppUser } from "./supabase/admin";

export type OnboardingData = {
  onboardingComplete: boolean;
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

export function getOnboardingDataFromUser(user: ClerkUser): OnboardingData {
  const metadata = user.publicMetadata as Record<string, unknown>;

  return {
    onboardingComplete: metadata.onboardingComplete === true,
    fullName: readMetadataString(metadata, "fullName"),
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
    fullName: readMetadataString(metadata, "fullName") ?? null,
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
