import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { upsertAccountSnapshotByClerkId } from "@/app/lib/server/modules/account/account.service";
import { createMercadoPagoSubscriptionCheckout } from "@/app/lib/server/modules/subscriptions/subscriptions.service";

function readMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getSubscriptionAmount(): number {
  const raw = process.env.MERCADOPAGO_SUBSCRIPTION_AMOUNT_ARS;
  if (!raw) return 15000;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid MERCADOPAGO_SUBSCRIPTION_AMOUNT_ARS");
  }
  return amount;
}

export async function POST() {
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
    const brandName = readMetadataString(metadata, "brandName");
    const brandSlug = readMetadataString(metadata, "brandSlug");
    const primaryEmail =
      user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null;

    if (!brandName || !primaryEmail) {
      return Response.json({ ok: false, error: "Faltan datos para iniciar la suscripcion." }, { status: 400 });
    }

    const checkout = await createMercadoPagoSubscriptionCheckout({
      clerkUserId: userId,
      payerEmail: primaryEmail,
      reason: `Suscripcion MiPropina - ${brandName}`,
      amount: getSubscriptionAmount(),
      currencyId: "ARS",
      brandSlug,
    });

    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          billingMode: "subscription",
          billingStatus: "subscription_pending",
          mercadopagoPreapprovalId: checkout.preapprovalId,
          mercadopagoPreapprovalStatus: checkout.status,
        },
      });

      await upsertAccountSnapshotByClerkId({
        clerkUserId: userId,
        billingStatus: "subscription_pending",
        trialStartedAt: null,
        trialEndsAt: null,
        mercadopagoPreapprovalId: checkout.preapprovalId,
        mercadopagoPreapprovalStatus: checkout.status,
        canceledAt: null,
      });
    } catch (error) {
      console.error("[billing-api] checkout created but persistence failed; continuing", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return Response.json({
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      preapprovalId: checkout.preapprovalId,
      status: checkout.status,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear la suscripcion" },
      { status: 500 },
    );
  }
}
