import { getOwnerAuthUserIdByBrandSlug } from "@/app/lib/server/modules/personal-data/personal-data.service";
import { getUsersMipropinaIdByClerkId } from "@/app/lib/server/modules/users/users.repository";
import {
  deleteEmployeeByAuthUserIdAndEmployeeId,
  insertEmployee,
  listEmployeesByAuthUserId,
  type EmployeeRow,
  updateEmployeeByAuthUserIdAndEmployeeId,
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

  const created = await insertEmployee({
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
  const rows = await listEmployeesByAuthUserId(clerkUserId);
  return rows.map(mapEmployeeRow);
}

export async function deleteEmployeeByClerkId(
  clerkUserId: string,
  employeeId: string,
): Promise<void> {
  await deleteEmployeeByAuthUserIdAndEmployeeId(clerkUserId, employeeId);
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
  const updated = await updateEmployeeByAuthUserIdAndEmployeeId({
    authUserId: input.clerkUserId,
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
  const ownerAuthUserId = await getOwnerAuthUserIdByBrandSlug(brandSlug);

  if (!ownerAuthUserId) {
    return [];
  }

  const rows = await listEmployeesByAuthUserId(ownerAuthUserId);
  return rows.map(mapEmployeeRow);
}
