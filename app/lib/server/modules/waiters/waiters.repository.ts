import { supabaseRestRequest } from "@/app/lib/server/supabase/client";

export type EmployeeRow = {
  id: string;
  name: string | null;
  last_name: string | null;
  dni: string | null;
  phone: string | null;
  mercadopago_link: string | null;
  image: string | null;
};

export type EmployeeInsertPayload = {
  user_id: string;
  auth_user_id: string;
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  mercadopago_link: string;
  image: string | null;
};

export type EmployeeUpdatePayload = {
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  mercadopago_link: string;
  image: string | null;
};

const EMPLOYEE_SELECT = "id,name,last_name,dni,phone,mercadopago_link,image";

export async function insertEmployee(payload: EmployeeInsertPayload): Promise<EmployeeRow> {
  const insertResponse = await supabaseRestRequest("/rest/v1/employee_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const insertedRows = (await insertResponse.json()) as EmployeeRow[];
  const insertedRow = insertedRows[0];
  if (!insertedRow) {
    throw new Error("Supabase did not return created employee");
  }

  return insertedRow;
}

export async function listEmployeesByAuthUserId(authUserId: string): Promise<EmployeeRow[]> {
  const encodedAuthId = encodeURIComponent(authUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/employee_mipropina?auth_user_id=eq.${encodedAuthId}&select=${EMPLOYEE_SELECT}&order=created_at.desc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  return (await response.json()) as EmployeeRow[];
}

export async function deleteEmployeeByAuthUserIdAndEmployeeId(
  authUserId: string,
  employeeId: string,
): Promise<void> {
  const encodedAuthId = encodeURIComponent(authUserId);
  const encodedEmployeeId = encodeURIComponent(employeeId);

  await supabaseRestRequest(
    `/rest/v1/employee_mipropina?id=eq.${encodedEmployeeId}&auth_user_id=eq.${encodedAuthId}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
  );
}

export async function updateEmployeeByAuthUserIdAndEmployeeId(input: {
  authUserId: string;
  employeeId: string;
  payload: EmployeeUpdatePayload;
}): Promise<EmployeeRow> {
  const encodedAuthId = encodeURIComponent(input.authUserId);
  const encodedEmployeeId = encodeURIComponent(input.employeeId);

  const response = await supabaseRestRequest(
    `/rest/v1/employee_mipropina?id=eq.${encodedEmployeeId}&auth_user_id=eq.${encodedAuthId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(input.payload),
    },
  );

  const rows = (await response.json()) as EmployeeRow[];
  const updatedRow = rows[0];
  if (!updatedRow) {
    throw new Error("Employee not found or not owned by current user");
  }

  return updatedRow;
}
