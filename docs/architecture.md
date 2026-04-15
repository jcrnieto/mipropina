# Architecture

## Resumen técnico

Evalúa es un MVP fullstack construido con Next.js.

La aplicación utiliza:

- Next.js como framework principal.
- App Router para frontend y rutas.
- API Routes dentro de `app/api` para la lógica del servidor.
- Clerk para autenticación.
- Supabase para base de datos y storage.
- Mercado Pago para suscripciones y propinas.
- Tailwind CSS para estilos.

No existe backend separado en esta etapa del proyecto.

## Objetivo de arquitectura

Tener una base rápida para iterar el MVP, pero manteniendo orden suficiente para que el proyecto pueda escalar después.

La prioridad es:

- Velocidad de desarrollo.
- Claridad.
- Separación lógica.
- Evitar que `app/api` se convierta en una mezcla caótica de lógica.

## Principios de diseño

- Mantener `route.ts` finos.
- Mover la lógica de negocio a `lib/services`.
- Encapsular acceso a datos en `lib/repositories`.
- Centralizar integraciones con terceros en módulos dedicados.
- Evitar dependencias pesadas o abstracciones innecesarias.
- Resolver el MVP con la menor complejidad posible sin perder orden.

## Distribución de responsabilidades

### `app/api`

Responsable de:

- Recibir requests.
- Validar input.
- Verificar autenticación y autorización cuando aplique.
- Llamar servicios de dominio.
- Devolver respuestas HTTP consistentes.

No debería contener:

- Lógica de negocio compleja.
- Queries repetidas a Supabase.
- Integraciones extensas escritas directamente en la route.

### `lib/services`

Responsable de:

- Orquestar reglas de negocio.
- Coordinar repositorios e integraciones externas.
- Resolver casos de uso del producto.

Ejemplos:

- Alta de restaurante.
- Onboarding inicial.
- Activación de trial.
- Creación de suscripción.
- Registro de review.
- Cálculo de métricas.

### `lib/repositories`

Responsable de:

- Lectura y escritura en Supabase.
- Encapsular acceso a tablas y consultas.
- Reutilizar queries del dominio sin dispersarlas por el proyecto.

### `lib/auth`

Responsable de:

- Helpers vinculados a Clerk.
- Resolución del usuario autenticado.
- Guards y utilidades de acceso al contexto del restaurante.

### `lib/mercadopago`

Responsable de:

- Crear preferencias o links de pago.
- Gestionar suscripciones.
- Normalizar respuestas o eventos de Mercado Pago.

### `app/components`

Responsable de:

- Componentes de UI reutilizables.
- Layouts livianos y piezas de interfaz compartidas.

No usar `shadcn/ui`. Preferir componentes propios con Tailwind CSS.

## Fronteras de frontend

### Frontend público

Incluye:

- Landing.
- Experiencia pública del restaurante por slug.
- Carta digital.
- Flujo de review.
- Flujo de propina.

### Frontend admin

Incluye:

- Onboarding.
- Configuración del local.
- Gestión de mozos.
- Gestión de QR.
- Gestión de carta.
- Métricas.
- Facturación y estado de suscripción.

## Flujos principales

### Registro y onboarding

1. El dueño se registra o inicia sesión.
2. Completa datos iniciales del restaurante.
3. El sistema crea o completa la entidad del restaurante.
4. Se define si entra en trial o si inicia suscripción.
5. El usuario accede al panel admin.

### Trial

1. El usuario entra desde la landing.
2. Completa el flujo inicial.
3. Se registra fecha de inicio y vencimiento del trial.
4. El admin puede ver cuántos días le quedan.

### Suscripción

1. El usuario inicia contratación.
2. El sistema genera la operación con Mercado Pago.
3. Mercado Pago confirma el resultado.
4. Un webhook o retorno actualiza el estado de la suscripción.
5. El restaurante queda habilitado según su estado.

### Review pública desde QR

1. El cliente escanea el QR.
2. Se resuelve el restaurante y opcionalmente el mozo.
3. El cliente deja estrellas y comentario.
4. El sistema guarda la review.
5. Las métricas del restaurante se actualizan o se recalculan.

### Propina

1. El cliente escanea el QR.
2. Elige dejar propina al local o al mozo.
3. El sistema genera la operación de Mercado Pago.
4. El pago confirmado se registra en el contexto correcto.

## Entidades de dominio sugeridas

- Restaurant
- User
- Waiter
- Review
- ReviewCategory
- Tip
- Menu
- QrCode
- Subscription
- Trial
- MetricSnapshot o métricas derivadas

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
  layout.tsx
  globals.css

lib/
  auth/
  constants/
  mercadopago/
  repositories/
  services/
  supabase/
  utils/

public/
middleware.ts
```

## Criterios para futuras decisiones

- Si una implementación se puede resolver con un módulo simple, no crear una abstracción extra.
- Si una route empieza a mezclar validación, negocio y acceso a datos, separar.
- Si una integración externa crece, aislarla en su carpeta de dominio.
- Si una pantalla admin necesita demasiada lógica, mover esa lógica a servicios o helpers server-side.
