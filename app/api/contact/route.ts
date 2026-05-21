import { NextRequest, NextResponse } from "next/server";
import { sendContactEmails } from "@/app/api/mail/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, restaurante, cantidad, mensaje } = body;

    // Validación básica
    if (!nombre || !email || !restaurante || !mensaje) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    await sendContactEmails({ nombre, email, restaurante, cantidad, mensaje });

    return NextResponse.json(
      { ok: true, message: "Consulta enviada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al procesar contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


