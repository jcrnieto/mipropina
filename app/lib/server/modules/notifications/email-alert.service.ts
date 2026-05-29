import { clerkClient } from "@clerk/nextjs/server";
import { sendLowRatingAlertEmail } from "@/app/api/mail/service";

type LowRatingEmailInput = {
  ownerAuthUserId: string;
  brandName: string;
  brandSlug: string;
  restaurantSlug?: string | null;
  branchName?: string | null;
  averageStars: number;
  lowestStars: number;
  comment?: string | null;
};

function readEnvString(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getAppBaseUrl(): string | null {
  const raw =
    readEnvString("NEXT_PUBLIC_APP_URL") ??
    readEnvString("VERCEL_PROJECT_PRODUCTION_URL") ??
    readEnvString("VERCEL_URL");
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

function buildAdminUrl(input: LowRatingEmailInput): string | null {
  const baseUrl = getAppBaseUrl();
  if (!baseUrl) return null;

  const path = input.restaurantSlug
    ? `/admin/${input.brandSlug}/${input.restaurantSlug}#analytics`
    : `/admin/${input.brandSlug}#analytics`;

  return `${baseUrl}${path}`;
}

function getPrimaryEmail(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>): string | null {
  return (
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}

function getDisplayName(user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || "Satix";
}

export async function sendLowRatingEmailAlert(input: LowRatingEmailInput): Promise<void> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(input.ownerAuthUserId);
  const email = getPrimaryEmail(user);
  if (!email) {
    throw new Error(`Owner ${input.ownerAuthUserId} does not have a primary email.`);
  }

  await sendLowRatingAlertEmail({
    email,
    name: getDisplayName(user),
    brandName: input.brandName,
    branchName: input.branchName,
    adminUrl: buildAdminUrl(input),
    averageStars: input.averageStars,
    lowestStars: input.lowestStars,
    comment: input.comment,
  });
}
