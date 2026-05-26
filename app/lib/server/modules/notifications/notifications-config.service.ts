import { clerkClient } from "@clerk/nextjs/server";
import {
  getOwnerByBrandSlug,
  getRestaurantByBrandSlugAndRestaurantSlug,
} from "@/app/lib/server/modules/restaurants/restaurants.service";

type NotificationMetadata = {
  notificationsEnabled?: unknown;
  notificationsByRestaurant?: unknown;
};

type RestaurantNotificationContext = {
  restaurantId: string;
  authUserId: string;
};

function readBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
}

function readLegacyEnabled(metadata: NotificationMetadata): boolean {
  return typeof metadata.notificationsEnabled === "boolean" ? metadata.notificationsEnabled : false;
}

async function getUserPublicMetadata(authUserId: string): Promise<Record<string, unknown>> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(authUserId);
  return (user.publicMetadata ?? {}) as Record<string, unknown>;
}

async function resolveRestaurantContext(input: {
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}): Promise<RestaurantNotificationContext | null> {
  if (input.brandSlug && input.restaurantSlug) {
    const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
    if (!restaurant?.id || !restaurant.auth_user_id) {
      return null;
    }

    return {
      restaurantId: restaurant.id,
      authUserId: restaurant.auth_user_id,
    };
  }

  if (input.brandSlug) {
    const owner = await getOwnerByBrandSlug(input.brandSlug);
    if (!owner?.restaurant_id || !owner.auth_user_id) {
      return null;
    }

    return {
      restaurantId: owner.restaurant_id,
      authUserId: owner.auth_user_id,
    };
  }

  return null;
}

export async function getRestaurantNotificationsEnabled(input: {
  clerkUserId: string;
  brandSlug?: string | null;
  restaurantSlug?: string | null;
}): Promise<boolean> {
  const context = await resolveRestaurantContext(input);
  if (!context || context.authUserId !== input.clerkUserId) {
    return false;
  }

  const metadata = (await getUserPublicMetadata(input.clerkUserId)) as NotificationMetadata;
  const byRestaurant = readBooleanMap(metadata.notificationsByRestaurant);
  return byRestaurant[context.restaurantId] ?? readLegacyEnabled(metadata);
}

export async function setRestaurantNotificationsEnabled(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
  enabled: boolean;
}): Promise<boolean> {
  const context = await resolveRestaurantContext({
    brandSlug: input.brandSlug,
    restaurantSlug: input.restaurantSlug,
  });
  if (!context || context.authUserId !== input.clerkUserId) {
    throw new Error("No se encontro el local para guardar las notificaciones.");
  }

  const metadata = await getUserPublicMetadata(input.clerkUserId);
  const byRestaurant = readBooleanMap(metadata.notificationsByRestaurant);
  const clerk = await clerkClient();

  await clerk.users.updateUser(input.clerkUserId, {
    publicMetadata: {
      ...metadata,
      notificationsByRestaurant: {
        ...byRestaurant,
        [context.restaurantId]: input.enabled,
      },
    },
  });

  return input.enabled;
}

export async function shouldSendRestaurantNotification(input: {
  brandSlug: string;
  restaurantSlug?: string | null;
}): Promise<boolean> {
  const context = await resolveRestaurantContext(input);
  if (!context) {
    return false;
  }

  const metadata = (await getUserPublicMetadata(context.authUserId)) as NotificationMetadata;
  const byRestaurant = readBooleanMap(metadata.notificationsByRestaurant);
  return byRestaurant[context.restaurantId] ?? readLegacyEnabled(metadata);
}
