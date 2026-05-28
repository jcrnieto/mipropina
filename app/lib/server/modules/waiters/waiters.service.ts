import {
  getOwnerByBrandSlug,
  getRestaurantByBrandSlugAndRestaurantSlug,
  getPrimaryRestaurantByClerkId,
} from "@/app/lib/server/modules/restaurants/restaurants.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import {
  deleteEmployeeByRestaurantIdAndEmployeeId,
  getEmployeeByRestaurantIdAndEmployeeId,
  insertEmployee,
  listEmployeesByRestaurantId,
  type EmployeeRow,
  updateEmployeeByRestaurantIdAndEmployeeId,
} from "@/app/lib/server/modules/waiters/waiters.repository";

type WaiterResponseRow = {
  id: string;
  name: string | null;
  last_name: string | null;
  dni: string | null;
  phone: string | null;
  mercadopago_link: string | null;
  image: string | null;
};

function mapEmployeeRow(row: EmployeeRow): WaiterResponseRow {
  return {
    id: row.id,
    name: row.name,
    last_name: row.last_name,
    dni: row.dni,
    phone: row.phone,
    mercadopago_link: row.mercadopago_link,
    image: row.image,
  };
}

export async function createEmployeeByClerkId(input: {
  clerkUserId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
}): Promise<WaiterResponseRow> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot create employee without users_mipropina row");
  }
  const primaryRestaurant = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  if (!primaryRestaurant) {
    throw new Error("Cannot create employee without restaurant row");
  }

  const created = await insertEmployee({
    restaurant_id: primaryRestaurant.id,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: input.name,
    last_name: input.lastName,
    dni: input.dni,
    phone: input.phone,
    mercadopago_link: input.mercadopagoLink,
    image: input.image ?? null,
  });

  return mapEmployeeRow(created);
}

export async function createEmployeeByClerkIdAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
}): Promise<WaiterResponseRow> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot create employee without users_mipropina row");
  }

  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("Cannot create employee without restaurant row");
  }

  const created = await insertEmployee({
    restaurant_id: restaurant.id,
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: input.name,
    last_name: input.lastName,
    dni: input.dni,
    phone: input.phone,
    mercadopago_link: input.mercadopagoLink,
    image: input.image ?? null,
  });

  return mapEmployeeRow(created);
}

export async function listEmployeesByClerkId(clerkUserId: string): Promise<WaiterResponseRow[]> {
  const primaryRestaurant = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!primaryRestaurant) {
    return [];
  }

  const rows = await listEmployeesByRestaurantId(primaryRestaurant.id);
  return rows.map(mapEmployeeRow);
}

export async function listEmployeesByClerkIdAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
}): Promise<WaiterResponseRow[]> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    return [];
  }

  const rows = await listEmployeesByRestaurantId(restaurant.id);
  return rows.map(mapEmployeeRow);
}

export async function deleteEmployeeByClerkId(
  clerkUserId: string,
  employeeId: string,
): Promise<void> {
  const primaryRestaurant = await getPrimaryRestaurantByClerkId(clerkUserId);
  if (!primaryRestaurant) {
    throw new Error("Cannot delete employee without restaurant row");
  }

  await deleteEmployeeByRestaurantIdAndEmployeeId(primaryRestaurant.id, employeeId);
}

export async function deleteEmployeeByClerkIdAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
  employeeId: string;
}): Promise<void> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("Cannot delete employee without restaurant row");
  }

  await deleteEmployeeByRestaurantIdAndEmployeeId(restaurant.id, input.employeeId);
}

export async function updateEmployeeByClerkId(input: {
  clerkUserId: string;
  employeeId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
}): Promise<WaiterResponseRow> {
  const primaryRestaurant = await getPrimaryRestaurantByClerkId(input.clerkUserId);
  if (!primaryRestaurant) {
    throw new Error("Cannot update employee without restaurant row");
  }

  const updated = await updateEmployeeByRestaurantIdAndEmployeeId({
    restaurantId: primaryRestaurant.id,
    employeeId: input.employeeId,
    payload: {
      name: input.name,
      last_name: input.lastName,
      dni: input.dni,
      phone: input.phone,
      mercadopago_link: input.mercadopagoLink,
      image: input.image ?? null,
    },
  });

  return mapEmployeeRow(updated);
}

export async function updateEmployeeByClerkIdAndRestaurantSlug(input: {
  clerkUserId: string;
  brandSlug: string;
  restaurantSlug: string;
  employeeId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
}): Promise<WaiterResponseRow> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(input.brandSlug, input.restaurantSlug);
  if (!restaurant || restaurant.auth_user_id !== input.clerkUserId) {
    throw new Error("Cannot update employee without restaurant row");
  }

  const updated = await updateEmployeeByRestaurantIdAndEmployeeId({
    restaurantId: restaurant.id,
    employeeId: input.employeeId,
    payload: {
      name: input.name,
      last_name: input.lastName,
      dni: input.dni,
      phone: input.phone,
      mercadopago_link: input.mercadopagoLink,
      image: input.image ?? null,
    },
  });

  return mapEmployeeRow(updated);
}

export async function listEmployeesByBrandSlug(brandSlug: string): Promise<WaiterResponseRow[]> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  if (!owner?.restaurant_id) {
    return [];
  }

  const rows = await listEmployeesByRestaurantId(owner.restaurant_id);
  return rows.map(mapEmployeeRow);
}

export async function getEmployeeByBrandSlugAndId(
  brandSlug: string,
  employeeId: string,
): Promise<WaiterResponseRow | null> {
  const owner = await getOwnerByBrandSlug(brandSlug);
  if (!owner?.restaurant_id) {
    return null;
  }

  const row = await getEmployeeByRestaurantIdAndEmployeeId(owner.restaurant_id, employeeId);
  return row ? mapEmployeeRow(row) : null;
}

export async function listEmployeesByBrandAndRestaurantSlug(
  brandSlug: string,
  restaurantSlug: string,
): Promise<WaiterResponseRow[]> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(brandSlug, restaurantSlug);
  if (!restaurant) {
    return [];
  }

  const rows = await listEmployeesByRestaurantId(restaurant.id);
  return rows.map(mapEmployeeRow);
}

export async function getEmployeeByBrandAndRestaurantSlugAndId(
  brandSlug: string,
  restaurantSlug: string,
  employeeId: string,
): Promise<WaiterResponseRow | null> {
  const restaurant = await getRestaurantByBrandSlugAndRestaurantSlug(brandSlug, restaurantSlug);
  if (!restaurant) {
    return null;
  }

  const row = await getEmployeeByRestaurantIdAndEmployeeId(restaurant.id, employeeId);
  return row ? mapEmployeeRow(row) : null;
}
