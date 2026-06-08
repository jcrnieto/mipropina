import {
  listPlatformAccounts,
  listPlatformBrands,
  listPlatformRestaurants,
  listPlatformUsers,
  type PlatformAccountRow,
} from "@/app/lib/server/modules/platform-dashboard/platform-dashboard.repository";

export type PlatformAccountStatus =
  | "trial_active"
  | "trial_expired"
  | "subscription_active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "not_started";

export type PlatformDashboardAccount = {
  userId: string;
  clerkUserId: string;
  email: string | null;
  profileCompleted: boolean;
  lastLogin: string | null;
  brandId: string | null;
  brandName: string | null;
  brandSlug: string | null;
  brandCreatedAt: string | null;
  onboardingCompleted: boolean;
  status: PlatformAccountStatus;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  restaurants: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }[];
};

export type PlatformDashboardData = {
  generatedAt: string;
  metrics: {
    registeredUsers: number;
    trialActive: number;
    trialExpired: number;
    subscriptionActive: number;
    pastDue: number;
    canceled: number;
    incomplete: number;
    notStarted: number;
    totalBrands: number;
    totalRestaurants: number;
  };
  accounts: PlatformDashboardAccount[];
};

function resolveAccountStatus(
  account: PlatformAccountRow | undefined,
  now: Date,
): PlatformAccountStatus {
  if (!account) return "not_started";

  if (account.status === "trial_active") {
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    if (trialEnd && Number.isFinite(trialEnd.getTime()) && trialEnd.getTime() <= now.getTime()) {
      return "trial_expired";
    }
    return "trial_active";
  }

  if (account.status === "active") return "subscription_active";
  return account.status;
}

export async function getPlatformDashboardData(): Promise<PlatformDashboardData> {
  const [users, brands, restaurants, billingAccounts] = await Promise.all([
    listPlatformUsers(),
    listPlatformBrands(),
    listPlatformRestaurants(),
    listPlatformAccounts(),
  ]);
  const now = new Date();

  const brandByOwnerAuthId = new Map(brands.map((brand) => [brand.owner_auth_user_id, brand]));
  const accountByAuthId = new Map(billingAccounts.map((account) => [account.auth_user_id, account]));

  const accounts = users.map<PlatformDashboardAccount>((user) => {
    const brand = brandByOwnerAuthId.get(user.auth_user_id);
    const billingAccount =
      (brand ? billingAccounts.find((account) => account.brand_id === brand.id) : undefined) ??
      accountByAuthId.get(user.auth_user_id);
    const ownedRestaurants = restaurants
      .filter(
        (restaurant) =>
          (brand && restaurant.brand_id === brand.id) ||
          (!restaurant.brand_id && restaurant.auth_user_id === user.auth_user_id),
      )
      .map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.branch_name?.trim() || restaurant.brand_name?.trim() || restaurant.slug,
        slug: restaurant.slug,
        isActive: restaurant.is_active,
      }));

    return {
      userId: user.id,
      clerkUserId: user.auth_user_id,
      email: user.email,
      profileCompleted: user.profile_completed,
      lastLogin: user.last_login,
      brandId: brand?.id ?? null,
      brandName: brand?.name ?? null,
      brandSlug: brand?.slug ?? null,
      brandCreatedAt: brand?.created_at ?? null,
      onboardingCompleted: brand?.onboarding_completed ?? false,
      status: resolveAccountStatus(billingAccount, now),
      trialEndsAt: billingAccount?.trial_end ?? null,
      nextBillingAt: billingAccount?.next_billing_at ?? billingAccount?.current_period_end ?? null,
      restaurants: ownedRestaurants,
    };
  });

  accounts.sort((left, right) => {
    const leftDate = left.brandCreatedAt ?? left.lastLogin ?? "";
    const rightDate = right.brandCreatedAt ?? right.lastLogin ?? "";
    return rightDate.localeCompare(leftDate);
  });

  const countStatus = (status: PlatformAccountStatus) =>
    accounts.filter((account) => account.status === status).length;

  return {
    generatedAt: now.toISOString(),
    metrics: {
      registeredUsers: users.length,
      trialActive: countStatus("trial_active"),
      trialExpired: countStatus("trial_expired"),
      subscriptionActive: countStatus("subscription_active"),
      pastDue: countStatus("past_due"),
      canceled: countStatus("canceled"),
      incomplete: countStatus("incomplete"),
      notStarted: countStatus("not_started"),
      totalBrands: brands.length,
      totalRestaurants: restaurants.length,
    },
    accounts,
  };
}
