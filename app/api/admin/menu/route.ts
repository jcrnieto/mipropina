import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getSupabaseAdminEnv } from "@/app/lib/server/supabase/client";
import {
  getActiveMenuByClerkId,
  upsertMenuByClerkId,
} from "@/app/lib/server/modules/menu/menu.service";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "mipropina";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeFilename(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) {
    return "menu";
  }

  const parts = trimmed.split(".");
  const extension = parts.length > 1 ? parts.pop() ?? "" : "";
  const baseName = parts.join(".") || "menu";
  const safeBase = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10);

  if (!safeExtension) {
    return safeBase || "menu";
  }

  return `${safeBase || "menu"}.${safeExtension}`;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const menu = await getActiveMenuByClerkId(userId);
    return Response.json({
      ok: true,
      menu,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar la carta actual" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const brandSlug = readMetadataString(metadata, "brandSlug");
    if (!brandSlug) {
      return Response.json(
        { ok: false, error: "No se encontro brandSlug para guardar la carta." },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "El archivo es obligatorio." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        { ok: false, error: "Formato invalido. Usa PDF, JPG o PNG." },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { ok: false, error: "El archivo debe pesar entre 1 byte y 10 MB." },
        { status: 400 },
      );
    }

    const normalizedName = normalizeFilename(file.name);
    const objectPath = `${brandSlug}/menu/${Date.now()}-${normalizedName}`;
    const { url, serviceRoleKey } = getSupabaseAdminEnv();

    const uploadResponse = await fetch(
      `${url}/storage/v1/object/${STORAGE_BUCKET}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: Buffer.from(await file.arrayBuffer()),
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Storage upload failed (${uploadResponse.status}): ${errorText}`);
    }

    const fileUrl = `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
    const menu = await upsertMenuByClerkId({
      clerkUserId: userId,
      fileUrl,
      filePath: objectPath,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    return Response.json({
      ok: true,
      menu,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo subir la carta" },
      { status: 500 },
    );
  }
}
