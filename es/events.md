# Eventos

Eventos del navegador para los dos componentes embebibles. Cada evento abajo es un `CustomEvent` con `bubbles: true` y `composed: true`.

La página alojada no está en esta lista. No da a tu aplicación estos eventos. En ese producto el navegador sigue `redirectUrl`, documentado en [hosted-web.md](hosted-web.md).

Los eventos le cuentan a tu página qué ocurre en el navegador mientras el SDK se ejecuta. No entregan los resultados de la transacción. Tu servidor recibe la [notificación por webhook](integration-guide.md#notificacion-por-webhook) y obtiene los resultados con la API: [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

Un resumen de cada evento junto a los atributos y métodos está en la [referencia de API](api.md#eventos).

## Dónde escuchar

| Producto | Escuchar aquí | Eventos |
|----------|---------------|---------|
| `<become-kyc-sdk>` | El custom element, o `document` en la misma página | `become-kyc:ready`, `become-kyc:event`, `become-kyc:error`, `become-kyc:warning` |
| `<become-button>` | El elemento botón | `become:result`, `become:userFinishedSdk`, `become:exitedSdk`, `become:errorSdk` |

```javascript
const sdk = document.querySelector('become-kyc-sdk');

sdk.addEventListener('become-kyc:event', (event) => {
  const { action, payload } = event.detail;
});
```

Ese listener aplica solo a una página que incluye `<become-kyc-sdk>`. No recibe nada de la URL de verificación alojada, incluyendo cuando esa URL se muestra en un iframe.

## Eventos de `<become-kyc-sdk>`

### Nombres de Eventos

| Nombre | Cuándo |
|------|-------|
| `become-kyc:ready` | SDK montado exitosamente |
| `become-kyc:event` | Eventos de lógica de negocio (ver acciones abajo) |
| `become-kyc:error` | Errores fatales o de token |
| `become-kyc:warning` | Warnings de inicialización no críticos |

---

### `become-kyc:ready`

Emitido después de que el SDK ha resuelto configuración y montado.

```typescript
{
  version: string;
  contractId: string;
  flow: 'onboarding' | 'reverification';
}
```

---

### `become-kyc:event`

Emitido para eventos de lógica de negocio. El campo `action` identifica el tipo de evento.

#### Acciones

| Acción | Cuándo se emite |
|--------|-----------------|
| `stepLifecycleEvent` | Transición de ciclo de vida de paso |
| `stepChange` | Paso actual cambió |
| `result` | La API aceptó el envío de la verificación |
| `atdpDeclined` | Usuario declinó términos de tratamiento de datos |
| `exitedSdk` | SDK salió/cerró |
| `userFinished` | La persona cerró la pantalla de resultado, tras `result` o tras un error final |

#### Payload de `stepLifecycleEvent`

```typescript
{
  action: 'stepLifecycleEvent';
  payload: {
    step: string;
    userId?: string;
    contractId: string;
    status: 'initiated' | 'completed' | 'retried' | 'error';
    timestamp?: string; // ISO 8601
  };
}
```

**Valores de status:**
- `initiated` — Paso iniciado (componente montado)
- `completed` — Paso finalizado exitosamente
- `retried` — Paso se está reintentando (usuario clicó retry)
- `error` — Paso falló con error no reintentable

**Pasos que emiten eventos de ciclo de vida:**
`intro`, `atdp`, `contactValidation`, `documentType`, `countrySelection`, `capture`, `liveness` (reintentado en error de liveness, retry de validación de selfie), `result` (reintentado en error 5xx, error en no reintentable).

#### Payload de `stepChange`

`stepId` está en `event.detail` directamente. Esta acción no tiene `payload`.

```typescript
{
  action: 'stepChange';
  stepId: string;
}
```

#### Payload de `result`

Se emite cuando la API acepta el envío de la verificación. `data` es la respuesta a ese envío. No es el resultado de la transacción: obtenlo con la API. Ver [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

```typescript
{
  action: 'result';
  payload: {
    flow: 'onboarding' | 'reverification';
    userId: string;
    contractId: string;
    data: unknown; // Respuesta al envío de la verificación
  };
}
```

#### Payload de `atdpDeclined`

```typescript
{
  action: 'atdpDeclined';
  payload: {
    contractId: string;
    userId: string;
    declinedAt: string; // ISO 8601
  };
}
```

#### Payload de `exitedSdk`

Se emite cuando la persona cierra el flujo (el control de cierre en modo `overlay`) y tras `atdpDeclined`. `data` es la respuesta del backend cuando la persona cierra tras un resultado exitoso, y `null` en otro caso.

```typescript
{
  action: 'exitedSdk';
  payload: {
    data: unknown | null;
  };
}
```

#### Payload de `userFinished`

Se emite cuando la persona cierra la pantalla de resultado, tras `result`, o cierra la pantalla de error final, tras `become-kyc:error` con `RESULT_FAILED`. Cuando tu contrato cierra la pantalla de resultado automáticamente, se emite sin click. Si `redirect-url` está configurado, el navegador lo abre justo después de este evento. `userFinished` por sí solo no significa éxito: comprueba si `result` llegó antes.

```typescript
{
  action: 'userFinished';
  payload: {
    flow: 'onboarding' | 'reverification';
    userId?: string;
    contractId: string;
    data: unknown; // Respuesta al envío de la verificación, cuando la hubo
  };
}
```

---

### `become-kyc:error`

Emitido para errores fatales o de bloqueo. Despachado como `CustomEvent` separado (no dentro de `become-kyc:event`).

```typescript
{
  code: string | number;
  message?: string;
  status?: number;
  retryable?: boolean;
  data?: unknown;
  flow?: string;
}
```

<a id="codigos-de-error"></a>

#### Códigos de error

- `CONFIG_FETCH_FAILED` — Startup falló. Incluye falla HTTP de private-config y startup check rechazado (falta `contractId`, falta o malformado `accessToken`, o falta `userId` para reverificación). `message` es el diagnóstico (`HTTP 401`, `Missing contractId`, `Missing accessToken`, `Invalid or malformed accessToken`, `Request timeout`, etc). `status` es el status HTTP cuando la falla fue respuesta HTTP. `retryable` es true para timeouts, fallas de red, HTTP 429, y HTTP 5xx.
- `PUBLIC_CONFIG_FETCH_FAILED` — Falló fetch de public config
- `401` — El envío de la verificación no fue autorizado (HTTP 401). La API valida el access token en esta etapa, así que un token expirado o inválido se reporta aquí. Esto no significa por sí solo que el usuario final escribió una credencial errónea. `data` es el cuerpo de respuesta cuando el transport lo proveyó. Ver [Validación del token y seguridad](integration-guide.md#validacion-del-token-y-seguridad).
- `RESULT_FAILED` — El flujo terminó en un error. Se emite cuando la persona cierra la pantalla de error final, justo antes de `userFinished`.

La frase de usuario final no es este payload. `<become-kyc-sdk>` muestra la frase del catálogo (`errors.startup`). HTTP 401 y HTTP 403 usan la frase de autorización. El número de status y cuerpo de respuesta se quedan en este evento. Override la frase con `setConfig({ texts })` antes de que el elemento empiece.

---

### `become-kyc:warning`

Emitido para warnings de inicialización no críticos.

```typescript
{
  warnings: string[];
}
```

---

## Eventos del Become Button

Estos eventos los emite el propio elemento `<become-button>`. Tienen diferentes nombres y payloads de los eventos del KYC Web Component.

| Evento | Cuándo |
|--------|-------|
| `become:result` | La API aceptó el envío de la verificación |
| `become:userFinishedSdk` | La persona cerró la pantalla de resultado, tras éxito o un error final |
| `become:exitedSdk` | Usuario cerró el SDK |
| `become:errorSdk` | Errores fatales o de token |

### Payload de `become:result`

El payload de `result` de `<become-kyc-sdk>`. `data` es la respuesta al envío de la verificación, no el resultado de la transacción.

```typescript
{
  flow: 'onboarding' | 'reverification';
  userId: string;
  contractId: string;
  data: unknown; // Respuesta al envío de la verificación
}
```

### Payload de `become:userFinishedSdk`

`data` es la respuesta de `become:result`, o `null` cuando no hubo, por ejemplo tras un error final.

```typescript
{
  flow: 'onboarding' | 'reverification';
  data: unknown;
}
```

### Payload de `become:exitedSdk`

El payload de `exitedSdk` de `<become-kyc-sdk>`.

```typescript
{
  data: unknown | null;
}
```

### Payload de `become:errorSdk`

```typescript
{
  code: string | number;
  message?: string;
  status?: number;
  retryable?: boolean;
  data?: unknown;
  flow?: string;
}
```

Las fallas de startup incluyen `code: 'CONFIG_FETCH_FAILED'`, el `message` diagnóstico, `status` cuando la falla fue HTTP, y `retryable`. La misma falla también emite `become-kyc:error` desde el SDK. Escucha uno de esos contratos. El botón no pinta un segundo mensaje para un error que ocurre después de que el SDK ha abierto.

---

## Escuchando Eventos

### `<become-kyc-sdk>`

Usa estos listeners en la página que contiene el custom element. No aplican a la URL de verificación alojada.

```javascript
// Todos los eventos de lógica de negocio
document.addEventListener('become-kyc:event', (event) => {
  const { action, payload } = event.detail;
  
  switch (action) {
    case 'stepLifecycleEvent':
      console.log('Paso:', payload.step, 'Status:', payload.status);
      break;
    case 'result':
      console.log('Verificación enviada:', payload.flow);
      break;
    case 'atdpDeclined':
      console.log('Usuario declinó ATDP');
      break;
    case 'exitedSdk':
      console.log('Usuario salió del SDK');
      break;
    case 'userFinished':
      console.log('Usuario terminó:', payload.flow);
      break;
    case 'stepChange':
      console.log('Paso cambió a:', event.detail.stepId);
      break;
  }
});

// Errores
document.addEventListener('become-kyc:error', (event) => {
  console.error('SDK error:', event.detail);
});

// Ready
document.addEventListener('become-kyc:ready', (event) => {
  console.log('SDK ready:', event.detail);
});

// Warnings
document.addEventListener('become-kyc:warning', (event) => {
  console.warn('SDK warnings:', event.detail.warnings);
});
```

### Become Button

```javascript
const button = document.querySelector('become-button');

button.addEventListener('become:result', (event) => {
  console.log('Verificación enviada:', event.detail.flow);
});

button.addEventListener('become:errorSdk', (event) => {
  console.error('Error de verificación:', event.detail);
});

button.addEventListener('become:userFinishedSdk', (event) => {
  console.log('Usuario terminó:', event.detail);
});

button.addEventListener('become:exitedSdk', (event) => {
  console.log('Usuario salió:', event.detail);
});
```

---

## Resumen de Flujo de Eventos

Estas secuencias son para `<become-kyc-sdk>`. El botón usa los nombres `become:*` en la tabla arriba. La página alojada no expone esta secuencia a tu aplicación.

### Flujo de Onboarding Exitoso

1. `become-kyc:ready` — SDK montado
2. `become-kyc:event` (stepLifecycleEvent: `intro`, `initiated`)
3. `become-kyc:event` (stepLifecycleEvent: `intro`, `completed`)
4. `become-kyc:event` (stepLifecycleEvent: `atdp`, `initiated`)
5. `become-kyc:event` (stepLifecycleEvent: `atdp`, `completed`)
6. `become-kyc:event` (stepLifecycleEvent: `contactValidation`, `initiated`)
7. `become-kyc:event` (stepLifecycleEvent: `contactValidation`, `completed`)
8. `become-kyc:event` (stepLifecycleEvent: `documentType`, `initiated`)
9. `become-kyc:event` (stepLifecycleEvent: `documentType`, `completed`)
10. `become-kyc:event` (stepLifecycleEvent: `countrySelection`, `initiated`)
11. `become-kyc:event` (stepLifecycleEvent: `countrySelection`, `completed`)
12. `become-kyc:event` (stepLifecycleEvent: `capture`, `initiated`)
13. `become-kyc:event` (stepLifecycleEvent: `capture`, `completed`)
14. `become-kyc:event` (stepLifecycleEvent: `liveness`, `initiated`)
15. `become-kyc:event` (stepLifecycleEvent: `liveness`, `completed`)
16. `become-kyc:event` (stepLifecycleEvent: `result`, `initiated`)
17. `become-kyc:event` (stepLifecycleEvent: `result`, `completed`)
18. `become-kyc:event` (action: `result`, payload con datos del flujo)
19. `become-kyc:event` (action: `userFinished`)

### Usuario Sale Temprano

1. `become-kyc:event` (action: `exitedSdk`)
2. Componente se auto-elimina del DOM

### Usuario Declina ATDP

1. `become-kyc:event` (action: `atdpDeclined`)
2. `become-kyc:event` (action: `exitedSdk`)
3. Componente se auto-elimina del DOM

### Token Rechazado / Error Final

1. `become-kyc:error` (code: `401`) — solo cuando la API rechazó el token en el envío
2. La persona cierra la pantalla de error
3. `become-kyc:error` (code: `RESULT_FAILED`)
4. `become-kyc:event` (action: `userFinished`)
5. El navegador abre `redirect-url`, si está configurado. Componente se auto-elimina del DOM

---

## Distinguiendo Envío, Cancelación y Falla

Estos finales describen cómo terminó el SDK, no el resultado de la transacción. Tras cualquiera de ellos la responsabilidad del SDK está completa. Obtén los resultados de la transacción con la API: [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

| Resultado | Eventos |
|-----------|---------|
| **Enviada** | `become-kyc:event` con `action: 'result'` → `action: 'userFinished'` |
| **Usuario canceló** | `become-kyc:event` con `action: 'exitedSdk'` |
| **ATDP declinado** | `become-kyc:event` con `action: 'atdpDeclined'`, luego `action: 'exitedSdk'` |
| **Error final** | `become-kyc:error` con `code: 'RESULT_FAILED'` → `become-kyc:event` con `action: 'userFinished'` |
| **Falla de startup** | `become-kyc:error` con `code: 'CONFIG_FETCH_FAILED'` (verificar `retryable`) |

Un ATDP declinado también termina con `exitedSdk`, así que verifica `atdpDeclined` antes de tratar `exitedSdk` como una cancelación. Un error final también termina con `userFinished`, así que verifica `result` antes de tratar `userFinished` como una verificación enviada.

Para el Become Button, verificar `become:result` (enviada), `become:userFinishedSdk` (terminado, tras un envío o un error final), `become:exitedSdk` (cancelado o declinado), `become:errorSdk` (error).

Para ver qué ve la persona cuando el startup falla, consulta [Troubleshooting](troubleshooting.md).