type UpsertAppUserInput = {
  clerkUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  onboardingComplete?: boolean;
  phone?: string | null;
  address?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  adminPath?: string | null;
  storePath?: string | null;
  debugTraceId?: string;
  debugSource?: string;
};

type SetPersonalDataImageInput = {
  clerkUserId: string;
  imageUrl: string;
  brandName?: string | null;
  adminPath?: string | null;
  storePath?: string | null;
  debugTraceId?: string;
  debugSource?: string;
};

type CreateEmployeeInput = {
  clerkUserId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
};

function getSupabaseAdminEnv() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

async function supabaseRestRequest(path: string, init: RequestInit): Promise<Response> {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorText}`);
  }

  return response;
}

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

async function upsertPersonalDataMipropina(
  input: UpsertAppUserInput,
  usersMipropinaId: string,
): Promise<void> {
  const encodedAuthId = encodeURIComponent(input.clerkUserId);
  const { firstName, lastName } = resolvePersonalNameParts(input);
  const payload = {
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: firstName,
    last_name: lastName,
    phone: input.phone ?? null,
    address: input.address ?? null,
    city: null,
    brand_name: input.brandName ?? null,
    public_url: input.storePath ?? null,
    admin_url: input.adminPath ?? null,
  };

  debugLog(input, "personal_data_mipropina payload", payload);

  const updateResponse = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?auth_user_id=eq.${encodedAuthId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  const updatedRows = (await updateResponse.json()) as Array<{ id: string }>;
  debugLog(input, "personal_data_mipropina patch result", { updatedRowsCount: updatedRows.length });

  if (updatedRows.length > 0) {
    return;
  }

  const insertResponse = await supabaseRestRequest("/rest/v1/personal_data_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const insertedRows = (await insertResponse.json()) as Array<{ id: string }>;
  debugLog(input, "personal_data_mipropina insert result", {
    insertedRowsCount: insertedRows.length,
    insertedRowId: insertedRows[0]?.id ?? null,
  });
}

export async function upsertAppUser(input: UpsertAppUserInput): Promise<void> {
  const encodedId = encodeURIComponent(input.clerkUserId);
  const payload = {
    email: input.email ?? null,
    profile_completed: input.onboardingComplete ?? false,
    last_login: new Date().toISOString(),
  };

  debugLog(input, "users_mipropina payload", payload);

  // First try to update existing row by Clerk id.
  const updateResponse = await supabaseRestRequest(
    `/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  const updatedRows = (await updateResponse.json()) as Array<{ id: string }>;
  debugLog(input, "users_mipropina patch result", {
    updatedRowsCount: updatedRows.length,
    updatedRowId: updatedRows[0]?.id ?? null,
  });

  let usersMipropinaId = updatedRows[0]?.id;

  if (!usersMipropinaId) {
    // If no row exists yet, insert it.
    const insertResponse = await supabaseRestRequest("/rest/v1/users_mipropina", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify([
        {
          auth_user_id: input.clerkUserId,
          ...payload,
        },
      ]),
    });

    const insertedRows = (await insertResponse.json()) as Array<{ id: string }>;
    usersMipropinaId = insertedRows[0]?.id;

    debugLog(input, "users_mipropina insert result", {
      insertedRowsCount: insertedRows.length,
      insertedRowId: usersMipropinaId ?? null,
    });
  }

  if (!usersMipropinaId) {
    throw new Error("Could not resolve users_mipropina.id for personal data upsert");
  }

  const { firstName, lastName } = resolvePersonalNameParts(input);
  const shouldUpsertPersonalData =
    input.onboardingComplete === true &&
    Boolean(firstName) &&
    Boolean(lastName) &&
    Boolean(input.phone?.trim()) &&
    Boolean(input.address?.trim()) &&
    Boolean(input.brandName?.trim());

  debugLog(input, "personal_data_mipropina decision", {
    shouldUpsertPersonalData,
    onboardingComplete: input.onboardingComplete ?? false,
    hasFirstName: Boolean(firstName),
    hasLastName: Boolean(lastName),
    hasPhone: Boolean(input.phone?.trim()),
    hasAddress: Boolean(input.address?.trim()),
    hasBrandName: Boolean(input.brandName?.trim()),
  });

  if (shouldUpsertPersonalData) {
    await upsertPersonalDataMipropina(input, usersMipropinaId);
  }
}

export async function deleteAppUserByClerkId(clerkUserId: string): Promise<void> {
  const encodedId = encodeURIComponent(clerkUserId);

  await supabaseRestRequest(`/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });
}

async function getUsersMipropinaIdByClerkId(clerkUserId: string): Promise<string | null> {
  const encodedId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/users_mipropina?auth_user_id=eq.${encodedId}&select=id`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

export async function createEmployeeByClerkId(input: CreateEmployeeInput): Promise<{
  id: string;
  name: string | null;
  last_name: string | null;
  dni: string | null;
  phone: string | null;
  mercadopago_link: string | null;
  image: string | null;
}> {
  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot create employee without users_mipropina row");
  }

  const payload = {
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: input.name,
    last_name: input.lastName,
    dni: input.dni,
    phone: input.phone,
    mercadopago_link: input.mercadopagoLink,
    image: input.image ?? null,
  };

  const insertResponse = await supabaseRestRequest("/rest/v1/employee_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([payload]),
  });

  const insertedRows = (await insertResponse.json()) as Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>;

  const insertedRow = insertedRows[0];
  if (!insertedRow) {
    throw new Error("Supabase did not return created employee");
  }

  return insertedRow;
}

export async function listEmployeesByClerkId(clerkUserId: string): Promise<
  Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>
> {
  const encodedAuthId = encodeURIComponent(clerkUserId);
  const response = await supabaseRestRequest(
    `/rest/v1/employee_mipropina?auth_user_id=eq.${encodedAuthId}&select=id,name,last_name,dni,phone,mercadopago_link,image&order=created_at.desc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>;

  return rows;
}

export async function deleteEmployeeByClerkId(
  clerkUserId: string,
  employeeId: string,
): Promise<void> {
  const encodedAuthId = encodeURIComponent(clerkUserId);
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

export async function updateEmployeeByClerkId(input: {
  clerkUserId: string;
  employeeId: string;
  name: string;
  lastName: string;
  dni: string;
  phone: string;
  mercadopagoLink: string;
  image?: string | null;
}): Promise<{
  id: string;
  name: string | null;
  last_name: string | null;
  dni: string | null;
  phone: string | null;
  mercadopago_link: string | null;
  image: string | null;
}> {
  const encodedAuthId = encodeURIComponent(input.clerkUserId);
  const encodedEmployeeId = encodeURIComponent(input.employeeId);
  const payload = {
    name: input.name,
    last_name: input.lastName,
    dni: input.dni,
    phone: input.phone,
    mercadopago_link: input.mercadopagoLink,
    image: input.image ?? null,
  };

  const response = await supabaseRestRequest(
    `/rest/v1/employee_mipropina?id=eq.${encodedEmployeeId}&auth_user_id=eq.${encodedAuthId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    },
  );

  const rows = (await response.json()) as Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>;

  const updatedRow = rows[0];
  if (!updatedRow) {
    throw new Error("Employee not found or not owned by current user");
  }

  return updatedRow;
}

export async function listEmployeesByBrandSlug(brandSlug: string): Promise<
  Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>
> {
  const publicUrl = `/${brandSlug}`;
  const encodedPublicUrl = encodeURIComponent(publicUrl);

  const ownerResponse = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?public_url=eq.${encodedPublicUrl}&select=auth_user_id&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const ownerRows = (await ownerResponse.json()) as Array<{ auth_user_id: string | null }>;
  const ownerAuthUserId = ownerRows[0]?.auth_user_id;

  if (!ownerAuthUserId) {
    return [];
  }

  const encodedOwnerAuthUserId = encodeURIComponent(ownerAuthUserId);
  const employeesResponse = await supabaseRestRequest(
    `/rest/v1/employee_mipropina?auth_user_id=eq.${encodedOwnerAuthUserId}&select=id,name,last_name,dni,phone,mercadopago_link,image&order=created_at.desc`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const employees = (await employeesResponse.json()) as Array<{
    id: string;
    name: string | null;
    last_name: string | null;
    dni: string | null;
    phone: string | null;
    mercadopago_link: string | null;
    image: string | null;
  }>;

  return employees;
}

export async function getPublicStoreInfoByBrandSlug(brandSlug: string): Promise<{
  brand_name: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
} | null> {
  const publicUrl = `/${brandSlug}`;
  const encodedPublicUrl = encodeURIComponent(publicUrl);

  const response = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?public_url=eq.${encodedPublicUrl}&select=brand_name,phone,address,image&limit=1`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    },
  );

  const rows = (await response.json()) as Array<{
    brand_name: string | null;
    phone: string | null;
    address: string | null;
    image: string | null;
  }>;

  return rows[0] ?? null;
}

export async function setPersonalDataImageByClerkId(
  input: SetPersonalDataImageInput,
): Promise<void> {
  const traceInput: UpsertAppUserInput = {
    clerkUserId: input.clerkUserId,
    debugTraceId: input.debugTraceId,
    debugSource: input.debugSource,
  };
  const encodedAuthId = encodeURIComponent(input.clerkUserId);
  const patchPayload = {
    image: input.imageUrl,
  };

  debugLog(traceInput, "personal_data_mipropina image patch payload", patchPayload);

  const patchResponse = await supabaseRestRequest(
    `/rest/v1/personal_data_mipropina?auth_user_id=eq.${encodedAuthId}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(patchPayload),
    },
  );

  const patchedRows = (await patchResponse.json()) as Array<{ id: string }>;
  debugLog(traceInput, "personal_data_mipropina image patch result", {
    patchedRowsCount: patchedRows.length,
  });

  if (patchedRows.length > 0) {
    return;
  }

  const usersMipropinaId = await getUsersMipropinaIdByClerkId(input.clerkUserId);
  if (!usersMipropinaId) {
    throw new Error("Cannot upsert personal_data_mipropina image without users_mipropina row");
  }

  const insertPayload = {
    user_id: usersMipropinaId,
    auth_user_id: input.clerkUserId,
    name: null,
    last_name: null,
    phone: null,
    address: null,
    city: null,
    brand_name: input.brandName ?? null,
    public_url: input.storePath ?? null,
    admin_url: input.adminPath ?? null,
    image: input.imageUrl,
  };

  debugLog(traceInput, "personal_data_mipropina image insert payload", insertPayload);

  const insertResponse = await supabaseRestRequest("/rest/v1/personal_data_mipropina", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([insertPayload]),
  });

  const insertedRows = (await insertResponse.json()) as Array<{ id: string }>;
  debugLog(traceInput, "personal_data_mipropina image insert result", {
    insertedRowsCount: insertedRows.length,
    insertedRowId: insertedRows[0]?.id ?? null,
  });
}
