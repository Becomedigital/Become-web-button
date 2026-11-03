# Guía de integración

El recorrido completo de una integración de Become KYC, desde las credenciales hasta los resultados de la transacción. Léela una vez antes de empezar. Las guías de cada producto ([web-sdk.md](web-sdk.md), [button.md](button.md), [hosted-web.md](hosted-web.md)) los cubren en detalle.

Los ejemplos usan el Web SDK (`<become-kyc-sdk>`), salvo el ejemplo de WhatsApp, que usa la página alojada. Las mismas etapas aplican a todos los productos.

Contenido:

- [Cómo funciona una integración](#como-funciona-una-integracion)
- [Requisitos previos](#requisitos-previos)
- [Generar el access token](#generar-el-access-token)
- [Validación del token y seguridad](#validacion-del-token-y-seguridad)
- [Ejecutar el SDK](#ejecutar-el-sdk)
- [Ejemplo: flujo por WhatsApp](#ejemplo-flujo-por-whatsapp)
- [Notificación por webhook](#notificacion-por-webhook)
- [Obtener los resultados de la transacción](#obtener-los-resultados-de-la-transaccion)
- [Responsabilidades de un vistazo](#responsabilidades-de-un-vistazo)
- [Documentación de la API](#documentacion-de-la-api)

---

<a id="como-funciona-una-integracion"></a>

## Cómo funciona una integración

Una integración tiene cuatro etapas separadas. Cada una tiene su propio responsable y su propio final.

| Etapa | Dónde se ejecuta | Qué ocurre | Termina cuando |
|-------|------------------|------------|----------------|
| 1. [Requisitos previos](#requisitos-previos) | Tu backend | Solicitas un access token con tus credenciales asignadas | Tienes un token para la verificación |
| 2. [Ejecución del SDK](#ejecutar-el-sdk) | El navegador de la persona | El SDK ejecuta la verificación y la envía a la API de Become | El SDK termina. Su responsabilidad está completa |
| 3. [Notificación por webhook](#notificacion-por-webhook) | Backend de Become → tu backend | Se avisa a tu servidor de que una transacción se completó | Tu servidor recibe la notificación |
| 4. [Obtención de resultados](#obtener-los-resultados-de-la-transaccion) | Tu backend → API de Become | Tu sistema solicita los resultados de la transacción | Tienes los resultados |

```text
Tu backend                 Navegador (SDK)               API de Become
     │                          │                             │
     │ 1. POST de token (credenciales asignadas) ────────────▶│
     │◀──────────────────────────────────────── access token ─│
     │── contract-id, access-token, user-id ─▶│               │
     │                          │ 2. la persona completa el flujo
     │                          │── envío de la verificación ▶│  aquí se valida el token
     │                          │   el SDK termina            │
     │◀──────────────────── 3. webhook: resultados disponibles ─│
     │── 4. solicitud de resultados de la transacción ───────▶│
     │◀──────────────────────────── resultados de la transacción ─│
```

El SDK no devuelve los resultados de la transacción a tu página, y el webhook no los incluye. Los resultados siempre vienen de la etapa 4.

---

<a id="requisitos-previos"></a>

## Requisitos previos

### Qué necesitas

| Elemento | Qué es | De dónde viene | Dónde lo usas |
|----------|--------|----------------|---------------|
| Credenciales asignadas | Las credenciales de API asignadas a tu cuenta | Become | Solo en tu backend, para solicitar el access token. Nunca las pongas en una página, un script o un enlace |
| ID de contrato | Identifica tu contrato y su configuración (flujos, colores, logo, textos) | Tu contrato, gestionado en el Dashboard | Atributo `contract-id`, parámetro de URL `contractId` |
| Access token | Un JWT que autoriza la verificación | La solicitud de token descrita abajo | Atributo `access-token`, parámetro de URL `accessToken` |
| ID de usuario | Tu identificador de la persona que se verifica | Tu sistema | Atributo `user-id`, parámetro de URL `userId`. Opcional en verificación, requerido en reverificación |
| Flujo | Qué verificación ejecutar | Tu caso de uso | `flow`: `onboarding` (verificación) o `reverification` |
| Webhook | La URL de tu servidor que recibe la notificación de finalización | Configurado en el backend para tu contrato | No es un valor del SDK. Ver [Notificación por webhook](#notificacion-por-webhook) |
| URL de redirección | Opcional. A dónde va el navegador cuando la persona termina | Tu aplicación | Atributo `redirect-url`, parámetro de URL `redirectUrl` |
| Acceso a la API de resultados | Lo que tu sistema necesita para obtener los resultados de la transacción | La [documentación de la API](#documentacion-de-la-api) | Tu backend, en la etapa 4 |

### Elige el flujo

El SDK soporta dos flujos:

| Flujo | Valor de `flow` | Úsalo para | `user-id` |
|-------|-----------------|------------|-----------|
| Verificación | `onboarding` (por defecto) | Verificar a una persona por primera vez | Opcional. Si falta, el backend genera uno. Pasa el tuyo si después necesitas relacionar la transacción con tu usuario |
| Reverificación | `reverification` | Volver a comprobar a una persona ya verificada | Requerido. El startup falla sin él |

Cualquier valor de `flow` distinto de `reverification` ejecuta `onboarding`.

---

<a id="generar-el-access-token"></a>

## Generar el access token

Tu backend solicita el token a la API de Become con las credenciales que te asignaron. El navegador recibe solo el token resultante.

1. Tu backend envía una solicitud `POST` al endpoint de token con tus credenciales asignadas y el `grant_type` de esta integración.
2. La API responde con un access token.
3. Tu backend pasa el token a la página o al enlace que inicia el SDK, junto con el ID de contrato y, cuando hace falta, el ID de usuario.

El endpoint, los campos de credenciales, el valor de `grant_type`, el formato de la solicitud y la vigencia del token están definidos en la [documentación de la API](#documentacion-de-la-api). Esta guía no los repite.

| Elemento de la solicitud | Valor |
|--------------------------|-------|
| Método | `POST` |
| Endpoint | `<TOKEN_ENDPOINT>`. Ver [documentación de la API](#documentacion-de-la-api) |
| `grant_type` | `<GRANT_TYPE>`. Ver [documentación de la API](#documentacion-de-la-api) |
| Credenciales | `<ASSIGNED_CREDENTIALS>`. Ver [documentación de la API](#documentacion-de-la-api) |
| Token en la respuesta | `<TOKEN_RESPONSE_FIELD>`. Ver [documentación de la API](#documentacion-de-la-api) |

Forma de la solicitud, para completar con los valores de la documentación de la API:

```bash
# Ejecuta esto en tu backend. Nunca en el navegador.
curl -X POST "<TOKEN_ENDPOINT>" \
  -H "Content-Type: <CONTENT_TYPE>" \
  --data "grant_type=<GRANT_TYPE>&<ASSIGNED_CREDENTIALS>"
```

Qué espera el SDK del token:

- El valor debe tener la forma de un JWT: tres segmentos separados por puntos. Si no, el startup falla con `CONFIG_FETCH_FAILED` y el mensaje `Invalid or malformed accessToken`.
- El SDK lo envía como `Authorization: Bearer <token>` en sus solicitudes a la API de Become.
- Debe seguir siendo válido cuando la persona llegue al final del flujo. Ver [Validación del token y seguridad](#validacion-del-token-y-seguridad).

---

<a id="validacion-del-token-y-seguridad"></a>

## Validación del token y seguridad

Por razones de seguridad, el SDK no valida el access token al iniciar.

Antes del startup, el SDK solo comprueba que haya un token y que tenga la forma de un JWT. No comprueba la firma, la expiración ni lo que el token permite. El token lo valida la API. La validación final ocurre en la última etapa, cuando la API recibe el envío de la verificación desde el servicio responsable.

Qué significa esto para tu integración:

- Un token que pasa el startup puede ser rechazado al final. En ese caso `<become-kyc-sdk>` emite `become-kyc:error` con `code: 401`, y la persona ve el mensaje de autorización en la pantalla de resultado.
- Genera el token poco antes de que la persona empiece, para que no expire mientras completa el flujo.
- El token llega al navegador: es un atributo del elemento o un parámetro del enlace. Tus credenciales asignadas no deben llegar. Mantén la solicitud de token en tu backend.
- Envía los enlaces de verificación solo a la persona que se verifica. El enlace lleva el token.
- Las solicitudes propias del SDK también llevan el token. Si la API rechaza la solicitud de configuración en el startup, el startup falla con `CONFIG_FETCH_FAILED` y `status` 401 o 403. Ver [Troubleshooting](troubleshooting.md#fallas-de-startup).

---

<a id="ejecutar-el-sdk"></a>

## Ejecutar el SDK

Inicia el SDK con los valores de los requisitos previos:

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>

<become-kyc-sdk
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  user-id="USER456"
  flow="onboarding"
  locale="es"
  redirect-url="https://myapp.com/thank-you"
></become-kyc-sdk>
```

Para reverificación, configura `flow="reverification"` y el `user-id` de la persona ya verificada.

La persona recorre los pasos de tu contrato. Cuando termina, el SDK envía la verificación a la API de Become. Los modos de visualización, el layout y cada atributo están en [web-sdk.md](web-sdk.md).

<a id="cuando-termina-la-responsabilidad-del-sdk"></a>

### Cuándo termina la responsabilidad del SDK

El trabajo del SDK termina cuando la persona sale del flujo. Estos son los finales posibles de `<become-kyc-sdk>`:

| Final | Eventos, en orden | Después |
|-------|-------------------|---------|
| Verificación enviada | `become-kyc:event` `result`, y luego `userFinished` cuando la persona cierra la pantalla de resultado | Se abre `redirect-url`, si está configurado. El elemento se elimina |
| Error final | `become-kyc:error` `401` si el token fue rechazado. Cuando la persona cierra la pantalla de error: `become-kyc:error` `RESULT_FAILED`, y luego `userFinished` | Se abre `redirect-url`, si está configurado. El elemento se elimina |
| La persona cierra el flujo | `exitedSdk` | El elemento se elimina. `redirect-url` no se abre |
| La persona declina los términos de tratamiento de datos | `atdpDeclined`, y luego `exitedSdk` | El elemento se elimina. `redirect-url` no se abre |

Después de cualquiera de ellos, el SDK completó su parte. No obtiene los resultados de la transacción ni los espera.

Ten en cuenta:

- `result` significa que la API aceptó el envío de la verificación. `payload.data` es la respuesta a ese envío. No es el resultado de la transacción. Obtén el resultado en la [etapa 4](#obtener-los-resultados-de-la-transaccion).
- Abrir `redirect-url` es una navegación del navegador. También ocurre tras un error final, así que llegar ahí no significa que la verificación tuvo éxito.
- El Become Button reporta los mismos finales con sus eventos `become:*`. La página alojada no emite eventos a tu aplicación. Ver [events.md](events.md).

---

<a id="ejemplo-flujo-por-whatsapp"></a>

## Ejemplo: flujo por WhatsApp

La persona se queda en tu conversación de WhatsApp, salvo durante la verificación. Tu integración envía un enlace a la página alojada de Become, la página alojada devuelve a la persona al chat, y tu integración continúa la conversación cuando llega el webhook y se obtienen los resultados.

```text
Persona (WhatsApp)   Tu integración de WhatsApp   Página alojada (Become)   API de Become
   │── conversa ────────────▶│                             │                    │
   │                         │── 1. solicitud de token ────────────────────────▶│
   │◀── 2. enlace de verificación                           │                    │
   │── 3. abre el enlace ──────────────────────────────────▶│                    │
   │                         │                             │── 4. envío ───────▶│
   │◀── 5. redirección a wa.me ─────────────────────────────│                    │
   │                         │◀──────────── 6. webhook: resultados disponibles ──│
   │                         │── 7. obtiene los resultados ────────────────────▶│
   │◀── 8. la conversación continúa                         │                    │
```

### Pasos

1. La persona conversa con tu empresa por WhatsApp, y tu integración decide que debe verificarse.
2. Tu backend solicita un access token. Ver [Generar el access token](#generar-el-access-token).
3. Tu backend construye un enlace a la página alojada, con `redirectUrl` apuntando a tu chat de WhatsApp, y lo envía en la conversación.
4. La persona abre el enlace y completa la verificación en la página alojada.
5. La página alojada redirige el navegador a `redirectUrl`. WhatsApp se abre y la persona vuelve al chat.
6. Tu servidor recibe la [notificación por webhook](#notificacion-por-webhook).
7. Tu sistema [obtiene los resultados de la transacción](#obtener-los-resultados-de-la-transaccion) con la API.
8. Tu integración continúa la conversación según los resultados.

### Construir el enlace

`https://wa.me/<número>` es el formato de enlace de WhatsApp para abrir un chat. Usa el número de tu empresa en formato internacional, solo dígitos. Construye el enlace en tu backend para que cada valor quede codificado para URL:

```javascript
// Tu backend, después de solicitar el access token
const link = new URL('https://websdk.svi.becomedigital.net/');
link.search = new URLSearchParams({
  contractId,
  accessToken,
  userId, // te permite relacionar la transacción con esta conversación
  flow: 'onboarding',
  locale: 'es',
  redirectUrl: 'https://wa.me/15551234567',
}).toString();
// Envía link.toString() a la persona en la conversación de WhatsApp.
```

Para reverificación, usa `flow: 'reverification'` y el `userId` de la persona ya verificada. Todos los parámetros están en [hosted-web.md](hosted-web.md).

### Qué esperar

- La redirección solo devuelve a la persona al chat. No te dice el resultado: la página alojada redirige en cuanto la API acepta la verificación, y también cuando la persona cierra una pantalla de error final. Continúa la conversación a partir del webhook y de los resultados obtenidos, no del regreso de la persona.
- La persona puede volver al chat antes de que llegue el webhook. Tu integración puede responder que la verificación se está procesando, y continuar cuando obtenga los resultados.
- Si el startup falla o la persona declina los términos de tratamiento de datos, la página alojada no redirige. La persona vuelve a WhatsApp por su cuenta. Contempla a una persona que nunca termina, por ejemplo con un tiempo límite en tu conversación.
- La página alojada no te emite eventos del navegador. Todo lo que tu integración necesita viene del webhook y de la API.
- El enlace lleva el access token. Envíalo solo a la persona que se verifica.

### Alternativa: tu propia página con el Web SDK

Úsala cuando la página de verificación deba estar en tu dominio, o cuando quieras los eventos del navegador. El enlace del paso 3 apunta a tu página, y la página inicia `<become-kyc-sdk>` con `redirect-url` apuntando de vuelta al chat. Los pasos 5 a 8 no cambian.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verificación de identidad</title>
</head>
<body>
  <script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>
  <script>
    async function startVerification() {
      // Tu propio endpoint: solicita el access token en tu servidor.
      // Su nombre y la forma de su respuesta los defines tú.
      const session = new URLSearchParams(location.search).get('session');
      const response = await fetch('/kyc/session?session=' + encodeURIComponent(session));
      const { contractId, accessToken, userId } = await response.json();

      const sdk = document.createElement('become-kyc-sdk');
      sdk.setAttribute('mode', 'fullscreen');
      sdk.setAttribute('contract-id', contractId);
      sdk.setAttribute('access-token', accessToken);
      sdk.setAttribute('user-id', userId);
      sdk.setAttribute('flow', 'onboarding');
      sdk.setAttribute('locale', 'es');
      // De vuelta al chat cuando la persona cierra la pantalla de resultado.
      sdk.setAttribute('redirect-url', 'https://wa.me/15551234567');

      sdk.addEventListener('become-kyc:event', (event) => {
        if (event.detail.action === 'exitedSdk') {
          // La persona salió sin terminar. Ofrece una forma de volver al chat.
        }
      });
      sdk.addEventListener('become-kyc:error', (event) => {
        console.error('Error de verificación:', event.detail.code);
      });

      document.body.appendChild(sdk);
    }

    startVerification();
  </script>
</body>
</html>
```

`fullscreen` se adapta a un enlace abierto en el teléfono: el flujo cubre el viewport y no tiene control de cierre. Con `overlay`, la persona puede cerrar el flujo, y `exitedSdk` no abre `redirect-url`.

En tu página, el SDK abre `redirect-url` tras `userFinished`, cuando la persona cierra la pantalla de resultado o de error final, no en cuanto se acepta el envío.

### Otros canales

El mismo enfoque aplica donde la persona reciba un enlace, como email o SMS, con cualquiera de las dos opciones. Solo cambia el destino de la redirección: apúntalo a donde la persona deba continuar, por ejemplo una página de tu sitio o tu app. El webhook y la obtención de resultados no cambian.

---

<a id="notificacion-por-webhook"></a>

## Notificación por webhook

El webhook avisa a tu servidor de que una transacción se completó y sus resultados están listos para obtenerse.

### No entrega datos de la transacción

El webhook es una notificación. No contiene los resultados de la transacción. Cuando llega, tu sistema obtiene los resultados con la API. Ver [Obtener los resultados de la transacción](#obtener-los-resultados-de-la-transaccion).

Es una llamada HTTP a tu servidor. No es un evento del navegador, y los listeners de tu página no la reciben.

### Cómo se configura

| Opción | Estado | Cómo |
|--------|--------|------|
| Configuración en el backend | Recomendada | El webhook se configura en el backend para tu contrato. El SDK no necesita ningún valor |
| Atributo `webhook-url`, parámetro de URL `webhookUrl` | Opcional y temporal. No recomendada | El SDK envía el valor junto con el envío de la verificación |

El valor de runtime existe como mecanismo temporal. Un valor puesto en una página o un enlace pasa por el navegador de la persona. Prefiere la configuración en el backend.

El contenido de la notificación, cómo autenticarla y cómo responderla están definidos en la [documentación de la API](#documentacion-de-la-api).

---

<a id="obtener-los-resultados-de-la-transaccion"></a>

## Obtener los resultados de la transacción

Los resultados de la transacción siempre se obtienen por separado, con la API, desde tu propio sistema. No los entregan los eventos del SDK, ni `redirect-url`, ni el webhook.

1. Espera la [notificación por webhook](#notificacion-por-webhook).
2. Desde tu sistema, solicita los resultados de la transacción a la API.
3. Usa los resultados según tu proceso.

Dónde se ejecuta el paso 2 depende de tu arquitectura. Por ejemplo, puede ser parte de tu integración de WhatsApp, antes de responder a la persona, o una API interna o externa propia. Esta guía no impone ninguna.

La solicitud, sus parámetros, la autenticación y el formato de la respuesta están definidos en la [documentación de la API KYC de Become](https://becomedigital.gitbook.io/kyc_api_es). La validación es asíncrona, así que la respuesta cambia a medida que avanza la validación. Ver las [notas de la documentación de la API](#documentacion-de-la-api).

---

<a id="responsabilidades-de-un-vistazo"></a>

## Responsabilidades de un vistazo

| Etapa | Responsable | Se encarga de |
|-------|-------------|---------------|
| Requisitos previos | Tu backend | Guardar las credenciales asignadas, solicitar el access token, elegir `flow` y `user-id` |
| Ejecución del SDK | SDK de Become | Ejecutar el flujo en el navegador y enviar la verificación |
| Validación final del token | API de Become | Validar el token cuando recibe el envío de la verificación |
| Notificación por webhook | Backend de Become | Avisar a tu servidor de que los resultados están listos |
| Obtención de resultados | Tu sistema | Solicitar los resultados de la transacción a la API y actuar sobre ellos |

---

<a id="documentacion-de-la-api"></a>

## Documentación de la API

La única fuente autoritativa de la API de Become es la **[documentación de la API KYC de Become](https://becomedigital.gitbook.io/kyc_api_es)**. Úsala para:

- **Generación del token:** endpoint, campos de las credenciales asignadas, `grant_type`, formato de la solicitud, respuesta y vigencia del token.
- **Obtención de resultados de la transacción:** solicitud, parámetros, autenticación y respuesta.
- **Notificación por webhook:** contenido, autenticación y respuesta esperada.

Esta guía no repite esas especificaciones. Cuando esta guía y la documentación de la API difieran en un detalle de la API, aplica la documentación de la API.

Notas:

- La validación es asíncrona. La respuesta de la solicitud de resultados cambia a medida que avanza la validación. Espera la [notificación por webhook](#notificacion-por-webhook) antes de obtener los resultados, y maneja los estados que describe la documentación de la API.
- Para obtener tus credenciales asignadas, o para asistencia técnica, contacta al equipo de soporte de Become Digital.
- Los escenarios de prueba de sandbox, como los sufijos del ID de usuario, están descritos en la documentación de la API para llamadas directas a la API. Con el SDK, la prueba de vida siempre forma parte del flujo. Lee la sección de sandbox de la documentación de la API antes de probar una integración con el SDK.
