"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { buildAdminPath, buildStorePath, slugifyBrand } from "../lib/brand";
import { upsertAppUser } from "../lib/supabase/admin";

export async function submitOnboarding(formData: FormData): Promise<void> {
  const traceId = crypto.randomUUID();
  const { userId } = await auth();
  // console.log(`[onboarding-debug][${traceId}][onboarding.submit] submit started`, {
  //   hasUserId: Boolean(userId),
  // });

  if (!userId) {
    // console.log(`[onboarding-debug][${traceId}][onboarding.submit] user not signed in`);
    redirect("/sign-in");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const brandSlug = slugifyBrand(brandName);
  // console.log(`[onboarding-debug][${traceId}][onboarding.submit] form payload`, {
  //   fullName,
  //   phone,
  //   address,
  //   brandName,
  //   brandSlug,
  // });

  if (!fullName || !phone || !address || !brandName || !brandSlug) {
    // console.log(`[onboarding-debug][${traceId}][onboarding.submit] validation failed`);
    return;
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
  console.log(`[onboarding-debug][${traceId}][onboarding.submit] clerk user resolved`, {
    userId,
    primaryEmail,
  });

  const publicMetadataPayload = {
    onboardingComplete: true,
    fullName,
    phone,
    address,
    brandName,
    brandSlug,
    adminPath,
    storePath,
  };
  console.log(`[onboarding-debug][${traceId}][onboarding.submit] updating clerk metadata`, {
    userId,
    publicMetadataPayload,
  });
  await client.users.updateUserMetadata(userId, {
    publicMetadata: publicMetadataPayload,
  });

  console.log(`[onboarding-debug][${traceId}][onboarding.submit] upserting supabase`, {
    userId,
    primaryEmail,
  });
  await upsertAppUser({
    clerkUserId: userId,
    email: primaryEmail,
    fullName,
    phone,
    address,
    brandName,
    brandSlug,
    adminPath,
    storePath,
    onboardingComplete: true,
    debugTraceId: traceId,
    debugSource: "onboarding.submit",
  });

  // console.log(`[onboarding-debug][${traceId}][onboarding.submit] redirecting`, { adminPath });
  redirect(adminPath);
}
