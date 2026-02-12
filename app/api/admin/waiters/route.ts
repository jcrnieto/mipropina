import { auth, currentUser } from "@clerk/nextjs/server";
import { createEmployeeByClerkId, listEmployeesByClerkId } from "@/app/lib/supabase/admin";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wappedidos";

type WaiterPayload = {
  name?: unknown;
  lastName?: unknown;
  dni?: unknown;
  phone?: unknown;
  mercadopagoLink?: unknown;
  image?: unknown;
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

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMercadoPagoLink(url: string): boolean {
  return /https?:\/\/(www\.)?mercadopago\.com(\.[a-z]{2})?\/.+/i.test(url);
}

function parseImageDataUrl(dataUrl: string): { bytes: Buffer; contentType: string; extension: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de imagen no valido");
  }

  const contentType = match[1];
  const base64 = match[2];
  const bytes = Buffer.from(base64, "base64");

  if (bytes.length === 0) {
    throw new Error("La imagen esta vacia");
  }

  const rawExt = contentType.split("/")[1] ?? "jpg";
  const extension = rawExt.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  return { bytes, contentType, extension };
}

async function uploadEmployeeImage(params: {
  brandSlug: string;
  imageDataUrl: string;
}): Promise<string> {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const parsed = parseImageDataUrl(params.imageDataUrl);
  const fileName = `foto-${crypto.randomUUID()}.${parsed.extension}`;
  const objectPath = `mipropina/${params.brandSlug}/employee/foto/${fileName}`;

  const uploadResponse = await fetch(
    `${url}/storage/v1/object/${STORAGE_BUCKET}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": parsed.contentType,
        "x-upsert": "true",
      },
      body: parsed.bytes,
    },
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Storage upload failed (${uploadResponse.status}): ${errorText}`);
  }

  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as WaiterPayload;
    const name = readRequiredString(body.name);
    const lastName = readRequiredString(body.lastName);
    const dni = readRequiredString(body.dni);
    const phone = readRequiredString(body.phone);
    const mercadopagoLink = readRequiredString(body.mercadopagoLink);
    const imageDataUrl = readOptionalString(body.image);

    if (!name || !lastName || !dni || !phone || !mercadopagoLink) {
      return Response.json({ ok: false, error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    if (!isMercadoPagoLink(mercadopagoLink)) {
      return Response.json(
        { ok: false, error: "El link debe ser una URL valida de Mercado Pago." },
        { status: 400 },
      );
    }

    let imageUrl: string | null = null;
    if (imageDataUrl) {
      const user = await currentUser();
      const metadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
      const brandSlug = readMetadataString(metadata, "brandSlug");

      if (!brandSlug) {
        return Response.json(
          { ok: false, error: "No se encontro brandSlug para guardar la foto del mozo." },
          { status: 400 },
        );
      }

      imageUrl = await uploadEmployeeImage({
        brandSlug,
        imageDataUrl,
      });
    }

    const created = await createEmployeeByClerkId({
      clerkUserId: userId,
      name,
      lastName,
      dni,
      phone,
      mercadopagoLink,
      image: imageUrl,
    });

    return Response.json({
      ok: true,
      waiter: {
        id: created.id,
        firstName: created.name ?? "",
        lastName: created.last_name ?? "",
        dni: created.dni ?? "",
        phone: created.phone ?? "",
        mercadopagoLink: created.mercadopago_link ?? "",
        photo: created.image,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear el mozo" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const employees = await listEmployeesByClerkId(userId);
    return Response.json({
      ok: true,
      waiters: employees.map((employee) => ({
        id: employee.id,
        firstName: employee.name ?? "",
        lastName: employee.last_name ?? "",
        dni: employee.dni ?? "",
        phone: employee.phone ?? "",
        mercadopagoLink: employee.mercadopago_link ?? "",
        photo: employee.image,
      })),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los mozos" },
      { status: 500 },
    );
  }
}
