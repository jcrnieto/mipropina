export const runtime = "nodejs";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { upsertAppUser } from "@/app/lib/supabase/admin";
import { validatePersonalDataEditable } from "@/app/validations";

type PersonalDataPayload = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  address?: unknown;
};

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readMetadataBoolean(metadata: Record<string, unknown>, key: string): boolean {
  return metadata[key] === true;
}

export async function GET() {
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
    return Response.json({
      ok: true,
      personalData: {
        firstName: readMetadataString(metadata, "firstName") ?? "",
        lastName: readMetadataString(metadata, "lastName") ?? "",
        phone: readMetadataString(metadata, "phone") ?? "",
        address: readMetadataString(metadata, "address") ?? "",
        brandName: readMetadataString(metadata, "brandName") ?? "",
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los datos" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PersonalDataPayload;
    const validation = validatePersonalDataEditable({
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      phone: String(body.phone ?? ""),
      address: String(body.address ?? ""),
    });

    if (!validation.isValid) {
      return Response.json({ ok: false, error: "Revisa los datos personales." }, { status: 400 });
    }

    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const brandName = readMetadataString(metadata, "brandName");
    const brandSlug = readMetadataString(metadata, "brandSlug");
    const adminPath = readMetadataString(metadata, "adminPath");
    const storePath = readMetadataString(metadata, "storePath");
    const onboardingComplete = readMetadataBoolean(metadata, "onboardingComplete");
    const primaryEmail =
      user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null;

    if (!brandName || !brandSlug || !adminPath || !storePath || !onboardingComplete) {
      return Response.json(
        { ok: false, error: "No se pudo resolver el contexto del restaurante." },
        { status: 400 },
      );
    }

    const { firstName, lastName, phone, address } = validation.values;
    const fullName = `${firstName} ${lastName}`.trim();
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        firstName,
        lastName,
        fullName,
        phone,
        address,
      },
    });

    await upsertAppUser({
      clerkUserId: userId,
      email: primaryEmail,
      onboardingComplete: true,
      firstName,
      lastName,
      fullName,
      phone,
      address,
      brandName,
      brandSlug,
      adminPath,
      storePath,
      debugTraceId: crypto.randomUUID(),
      debugSource: "admin.personal-data.patch",
    });

    return Response.json({
      ok: true,
      personalData: {
        firstName,
        lastName,
        phone,
        address,
        brandName,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron guardar los datos" },
      { status: 500 },
    );
  }
}
