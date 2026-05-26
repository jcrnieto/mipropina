import {
  deleteUsersMipropinaByClerkId,
  upsertUsersMipropinaByClerkId,
} from "@/app/lib/server/modules/users/users.repository";

export type UpsertAppUserInput = {
  clerkUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  onboardingComplete?: boolean;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  adminPath?: string | null;
  storePath?: string | null;
  debugTraceId?: string;
  debugSource?: string;
};

function debugLog(input: UpsertAppUserInput, step: string, payload?: unknown) {
  const traceId = input.debugTraceId ?? "no-trace";
  const source = input.debugSource ?? "unknown-source";
  if (payload === undefined) {
    console.log(`[onboarding-debug][${traceId}][${source}] ${step}`);
    return;
  }

  console.log(`[onboarding-debug][${traceId}][${source}] ${step}`, payload);
}

function resolvePersonalNameParts(input: UpsertAppUserInput): {
  firstName: string | null;
  lastName: string | null;
} {
  const normalizedFirstName = input.firstName?.trim() || null;
  const normalizedLastName = input.lastName?.trim() || null;

  if (normalizedFirstName || normalizedLastName) {
    return {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    };
  }

  const normalizedFullName = input.fullName?.trim() || "";
  if (!normalizedFullName) {
    return { firstName: null, lastName: null };
  }

  const parts = normalizedFullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function upsertAppUser(input: UpsertAppUserInput): Promise<string> {
  const payload = {
    email: input.email ?? null,
    profile_completed: input.onboardingComplete ?? false,
    last_login: new Date().toISOString(),
  };

  debugLog(input, "users_mipropina payload", payload);

  const usersMipropinaId = await upsertUsersMipropinaByClerkId({
    clerkUserId: input.clerkUserId,
    payload,
  });

  const { firstName, lastName } = resolvePersonalNameParts(input);
  debugLog(input, "users_mipropina synced", {
    usersMipropinaId,
    onboardingComplete: input.onboardingComplete ?? false,
    hasFirstName: Boolean(firstName),
    hasLastName: Boolean(lastName),
    hasBrandName: Boolean(input.brandName?.trim()),
  });
  return usersMipropinaId;
}

export async function deleteAppUserByClerkId(clerkUserId: string): Promise<void> {
  await deleteUsersMipropinaByClerkId(clerkUserId);
}
