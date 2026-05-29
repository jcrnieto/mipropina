type BrevoEmailAddress = {
  email: string;
  name?: string;
};

type BrevoEmailOptions = {
  to: BrevoEmailAddress[];
  subject: string;
  htmlContent: string;
  replyTo?: BrevoEmailAddress;
};

export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
  replyTo,
}: BrevoEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || "notificaciones@satixapp.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Satix";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to,
      replyTo,
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo email failed: ${response.status} ${errorData}`);
  }

  return response.json();
}

export type ContactEmailInput = {
  nombre: string;
  email: string;
  restaurante: string;
  cantidad?: string;
  mensaje: string;
};

export async function sendContactEmails({
  nombre,
  email,
  restaurante,
  cantidad,
  mensaje,
}: ContactEmailInput) {
  const ownerEmail = process.env.CONTACT_OWNER_EMAIL || "jcrnietos@gmail.com";

  await sendBrevoEmail({
    to: [
      {
        email: ownerEmail,
        name: "Juan Cruz",
      },
    ],
    replyTo: {
      email,
      name: nombre,
    },
    subject: `Nuevo mensaje desde la web de Satix: ${restaurante || "sin nombre"}`,
    htmlContent: `
      <h2>Nuevo mensaje desde la web de Satix</h2>
      <p><strong>Atención:</strong> te llegó un nuevo mensaje desde la web de Satix. No te olvides de contestarlo usando el botón Responder o el enlace mailto.</p>
      <p><strong>Responder a:</strong> <a href="mailto:${email}">${email}</a></p>
      <hr />
      <p><strong>Detalles de la consulta:</strong></p>
      <ul>
        <li><strong>Nombre:</strong> ${nombre}</li>
        <li><strong>Restaurante:</strong> ${restaurante}</li>
        <li><strong>Cantidad:</strong> ${cantidad || "No especificado"}</li>
        <li><strong>Mensaje:</strong> ${mensaje}</li>
      </ul>
      <p>Recibiste este correo porque alguien envió una consulta desde el formulario público de Satix.</p>
    `,
  });

  return sendBrevoEmail({
    to: [
      {
        email,
        name: nombre,
      },
    ],
    subject: `Gracias por contactarte con Satix`,
    htmlContent: `
      <h2>Gracias por contactarte con Satix</h2>
      <p>Hola ${nombre},</p>
      <p>Recibimos tu consulta y en breve te responderemos. Mientras tanto, dejamos acá el detalle:</p>
      <ul>
        <li><strong>Restaurante:</strong> ${restaurante}</li>
        <li><strong>Cantidad:</strong> ${cantidad || "No especificado"}</li>
        <li><strong>Mensaje:</strong> ${mensaje}</li>
      </ul>
      <p>Te escribimos desde <strong>Satix</strong>. Este email se envió desde el remitente oficial de Satix para que puedas contestar correctamente.</p>
      <p>Si querés, podés responder a este mismo correo y te vamos a contestar lo antes posible.</p>
    `,
  });
}

export async function sendTrialWelcomeEmail({
  email,
  name,
  brandName,
  trialDays,
  trialEndsAt,
}: {
  email: string;
  name: string;
  brandName: string;
  trialDays: number;
  trialEndsAt: string;
}) {
  const formattedEndDate = new Date(trialEndsAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return sendBrevoEmail({
    to: [{ email, name }],
    subject: `Bienvenido a Satix: tu prueba gratuita de ${trialDays} días comenzó`,
    htmlContent: `
      <h2>Bienvenido a Satix, ${name}.</h2>
      <p>Tu prueba gratuita de <strong>${trialDays} días</strong> para <strong>${brandName}</strong> ya está activa.</p>
      <p>Podés usar Satix desde hoy y hasta el <strong>${formattedEndDate}</strong>. Durante este tiempo vas a poder probar las alertas desde las mesas, revisar tu panel y ajustar tu local sin compromiso.</p>
      <p>Al finalizar la prueba, tu acceso quedará suspendido si no confirmás la suscripción. Te recomendamos aprovechar estos días para sentir cómo funciona y decidir si querés continuar con la versión completa.</p>
      <p>Si necesitás ayuda para configurar el QR, invitar mozos o mejorar la experiencia de tus clientes, respondé a este correo y te acompañamos.</p>
      <p>Gracias por elegir Satix.</p>
    `,
  });
}

export async function sendSubscriptionPendingEmail({
  email,
  name,
  brandName,
}: {
  email: string;
  name: string;
  brandName: string;
}) {
  return sendBrevoEmail({
    to: [{ email, name }],
    subject: `Bienvenido a Satix: tu suscripción está en proceso`,
    htmlContent: `
      <h2>Bienvenido a Satix, ${name}.</h2>
      <p>Registramos tu suscripción para <strong>${brandName}</strong> y el pago está en proceso.</p>
      <p>En cuanto Mercado Pago confirme la transacción, tu cuenta quedará activa y vas a poder usar Satix sin interrupciones.</p>
      <p>Mientras tanto, podés adelantar la configuración de tu local en el panel de administración.</p>
      <p>Te avisaremos cuando tu suscripción esté completamente activada.</p>
      <p>Gracias por elegir Satix.</p>
    `,
  });
}

export async function sendSubscriptionActiveEmail({
  email,
  name,
  brandName,
}: {
  email: string;
  name: string;
  brandName: string;
}) {
  return sendBrevoEmail({
    to: [{ email, name }],
    subject: `Tu suscripción a Satix está activa`,
    htmlContent: `
      <h2>Hola ${name},</h2>
      <p>Tu suscripción a <strong>${brandName}</strong> está activa y lista para usarse.</p>
      <p>Ya podés comenzar a gestionar tu restaurante, recibir feedback desde las mesas y ver métricas desde el panel.</p>
      <p>Gracias por elegir Satix. Si necesitás ayuda, respondé a este correo y te asistimos.</p>
    `,
  });
}

export async function sendLowRatingAlertEmail({
  email,
  name,
  brandName,
  branchName,
  adminUrl,
  averageStars,
  lowestStars,
  comment,
}: {
  email: string;
  name: string;
  brandName: string;
  branchName?: string | null;
  adminUrl?: string | null;
  averageStars: number;
  lowestStars: number;
  comment?: string | null;
}) {
  const commentText = comment?.trim();

  return sendBrevoEmail({
    to: [{ email, name }],
    subject: `Alerta Satix: reseña baja en ${brandName}`,
    htmlContent: `
      <h2>Alerta de reseña baja</h2>
      <p>Hola ${name},</p>
      <p>Un cliente dejó una calificación baja en <strong>${brandName}</strong>${branchName ? `, local <strong>${branchName}</strong>` : ""}.</p>
      <ul>
        <li><strong>Promedio:</strong> ${averageStars.toFixed(1)} estrellas</li>
        <li><strong>Puntaje mínimo:</strong> ${lowestStars} estrella(s)</li>
        ${commentText ? `<li><strong>Comentario:</strong> ${commentText}</li>` : ""}
      </ul>
      ${
        adminUrl
          ? `<p><a href="${adminUrl}" target="_blank" rel="noreferrer">Abrir panel del local</a></p>`
          : ""
      }
      <p>Te enviamos este aviso porque las alertas de Satix están activas para este local.</p>
    `,
  });
}
