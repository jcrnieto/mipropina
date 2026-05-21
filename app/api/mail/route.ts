import { NextRequest, NextResponse } from "next/server";
import {
  sendContactEmails,
  sendTrialWelcomeEmail,
  sendSubscriptionPendingEmail,
  sendSubscriptionActiveEmail,
} from "./service";

type MailPayload =
  | {
      type: "contact";
      nombre: string;
      email: string;
      restaurante: string;
      cantidad?: string;
      mensaje: string;
    }
  | {
      type: "trial";
      email: string;
      name: string;
      brandName: string;
      trialDays: number;
      trialEndsAt: string;
    }
  | {
      type: "subscriptionPending";
      email: string;
      name: string;
      brandName: string;
    }
  | {
      type: "subscriptionActive";
      email: string;
      name: string;
      brandName: string;
    };

function requireInternalKey(req: NextRequest) {
  const key = req.headers.get("x-internal-api-key");
  return key && key === process.env.INTERNAL_MAINTENANCE_API_KEY;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MailPayload;

    if (!body?.type) {
      return NextResponse.json({ error: "Tipo de mail inválido" }, { status: 400 });
    }

    if (body.type !== "contact" && !requireInternalKey(req)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    switch (body.type) {
      case "contact":
        await sendContactEmails(body);
        return NextResponse.json({ ok: true });
      case "trial":
        await sendTrialWelcomeEmail(body);
        return NextResponse.json({ ok: true });
      case "subscriptionPending":
        await sendSubscriptionPendingEmail(body);
        return NextResponse.json({ ok: true });
      case "subscriptionActive":
        await sendSubscriptionActiveEmail(body);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Tipo de mail no soportado" }, { status: 400 });
    }
  } catch (error) {
    console.error("[mail] failed", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
