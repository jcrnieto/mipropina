# Evalúa

Evalúa es una plataforma SaaS para dueños de restaurantes que ayuda a detectar problemas de servicio antes de que se conviertan en malas reseñas públicas.

La aplicación funciona a través de un QR en la mesa del restaurante. El cliente escanea el QR y puede:

- Calificar la experiencia con estrellas.
- Dejar un comentario opcional.
- Ver la carta digital.
- Dejar propina mediante Mercado Pago.

Del lado del restaurante, el dueño accede a un panel de administración donde puede configurar su local, gestionar mozos, generar QR y consultar métricas.

## Objetivo del producto

Permitir que los dueños de restaurantes tengan control sobre la experiencia real de sus clientes dentro del local y puedan actuar antes de que una mala experiencia termine publicada en Google Reviews.

## Stack tecnológico

- Framework principal: Next.js
- Renderizado y frontend: React + App Router
- Backend: API Routes dentro de `app/api`
- Estilos: Tailwind CSS
- Autenticación: Clerk
- Base de datos y storage: Supabase
- Pagos y suscripciones: Mercado Pago

## Decisión de arquitectura

Este proyecto fue planteado como un MVP fullstack dentro de Next.js.

No existe un backend separado. La lógica del servidor vive dentro de `app/api`, aprovechando las capacidades server-side de Next.js.

Esto permite:

- Avanzar más rápido en el MVP.
- Mantener frontend y backend en un solo repositorio.
- Reducir complejidad inicial.
- Iterar más rápido sobre features clave.

## Funcionalidades principales

### Para clientes del restaurante

Desde un QR en la mesa, el cliente puede:

1. Responder una encuesta rápida.
2. Dejar un comentario opcional.
3. Ver la carta digital.
4. Dejar propina.

### Para dueños de restaurantes

Desde el panel admin, el dueño puede:

- Registrarse y autenticarse.
- Iniciar prueba gratuita.
- Contratar una suscripción.
- Completar onboarding.
- Cargar el logo del local.
- Generar un QR global.
- Cargar mozos.
- Cargar la carta.
- Generar QR por mozo.
- Permitir que cada mozo reciba su propia propina.
- Ver métricas del local.

## Flujo comercial

### Prueba gratuita

1. El usuario entra a la landing page.
2. Toca el botón de prueba gratuita.
3. Completa formulario de datos personales.
4. Ingresa al panel admin.
5. Visualiza cuántos días de prueba le quedan.

### Suscripción

1. El usuario entra a la landing page.
2. Toca el botón para contratar.
3. Completa formulario de datos personales.
4. Es redirigido a Mercado Pago.
5. Activa la suscripción.
6. Accede al panel admin.

## Métricas esperadas

La aplicación debe permitir medir:

- Puntaje general del local.
- Puntaje por categoría.
- Puntaje por mozo.
- Puntaje por turno.
- Puntaje por mes.
- Puntaje por año.
- Cantidad de respuestas.
- Comentarios recibidos.
- Reseñas negativas o críticas.
- Propinas generadas.

## Alertas futuras

Más adelante el sistema debería poder generar alertas cuando se detecte una mala reseña o una baja calificación.

Canales posibles:

- WhatsApp.
- Email.
- Notificación interna.

## Documentación interna

- `agents.md`: reglas y contexto para agentes que trabajen en el repositorio.
- `docs/products.md`: contexto de producto, usuarios, propuesta de valor y reglas iniciales.
- `docs/architecture.md`: decisiones de arquitectura, responsabilidades y flujos principales.

## Desarrollo local

Instalar dependencias y levantar el proyecto:

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` en el navegador.
