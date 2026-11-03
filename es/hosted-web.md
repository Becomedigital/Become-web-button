# Integración Web

Integración basada en URL para WhatsApp, email, o enlaces directos. El usuario recibe un enlace y completa la verificación en un flujo a pantalla completa alojado en `https://websdk.svi.becomedigital.net/`.

Antes de construir un enlace, ten tu ID de contrato y un access token generado por tu backend. Ver [Requisitos previos](integration-guide.md#requisitos-previos).

## Formato del Enlace

```
https://websdk.svi.becomedigital.net/?contractId=contract_123&accessToken=eyJ...&flow=onboarding&locale=es
```

## Parámetros

Todos los parámetros se pasan como query parameters de la URL. Codifica cada valor para URL, en especial `redirectUrl`.

### Requeridos

| Parámetro | Descripción |
|-----------|-------------|
| `contractId` | Identificador del contrato |
| `accessToken` | Token de acceso JWT, generado por tu backend. Ver [Generar el access token](integration-guide.md#generar-el-access-token) |

### Parámetros opcionales comunes

| Parámetro | Descripción | Valores |
|-----------|-------------|---------|
| `userId` | Identificador de usuario | Opcional en onboarding, requerido en reverification |
| `flow` | Tipo de flujo | `onboarding` (default, verificación), `reverification` |
| `locale` | Locale de idioma | `es` (default). Ver [Textos y locales](customization.md#textos-y-locales) |
| `country` | Código de país ISO 3166 | Omite selección de país |
| `docType` | Tipo de documento | `national-id`, `passport`, `driving-license` |
| `redirectUrl` | Página que abre el navegador cuando termina la verificación | Ver [Comportamiento](#comportamiento) |
| `webhookUrl` | Alternativa temporal al webhook configurado en el backend | No recomendado. Ver [Notificación por webhook](integration-guide.md#notificacion-por-webhook) |
| `themeMode` | Qué paleta está activa | `light` (usado si se omite), `dark`, `system`. Ver [Theme mode](customization.md#theme-mode) |
| `externaltxid` | ID de transacción externa | Para trazabilidad |

Cada parámetro, y los nombres kebab-case que también se aceptan (`contract-id`, `theme-mode`, etc.), están en la [referencia de API](api.md#url-alojada).

## Construir el enlace

Construye el enlace en tu backend, después de solicitar el access token, para que el token y cada valor queden codificados para URL:

```javascript
// Tu backend
const link = new URL('https://websdk.svi.becomedigital.net/');
link.search = new URLSearchParams({
  contractId,
  accessToken,
  userId,
  flow: 'onboarding',
  locale: 'es',
  redirectUrl: 'https://myapp.com/thank-you',
}).toString();
```

El enlace lleva el access token. Envíalo solo a la persona que se verifica. Para un recorrido completo por WhatsApp, con un `redirectUrl` que devuelve a la persona al chat, ver [Ejemplo: flujo por WhatsApp](integration-guide.md#ejemplo-flujo-por-whatsapp). El mismo enfoque aplica a email y otros canales.

## Comportamiento

- La página alojada lee los query parameters y ejecuta el flujo de verificación en fullscreen. La tarjeta se mantiene dentro de la ventana del navegador.
- El parámetro `mode` se **fuerza a `fullscreen`** independientemente de lo que se pase.
- Si el startup falla, la página muestra un mensaje para el `locale` que pasaste. Un control de retry aparece solo cuando la falla puede reintentarse. La página no muestra el access token. Salir del flujo y una verificación completada no son fallas de startup. Tu aplicación no es notificada de esa falla en el navegador.
- Cuando la API acepta la verificación y `redirectUrl` está configurado, la página alojada navega el navegador a esa URL. Si la página sigue abierta cuando la persona cierra la pantalla de resultado, navega a `redirectUrl` de nuevo.
- Cuando la persona cierra la pantalla de error final, el navegador también navega a `redirectUrl`. Una falla de startup o la persona saliendo del flujo no navega allí. Llegar a `redirectUrl` no significa que la verificación tuvo éxito.
- La persona pasa por el mismo flujo de verificación que en el web component.
- Lenguaje visual, colores, y densidad vienen de la configuración pública del contrato en el Dashboard, las mismas opciones que el web component. No son parámetros de URL. Ver [customization.md](customization.md).

## Después de la verificación

La responsabilidad de la página alojada termina cuando la persona sale del flujo. No entrega el resultado a tu aplicación.

1. **Notificación por webhook.** Se avisa a tu servidor de que la transacción se completó y sus resultados están listos. El webhook se configura en el backend para tu contrato. No incluye datos de la transacción. Ver [Notificación por webhook](integration-guide.md#notificacion-por-webhook).
2. **Obtención de resultados.** Tu sistema solicita los resultados de la transacción con la API. Ver [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

## Ejemplo

```
https://websdk.svi.becomedigital.net/?contractId=contract_123&accessToken=eyJhbGciOiJIUzI1NiIs...&flow=onboarding&locale=es&country=CO&redirectUrl=https%3A%2F%2Fmyapp.com%2Fthank-you
```

## Notas

- `userId` es opcional en `onboarding`. Si no se provee, el backend genera un UUID. Pasa el tuyo si necesitas relacionar la transacción con tu usuario.
- `userId` es requerido en `reverification` para matching.
- `nationalIdType` es un subtipo de `national-id` específico de cada país (ej. `CC`, `CE`, `TI`, `PPT` en Colombia).
- `redirectUrl` es la página que abre el navegador de la persona. No es un callback de JavaScript y no lleva el resultado.
- `webhookUrl` es opcional y temporal. Prefiere el webhook configurado en el backend.
- Esta página no emite `become-kyc:ready`, `become-kyc:event`, `become-kyc:error`, `become-kyc:warning`, o eventos `become:*` a tu aplicación. Escuchar en tu propia página, o en una página que solo enmarca esta URL, no los recibe.
- Puedes mostrar la URL alojada en un iframe. La página circundante sigue sin recibir esos eventos.
- Esto es separado de los scripts que añades a tu propia aplicación. La gente abre un enlace. No instala un paquete.

## Relación con Web Components

| Aspecto | Integración Web | Web Components |
|---------|-----------------|----------------|
| Despliegue | App full-page alojada | Script que añades a tu página |
| Cómo se usa | Abre un enlace alojado | Añade `<become-kyc-sdk>` a tu página |
| Modo | Siempre `fullscreen` | `embed`, `overlay`, `fullscreen` |
| Configuración | Query parameters y la configuración del contrato | Atributos, la configuración del contrato y `setConfig()` |
| En el navegador | Solo `redirectUrl` | Eventos DOM en `<become-kyc-sdk>`, y `redirect-url`. Ver [events.md](events.md) |
| Resultados | Notificación por webhook, luego obtención de resultados con la API | Notificación por webhook, luego obtención de resultados con la API |
| Caso de uso | WhatsApp, email, enlaces directos | Embebido en tu aplicación |

Ambas opciones ejecutan el mismo flujo de verificación. Embébelo en tu aplicación con el web component. Usa esta página alojada cuando necesites enviar un enlace y no quieras alojar la página tú mismo. Un enlace a una página propia que incrusta el web component también sirve para WhatsApp y email. Ver [Ejemplo: flujo por WhatsApp](integration-guide.md#ejemplo-flujo-por-whatsapp).
