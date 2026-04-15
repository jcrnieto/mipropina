# AGENTS.md

## Proyecto

Este proyecto se llama **Evalúa**.

Es una plataforma SaaS para dueños de restaurantes. Su objetivo es prevenir malas reseñas públicas capturando feedback del cliente dentro del local a través de un QR en la mesa.

## Qué puede hacer el cliente

- Dejar una reseña interna rápida con estrellas.
- Escribir un comentario opcional.
- Ver la carta digital.
- Dejar propina por Mercado Pago.

## Qué puede hacer el dueño del restaurante

- Registrarse.
- Iniciar prueba gratuita o suscripción.
- Completar onboarding.
- Gestionar su local.
- Gestionar mozos.
- Generar QR.
- Ver métricas.

## Stack oficial del proyecto

- Next.js con App Router
- TypeScript
- Tailwind CSS
- Clerk para autenticación
- Supabase para base de datos y storage
- Mercado Pago para suscripciones y propinas

## Restricciones importantes

- Este proyecto no usa backend separado.
- La lógica del servidor vive dentro de `app/api`.
- No usar `shadcn/ui`.
- Preferir componentes propios y livianos.
- Mantener el proyecto simple y orientado a MVP.
- Evitar sobreingeniería.

## Regla importante sobre UI

No usar `shadcn/ui`.

Para componentes reutilizables:

- Crear componentes propios en `app/components` o en una carpeta dedicada.
- Usar Tailwind CSS puro.
- Mantener diseño simple, limpio y reutilizable.
- Evitar dependencias pesadas de UI innecesarias.

## Arquitectura general

La app está dividida en:

- Frontend público.
- Frontend admin.
- API interna dentro de Next.js.
- Servicios de integración externos.

## Organización del código

### Frontend

Usar App Router de Next.js.

Rutas esperadas:

- Landing pública.
- Experiencia pública del restaurante por slug.
- Onboarding.
- Sign-in.
- Sign-up.
- Admin.

### Backend dentro de Next

Toda la lógica backend vive en `app/api`.

Submódulos actuales o esperados:

- `app/api/admin`
- `app/api/billing`
- `app/api/internal`
- `app/api/public`
- `app/api/webhooks`

## Regla de separación de responsabilidades

Aunque no haya backend separado, mantener separación lógica dentro del proyecto.

### API routes

Responsabilidades:

- Recibir requests.
- Validar input.
- Autenticar si aplica.
- Delegar lógica.
- Devolver respuesta.

### Services o lógica de dominio

Responsabilidades:

- Lógica de negocio.
- Reglas funcionales.
- Orquestación entre Clerk, Supabase y Mercado Pago.

### Acceso a datos

Responsabilidades:

- Lectura y escritura en Supabase.
- Encapsular queries.
- Evitar acceso repetido o disperso a datos desde la UI o desde `route.ts`.

## Regla clave

No colocar toda la lógica directamente dentro de los archivos `route.ts`.

Los `route.ts` deben ser finos. La lógica debe moverse a funciones reutilizables en `lib/` o a módulos por dominio.

## Convenciones para agentes

- Antes de implementar, revisar si ya existe un servicio, repositorio o validación reutilizable.
- Si una feature toca negocio, evitar resolverla solo desde componentes o desde la route.
- Si una route crece demasiado, extraer lógica a `lib/services` o `lib/repositories`.
- Mantener nombres de archivos y carpetas alineados con el dominio: `billing`, `reviews`, `restaurants`, `waiters`, `tips`.
- Priorizar claridad sobre abstracción temprana.
- Si hay una duda entre una solución rápida y una solución compleja, preferir la más simple que mantenga orden.

## Estructura sugerida

```txt
app/
  api/
    admin/
    billing/
    internal/
    public/
    webhooks/
  components/
  onboarding/
  sign-in/
  sign-up/
  validations/

lib/
  auth/
  constants/
  mercadopago/
  repositories/
  services/
  supabase/
  utils/
```
