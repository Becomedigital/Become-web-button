# KYC Web Component

Método principal de integración para Become KYC. Incrusta el flujo de verificación en tu aplicación usando el custom element `<become-kyc-sdk>`.

Antes de empezar, ten tu ID de contrato y un access token generado por tu backend. Ver [Requisitos previos](integration-guide.md#requisitos-previos). Esta página cubre la etapa 2 de la integración, la ejecución del SDK. El webhook y la obtención de resultados están en la [guía de integración](integration-guide.md).

## Incluir el Bundle

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>
```

El script es autónomo. No se requiere instalación adicional.

## Uso Básico

```html
<become-kyc-sdk
  mode="embed"
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  user-id="USER456"
  flow="onboarding"
  locale="es"
  country="CO"
  redirect-url="https://myapp.com/thank-you"
></become-kyc-sdk>
```

## Atributos

### Requeridos

| Atributo | Descripción |
|----------|-------------|
| `contract-id` | Identificador del contrato |
| `access-token` | Token de acceso JWT, generado por tu backend. Ver [Generar el access token](integration-guide.md#generar-el-access-token) |

### Atributos opcionales comunes

| Atributo | Descripción | Valores |
|----------|-------------|---------|
| `user-id` | Identificador de usuario | Opcional en `onboarding`, requerido en `reverification` |
| `flow` | Tipo de flujo | `onboarding` (default, verificación), `reverification` |
| `locale` | Locale de idioma | `es` (default). Ver [Textos y locales](customization.md#textos-y-locales) |
| `country` | Código de país ISO 3166 | Omite el paso de selección de país |
| `doc-type` | Tipo de documento | `national-id`, `passport`, `driving-license` |
| `redirect-url` | Página que abre el navegador cuando la persona cierra la pantalla de resultado | También se abre tras un error final. Ver [Ciclo de Vida](#ciclo-de-vida) |
| `webhook-url` | Alternativa temporal al webhook configurado en el backend | No recomendado. Ver [Notificación por webhook](integration-guide.md#notificacion-por-webhook) |
| `mode` | Modo de visualización | `embed` (default), `overlay`, `fullscreen` |
| `theme-mode` | Qué paleta está activa | `light` (usado si se omite), `dark`, `system`. Ver [Theme mode](customization.md#theme-mode) |

Todos los atributos, sus nombres alternativos y las reglas de cada valor están en la [referencia de API](api.md#become-kyc-sdk).

Configura los valores con atributos; el elemento no tiene propiedades de JavaScript para ellos. Cambiar `theme-mode` cambia la paleta en el lugar. Cambiar cualquier otro atributo reinicia la verificación desde el primer paso.

## Configurar

Configura colores, logo, textos y opciones de UI de tu contrato en el Dashboard. Para sobrescribirlos en una página, llama a `setConfig()`:

```javascript
const sdk = document.querySelector('become-kyc-sdk');
sdk.setConfig({ ui: { showStatusIcons: true } });
```

Todas las opciones se describen en [customization.md](customization.md).

## Métodos

| Método | Descripción |
|--------|-------------|
| `setConfig(config)` | Sobrescribe valores de presentación de tu contrato: `theming`, `components`, `branding`, `texts`, `ui`. Llámalo antes o después de añadir el elemento. Las llamadas se acumulan: cada una cambia solo los campos que envía. Un valor inválido restablece su grupo a los defaults y emite `become-kyc:warning` |
| `getConfig()` | La configuración resuelta en uso. `null` hasta que el elemento ha iniciado |
| `getResolvedSteps()` | Los pasos del flujo activo, en orden. Vacío hasta que el elemento ha iniciado |

`setConfig()` no cambia la paleta (usa `theme-mode`) ni los valores de runtime (usa atributos). Las firmas y los tipos están en la [referencia de API](api.md#métodos).

## Manejar el Resultado

El elemento despacha eventos `become-kyc:*`. Burbujean hasta `document`. Úsalos para seguir a la persona en el navegador, por ejemplo para actualizar tu página cuando el flujo se cierra.

```javascript
sdk.addEventListener('become-kyc:event', (event) => {
  const { action, payload } = event.detail;
  if (action === 'result') console.log('Verificación enviada');
  if (action === 'exitedSdk') console.log('La persona salió del flujo');
});

sdk.addEventListener('become-kyc:error', (event) => {
  console.error('SDK error:', event.detail.code);
});
```

`result` significa que la API aceptó el envío de la verificación. Su `payload.data` es la respuesta a ese envío, no el resultado de la transacción. Obtén los resultados de la transacción desde tu sistema con la API, tras la notificación por webhook. Ver [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

Ver [events.md](events.md) para cada evento, payload y secuencia.

## Ciclo de Vida

1. **Load** — Incluye el bundle del SDK.
2. **Mount** — Añade el custom element al DOM. Muestra `loading-text` mientras carga la configuración del contrato, luego renderiza el flujo y emite `become-kyc:ready`.
3. **Flow** — El SDK renderiza los pasos del flujo resuelto secuencialmente.
4. **Finish** — El SDK envía la verificación. Cuando la API la acepta, el SDK emite `result`, y luego `userFinished` cuando la persona cierra la pantalla de resultado. En un error final, cerrar la pantalla de error emite `become-kyc:error` con `RESULT_FAILED`, y luego `userFinished`. En ambos casos, si `redirect-url` está configurado, el navegador lo abre a continuación.
5. **Cleanup** — El componente se auto-elimina del DOM tras `userFinished` o `exitedSdk`. Declinar los términos de tratamiento de datos emite `atdpDeclined` seguido de `exitedSdk`. `redirect-url` no se abre tras `exitedSdk`.

Tras el cleanup, la responsabilidad del SDK está completa. Tu sistema continúa con la [notificación por webhook](integration-guide.md#notificacion-por-webhook) y la [obtención de resultados](integration-guide.md#obtener-los-resultados-de-la-transaccion).

Si el startup falla, ver [Troubleshooting](troubleshooting.md#fallas-de-startup).

## Modos de Visualización

| Modo | Comportamiento |
|------|--------------|
| `embed` | Rellena el contenedor host. Scroll interno cuando el contenido es más alto que el espacio. |
| `overlay` | Modal centrado con backdrop. Muestra un control de cierre; cerrar emite `exitedSdk` |
| `fullscreen` | Cubre todo el viewport con el fondo del tema. Sin control de cierre |

## Layout

El componente se adapta al tamaño del elemento en el que lo colocas. En modo `embed` ese tamaño es tu contenedor, no la ventana del navegador. Un teléfono alto con el componente dentro de un área corta se mantiene compacto. Una ventana más pequeña con un área alta obtiene el layout más abierto. Nada hay que configurar para esto.

### Embed

Establece un width y un height en el elemento host, o en un padre que ya tenga un height definido. Un height de `100%` no hace nada útil hasta que algún ancestro tenga uno.

El componente rellena esa caja. No hará layout más estrecho que 280px ni más corto que 560px. Si le das menos, hace scroll dentro de su propio elemento en lugar de desbordar tu página. Dimensiona el host al menos ese tamaño para que la persona que completa la verificación no haga scroll dentro del componente.

El ancho y el espaciado de la tarjeta son configuración: ver [Ancho de tarjeta y densidad](customization.md#ancho-de-tarjeta-y-densidad).

### Overlay y fullscreen

Estos modos cubren el viewport. El flujo se pinta en su propia capa, un hijo directo de `<body>` sobre el contenido de tu página, así que dónde colocas el tag, su tamaño y los estilos de sus ancestros no lo afectan. Mientras el flujo está abierto la página no hace scroll detrás, y el foco vuelve a donde estaba cuando el flujo se cierra. La tarjeta se mantiene dentro del viewport y conserva un tamaño estable de paso a paso.

### Qué ve la gente

En la pantalla de bienvenida inicial, y en las introducciones a captura de documento y verificación facial, se usa espacio vertical extra cuando el contenedor es más alto que el texto. Las mismas pantallas se mantienen compactas cuando el texto ya llena el área. La acción primaria permanece disponible. Si el texto es más largo que el área, el contenido hace scroll y la acción sigue alcanzable. El texto no se recorta para ajustar.

El indicador de progreso aparece en los pasos por los que la persona avanza. La pantalla de bienvenida inicial y la pantalla de resultado final no lo muestran. También se oculta mientras la cámara está en uso, y vuelve cuando el paso de cámara termina.

## Requisitos del Navegador

- Navegador moderno con soporte de Custom Elements y Shadow DOM
- Target JavaScript ES2020+
- Acceso de red al bundle del SDK y endpoints de API

## Ejemplo Mínimo

```html
<!DOCTYPE html>
<html>
<head>
  <title>KYC Verification</title>
</head>
<body>
  <div id="kyc-root" style="width: 100%; max-width: 480px; height: 640px;"></div>

  <script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>
  <script>
    const container = document.getElementById('kyc-root');
    const sdk = document.createElement('become-kyc-sdk');
    sdk.setAttribute('mode', 'embed');
    sdk.setAttribute('contract-id', 'contract_123');
    sdk.setAttribute('access-token', 'eyJhbGciOiJIUzI1NiIs...');
    sdk.setAttribute('flow', 'onboarding');
    sdk.setAttribute('locale', 'es');
    container.appendChild(sdk);

    document.addEventListener('become-kyc:event', (e) => {
      console.log('SDK event:', e.detail);
    });
  </script>
</body>
</html>
```

## Siguientes Pasos

- [Guía de integración](integration-guide.md) — requisitos previos, ejemplo por WhatsApp, webhook y obtención de resultados.
- [Personalización](customization.md) — colores, apariencia, logo, textos y opciones de UI.
- [Eventos](events.md) — payloads y secuencias de eventos.
- [Referencia de API](api.md) — cada atributo, método y tipo.
- [Troubleshooting](troubleshooting.md) — fallas de startup y problemas comunes.
