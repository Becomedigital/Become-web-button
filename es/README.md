# Documentación para integradores

Guías para integrar Become KYC: qué producto usar, cómo cargarlo y qué atributos, métodos y eventos soporta.

## Elige un producto

| Producto | Úsalo cuando | Qué cargas |
|----------|--------------|------------|
| [Become Button](button.md) | Quieres un botón listo que abre la verificación al hacer click | `become-web-button.js` y `<become-button>` |
| [Web SDK](web-sdk.md) | Colocas la verificación dentro del layout de tu propia página | `become-kyc-sdk.js` y `<become-kyc-sdk>` |
| [Hosted web](hosted-web.md) | Envías un enlace de verificación, incluyendo desde WhatsApp o email | Una URL en el sitio alojado. Sin instalación de script |

El botón y el Web SDK ejecutan el mismo flujo, onboarding y reverificación, con la misma configuración de contrato y `setConfig()`. Se diferencian en cómo se coloca el flujo y cuánto puede seguir tu página:

| | Become Button | Web SDK |
|---|---|---|
| Inicia | Al hacer click en el botón | Cuando el elemento se agrega a la página |
| Modos | `overlay` (por defecto), `embed`, `fullscreen` | `embed` (por defecto), `overlay`, `fullscreen` |
| Dónde se muestra el flujo | Siempre sobre la página, en cualquier modo | En `embed`, dentro de tu contenedor |
| Eventos | Resultado, finalización, salida y error | Los mismos, más listo, advertencias, cambios de paso y ciclo de vida de los pasos |
| Métodos | `setConfig()`, `getConfig()`, `click()` | `setConfig()`, `getConfig()`, `getResolvedSteps()` |

La página alojada es un enlace a pantalla completa. No proporciona los eventos del navegador de los custom elements, incluso cuando la URL se coloca en un iframe.

## Pasos de integración

La [guía de integración](integration-guide.md) recorre estos pasos de principio a fin, con un ejemplo por WhatsApp.

1. **Reúne los requisitos previos.** Tus credenciales asignadas, el ID de contrato y el ID de usuario. Tu backend solicita el access token: [Requisitos previos](integration-guide.md#requisitos-previos).
2. **Elige un producto** de la tabla de arriba.
3. **Cárgalo e inícialo** con tu ID de contrato y access token: [web-sdk.md](web-sdk.md), [button.md](button.md), o [hosted-web.md](hosted-web.md).
4. **Configura tu contrato** en el Dashboard: colores, logo, textos y opciones de UI. Sobrescríbelos en una página con `setConfig()`: [customization.md](customization.md).
5. **Sigue a la persona en el navegador**, si lo necesitas, con eventos: [events.md](events.md). Cuando la persona sale del flujo, la responsabilidad del SDK está completa.
6. **Recibe la notificación por webhook** en tu servidor. Te avisa de que los resultados están listos. No los contiene: [Notificación por webhook](integration-guide.md#notificacion-por-webhook).
7. **Obtén los resultados de la transacción** desde tu sistema con la API: [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).
8. **Revisa fallas y casos límite** antes de salir a producción: [troubleshooting.md](troubleshooting.md).

Consulta cualquier atributo, método, campo de configuración o tipo en la [referencia de API](api.md). La generación del token y la obtención de resultados están en la [documentación de la API](integration-guide.md#documentacion-de-la-api).

## Documentos

| Documento | Descripción |
|-----------|-------------|
| [integration-guide.md](integration-guide.md) | De principio a fin: requisitos previos, access token, ejecución del SDK, ejemplo por WhatsApp, webhook y obtención de resultados |
| [web-sdk.md](web-sdk.md) | `<become-kyc-sdk>`: configuración inicial, modos de visualización, layout y ciclo de vida |
| [button.md](button.md) | `<become-button>`: configuración inicial, etiqueta del botón y eventos `become:*` |
| [hosted-web.md](hosted-web.md) | Parámetros de la URL alojada, redirect y comportamiento fullscreen |
| [customization.md](customization.md) | Dashboard y `setConfig()`, theme mode, colores, apariencia, logo, textos e íconos de estado |
| [events.md](events.md) | Nombres y payloads de eventos para el Web SDK y el botón |
| [troubleshooting.md](troubleshooting.md) | Fallas de startup, errores durante el flujo y problemas comunes |
| [api.md](api.md) | Referencia: atributos, propiedades, métodos, parámetros de URL, configuración, eventos y tipos |

## Inicio rápido

Reemplaza `contract_123` por tu ID de contrato y el token por uno generado por tu backend: [Generar el access token](integration-guide.md#generar-el-access-token).

Incrustar:

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>

<become-kyc-sdk
  mode="embed"
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  flow="onboarding"
  locale="es"
></become-kyc-sdk>
```

Become Button:

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-web-button.js"></script>

<become-button
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  flow="onboarding"
  button-text="Iniciar verificación"
></become-button>
```

Enlace alojado:

```
https://websdk.svi.becomedigital.net/?contractId=contract_123&accessToken=eyJhbGciOiJIUzI1NiIs...&flow=onboarding&locale=es
```
