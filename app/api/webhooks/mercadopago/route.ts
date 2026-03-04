import { clerkClient } from "@clerk/nextjs/server";
import { upsertAccountSnapshotByClerkId } from "@/app/lib/server/modules/account/account.service";
import {
  getMercadoPagoPreapprovalById,
  readClerkUserIdFromExternalReference,
  resolveBillingStatusFromPreapprovalStatus,
} from "@/app/lib/server/modules/subscriptions/subscriptions.service";

function readPreapprovalIdFromNotification(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;

  const data = body.data;
  if (data && typeof data === "object") {
    const id = (data as Record<string, unknown>).id;
    if (typeof id === "string" && id.length > 0) return id;
    if (typeof id === "number") return String(id);
  }

  const preapprovalId = body.preapproval_id;
  if (typeof preapprovalId === "string" && preapprovalId.length > 0) {
    return preapprovalId;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const url = new URL(req.url);
    const preapprovalId = url.searchParams.get("preapproval_id") ?? readPreapprovalIdFromNotification(body);

    if (!preapprovalId) {
      return Response.json({ ok: true, ignored: "missing-preapproval-id" });
    }

    const preapproval = await getMercadoPagoPreapprovalById(preapprovalId);
    const clerkUserId = readClerkUserIdFromExternalReference(preapproval.externalReference);

    if (!clerkUserId) {
      return Response.json({ ok: true, ignored: "missing-clerk-reference" });
    }

    const billingStatus = resolveBillingStatusFromPreapprovalStatus(preapproval.status);

    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        billingMode: "subscription",
        billingStatus,
        mercadopagoPreapprovalId: preapproval.id,
        mercadopagoPreapprovalStatus: preapproval.status,
      },
    });

    await upsertAccountSnapshotByClerkId({
      clerkUserId,
      billingStatus,
      trialStartedAt: null,
      trialEndsAt: null,
      mercadopagoPreapprovalId: preapproval.id,
      mercadopagoPreapprovalStatus: preapproval.status,
      mpLastEventId: preapproval.id,
      canceledAt: billingStatus === "subscription_cancelled" ? new Date().toISOString() : null,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[mercadopago-webhook] failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }
}
