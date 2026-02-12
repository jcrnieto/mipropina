import type { WebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { deleteAppUserByClerkId, upsertAppUser } from "@/app/lib/supabase/admin";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkWebhookUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
  public_metadata?: Record<string, unknown>;
};

function getPrimaryEmail(user: ClerkWebhookUser): string | null {
  if (user.primary_email_address_id) {
    const primary = user.email_addresses.find(
      (email) => email.id === user.primary_email_address_id,
    );
    if (primary?.email_address) {
      return primary.email_address;
    }
  }

  return user.email_addresses[0]?.email_address ?? null;
}

function readString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(req: NextRequest) {
  try {
    const traceId = crypto.randomUUID();
    const event = (await verifyWebhook(req)) as WebhookEvent;
    console.log(`[onboarding-debug][${traceId}][webhook.clerk] event received`, {
      type: event.type,
    });

    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data as ClerkWebhookUser;
      const metadata = (user.public_metadata ?? {}) as Record<string, unknown>;
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || null;
      console.log(`[onboarding-debug][${traceId}][webhook.clerk] user payload`, {
        userId: user.id,
        onboardingComplete: metadata.onboardingComplete === true,
      });

      await upsertAppUser({
        clerkUserId: user.id,
        email: getPrimaryEmail(user),
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: readString(metadata, "fullName") ?? fullName,
        imageUrl: user.image_url,
        onboardingComplete: metadata.onboardingComplete === true,
        phone: readString(metadata, "phone"),
        address: readString(metadata, "address"),
        brandName: readString(metadata, "brandName"),
        brandSlug: readString(metadata, "brandSlug"),
        adminPath: readString(metadata, "adminPath"),
        storePath: readString(metadata, "storePath"),
        debugTraceId: traceId,
        debugSource: "webhook.clerk",
      });

      return Response.json({ ok: true });
    }

    if (event.type === "user.deleted") {
      const deletedUser = event.data as { id?: string | null };
      if (deletedUser.id) {
        await deleteAppUserByClerkId(deletedUser.id);
      }

      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, ignored: event.type });
  } catch (error) {
    console.error("Clerk webhook failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
