# Become Button

El custom element `<become-button>` muestra un botón que abre el flujo de verificación al hacer click. Ejecuta el mismo flujo que `<become-kyc-sdk>`, onboarding y reverificación, con la misma configuración de contrato. Para elegir entre ellos, ver [Elige un producto](README.md#elige-un-producto).

> **Nota**: El nombre del custom element registrado es `become-button`, no `become-web-button`.

Antes de empezar, ten tu ID de contrato y un access token generado por tu backend. Ver [Requisitos previos](integration-guide.md#requisitos-previos). El webhook y la obtención de resultados son iguales para todos los productos: ver la [guía de integración](integration-guide.md).

## Incluir el Bundle

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-web-button.js"></script>
```

El bundle `<become-button>` es autónomo. No requiere `<become-kyc-sdk>`.

## Uso Básico

```html
<become-button
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  flow="onboarding"
  button-text="Iniciar verificación"
></become-button>
```

Para reverificación, configura `flow="reverification"` y `user-id`.

## Atributos

El botón lee los mismos atributos de verificación que `<become-kyc-sdk>` (`contract-id`, `access-token`, `user-id`, `flow`, `locale`, `country`, `doc-type`, `redirect-url`, `webhook-url`, `theme-mode`, y el resto), más los suyos:

| Atributo | Descripción |
|----------|-------------|
| `mode` | `overlay` (por defecto), `embed` o `fullscreen`. Ver [Modos de visualización](#modos-de-visualización) |
| `button-text` | Texto de la etiqueta del botón (default: "Iniciar verificación") |
| `loading-text` | Texto de carga (default: "Cargando...") |
| `hide-icon` | Ocultar el icono de escudo por defecto (atributo booleano) |

Los valores se leen al hacer click en el botón. La lista completa de atributos, los nombres alternativos (`token`, `data-user-id`, `flowId`, `theme`, `language`, y otros) y las propiedades de JavaScript están en la [referencia de API](api.md#become-button).

## Modos de visualización

El flujo siempre se abre en su propia capa sobre el contenido de tu página, un hijo directo de `<body>`, sin importar dónde esté el botón. La página no hace scroll detrás. El modo define lo que rodea a la tarjeta:

| Modo | Comportamiento |
|------|----------------|
| `overlay` | Tarjeta centrada sobre un fondo oscurecido, con control de cierre |
| `embed` | La tarjeta sobre la página, sin fondo |
| `fullscreen` | Cubre todo el viewport con el fondo del tema |

Para mostrar el flujo dentro de un contenedor de tu propio layout, usa [`<become-kyc-sdk>`](web-sdk.md) en modo `embed`.

## Etiqueta e icono

El botón renderiza su propia etiqueta e icono. El contenido hijo dentro de `<become-button>` se reemplaza cuando el botón se renderiza. Personalízalo con:

- `button-text` y `loading-text` para la etiqueta.
- `hide-icon` para quitar el icono de escudo por defecto.
- La propiedad `icon` para tu propio markup SVG. No se refleja como atributo. Usa solo markup que controlas.

```javascript
const button = document.querySelector('become-button');
button.icon = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">…</svg>';
```

Los colores, el logo y los textos dentro del flujo vienen de la configuración de tu contrato, igual que en el Web SDK. Ver [customization.md](customization.md).

## Métodos

| Método | Descripción |
|--------|-------------|
| `setConfig(publicConfig: Partial<PublicConfig>): void` | Actualiza configuración pública de UI |
| `getConfig(): PublicConfig \| null` | Obtiene la configuración pública resuelta mientras el flujo está abierto |
| `click(): void` | Abre el flujo, como lo hace un click del usuario |

## Eventos

El botón emite sus propios eventos `become:*`, diferentes a los eventos `become-kyc:*` de `<become-kyc-sdk>`. Se disparan en el elemento botón (`bubbles: true`, `composed: true`). Los payloads están en [events.md](events.md#eventos-del-become-button).

| Evento | Cuándo |
|--------|-------|
| `become:result` | La API aceptó el envío de la verificación |
| `become:userFinishedSdk` | La persona cerró la pantalla de resultado, tras éxito o un error final |
| `become:exitedSdk` | Usuario cerró el SDK |
| `become:errorSdk` | Errores fatales o de token |

Estos eventos no entregan los resultados de la transacción. Obtenlos con la API: [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

## Notas Importantes

- El botón carga el SDK perezosamente al hacer click.
- Tras `become:userFinishedSdk` o `become:exitedSdk` el flujo se cierra y el botón puede abrirlo de nuevo.
- Si `redirect-url` está configurado, el navegador lo abre tras `become:userFinishedSdk`, que también sigue a un error final. No se abre tras `become:exitedSdk`.
- Los eventos se emiten en el elemento botón, no en `document.documentElement`.
- Los nombres de eventos y payloads difieren del KYC Web Component (eventos `become-kyc:*`).
- El modo por defecto es `overlay` (no `embed` como `<become-kyc-sdk>`).
- No hay función `createBecomeButton()`. El uso programático es `document.createElement('become-button')`, property setters, y `click()`.
- Una falla de startup aparece al hacer click en el botón. Dónde se muestra depende de `mode`. Ver [Troubleshooting](troubleshooting.md#become-button).

## Ejemplo Mínimo

```html
<!DOCTYPE html>
<html>
<head>
  <title>KYC Verification Button</title>
</head>
<body>
  <script src="https://websdk.svi.becomedigital.net/sdk/become-web-button.js"></script>
  <become-button
    contract-id="contract_123"
    access-token="eyJhbGciOiJIUzI1NiIs..."
    flow="onboarding"
    button-text="Iniciar verificación"
  ></become-button>
  <script>
    const button = document.querySelector('become-button');
    button.addEventListener('become:result', (e) => {
      console.log('Verificación enviada:', e.detail.flow);
    });
    button.addEventListener('become:errorSdk', (e) => {
      console.error('Verification error:', e.detail);
    });
  </script>
</body>
</html>
```
