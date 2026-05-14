import { NextRequest, NextResponse } from "next/server";

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

    // Enviar email usando Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: "Satix",
          email: "jcrnietos@gmail.com"
        },
        to: [
          {
            email: "jcrnietos@gmail.com",
            name: "Juan Cruz"
          }
        ],
        replyTo: {
          email: email,
          name: nombre
        },
        subject: `Tu consulta ha sido recibida - Satix`,
        htmlContent: `
          <h2>¡Hola ${nombre}!</h2>
          <p>Hemos recibido tu consulta correctamente.</p>
          <p><strong>Detalles de tu consulta:</strong></p>
          <ul>
            <li><strong>Restaurante:</strong> ${restaurante}</li>
            <li><strong>Cantidad:</strong> ${cantidad || "No especificado"}</li>
            <li><strong>Mensaje:</strong> ${mensaje}</li>
          </ul>
          <p>Nos pondremos en contacto contigo pronto a través de este email.</p>
          <p>Gracias por elegir <strong>Satix</strong>.</p>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error("Error de Brevo:", errorData);
      throw new Error(`Error al enviar email: ${brevoResponse.status}`);
    }

    const result = await brevoResponse.json();
    console.log("Email enviado exitosamente:", result);

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
