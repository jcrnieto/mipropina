import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  getPrimaryRestaurantImageByClerkId,
  setRestaurantImageByClerkId,
} from "@/app/lib/server/modules/restaurants/restaurants.service";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "wappedidos";

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

function normalizeFilename(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) {
    return "logo";
  }

  const parts = trimmed.split(".");
  const extension = parts.length > 1 ? parts.pop() ?? "" : "";
  const baseName = parts.join(".") || "logo";
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
    return safeBase || "logo";
  }

  return `${safeBase || "logo"}.${safeExtension}`;
}

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();

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
    const brandName = readMetadataString(metadata, "brandName");

    if (!brandSlug) {
      return Response.json(
        { ok: false, error: "Missing brandSlug in user metadata" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "File is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ ok: false, error: "Only image files are allowed" }, { status: 400 });
    }

    const normalizedName = normalizeFilename(file.name);
    const objectPath = `mipropina/${brandSlug}/${normalizedName}`;

    // console.log(`[onboarding-debug][${traceId}][admin.logo] upload starting`, {
    //   userId,
    //   brandSlug,
    //   fileName: file.name,
    //   contentType: file.type,
    //   bytes: file.size,
    //   bucket: STORAGE_BUCKET,
    //   objectPath,
    // });

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
      throw new Error(
        `Storage upload failed (${uploadResponse.status}) [bucket=${STORAGE_BUCKET} path=${objectPath}]: ${errorText}`,
      );
    }

    const imageUrl = `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
    await setRestaurantImageByClerkId({
      clerkUserId: userId,
      imageUrl,
      brandName,
      brandSlug,
    });

    // console.log(`[onboarding-debug][${traceId}][admin.logo] upload completed`, {
    //   userId,
    //   objectPath,
    //   imageUrl,
    // });

    return Response.json({
      ok: true,
      imageUrl,
      objectPath,
      bucket: STORAGE_BUCKET,
    });
  } catch (error) {
    console.error(`[onboarding-debug][${traceId}][admin.logo] upload failed`, error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const traceId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const imageUrl = await getPrimaryRestaurantImageByClerkId(userId);
    // console.log(`[onboarding-debug][${traceId}][admin.logo] current logo loaded`, {
    //   userId,
    //   hasImage: Boolean(imageUrl),
    // });

    return Response.json({ ok: true, imageUrl });
  } catch (error) {
    console.error(`[onboarding-debug][${traceId}][admin.logo] current logo failed`, error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Read logo failed" },
      { status: 500 },
    );
  }
}
