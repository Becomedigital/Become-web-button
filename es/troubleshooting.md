# Troubleshooting

Qué ve la persona cuando algo falla, qué evento recibe tu página, y soluciones a problemas comunes de integración. Los payloads de eventos y los códigos de error están en [events.md](events.md#codigos-de-error).

## Fallas de startup

El startup carga la configuración de tu contrato y verifica los valores de runtime. Falla cuando falta `contract-id` o `access-token`, el token está malformado, falta `user-id` en `reverification`, o la request de configuración falla. El elemento muestra una frase segura a la persona y tu página recibe el diagnóstico.

### Web SDK

`<become-kyc-sdk>` pinta el flujo solo tras el éxito del startup. Hasta entonces, posee el error visible. Usa el modo ya seleccionado por el atributo `mode` (default `embed`):

| Cuándo | Qué ve el usuario |
|------|-------------------|
| `embed` startup falla | Un mensaje dentro del elemento, en el área embebida. Sin notice a nivel de página. |
| `overlay` o `fullscreen` startup falla antes de que el SDK abra | El elemento mismo se convierte en la superficie del viewport y muestra un diálogo de alerta. Cerrar descarta esa superficie. El elemento permanece en la página. |
| Startup puede reintentarse (`retryable`) | Un control de reintento ejecuta startup de nuevo. |
| El SDK ya está montado | El SDK pinta la falla dentro de la experiencia abierta. El elemento no añade un segundo mensaje. |
| El elemento se elimina mientras startup está en vuelo | No queda superficie de error. |

`become-kyc:error` sigue llevando el diagnóstico (`CONFIG_FETCH_FAILED`, `message`, `status`, `retryable`). La frase en el elemento es la frase del catálogo del SDK (`errors.startup`): no incluye tokens, códigos de estado, o cuerpos de respuesta. Override con `setConfig({ texts })` antes de que el elemento empiece. HTTP 401 y HTTP 403 usan la frase de autorización, no una credencial errónea de usuario final. Las etiquetas de retry y close de startup son `Reintentar` y `Cerrar`. Salir del flujo (`exitedSdk`, `userFinished`, `atdpDeclined`) no es un error de startup.

### Become Button

El botón carga la configuración al hacer click, así que una falla de startup aparece en ese momento:

| Cuándo | Qué ve el usuario |
|--------|-------------------|
| `overlay` (default) o `fullscreen` | Un diálogo de alerta sobre la página, con cerrar, y retry cuando la falla es `retryable`. |
| `embed`, botón visible | El mensaje bajo el botón. |
| `embed`, botón oculto (`hidden`, o `display: none` / `visibility: hidden` en el botón o un ancestro) | Un notice de página no bloqueante con la misma frase, y retry solo cuando `retryable` es true. Cerrar o eliminar el botón elimina el notice. |
| La falla no es `retryable` | El botón queda deshabilitado. |

La falla se emite como `become:errorSdk` (`code`, `message`, `status`, `retryable`). La frase de usuario es la frase del catálogo del SDK (`errors.startup`) y no incluye el texto diagnóstico. Override con `setConfig({ texts })` antes de abrir el SDK. El SDK también emite `become-kyc:error` en `document` por la misma falla. Escucha un contrato.

Después de que el SDK ha abierto, un error se reenvía una vez como `become:errorSdk`. El botón no pinta ese error de nuevo. La salida del usuario no es una falla de startup.

### Página alojada

La página muestra un mensaje para el `locale` que pasaste, con retry solo cuando la falla puede reintentarse. No muestra el access token, y tu aplicación no es notificada en el navegador. Ver [hosted-web.md](hosted-web.md#comportamiento).

## Errores durante el flujo

Una vez abierto el flujo, el SDK muestra los errores dentro de la tarjeta y la persona puede reintentar cuando es posible. Tu página recibe `become-kyc:error` para fallas bloqueantes: `401` cuando el envío de la verificación no está autorizado, y `RESULT_FAILED` cuando la persona cierra la pantalla de error final. Ver [Códigos de error](events.md#codigos-de-error).

La API valida el access token cuando recibe el envío de la verificación, al final del flujo. Un token que expiró mientras la persona completaba el flujo se reporta ahí como `401`. Ver [Validación del token y seguridad](integration-guide.md#validacion-del-token-y-seguridad).

## Problemas comunes

| Síntoma | Causa y solución |
|---------|------------------|
| El flujo embebido está vacío o cortado | El host no tiene height. Da al elemento, o a un padre, un height definido de al menos 560px y un width de al menos 280px. Ver [Layout](web-sdk.md#layout) |
| Mi listener no recibe nada del enlace alojado | Los eventos de la página alojada se quedan dentro de esa página y nunca llegan a la tuya, tampoco cuando está en un iframe. Usa `redirectUrl` en el navegador y la [notificación por webhook](integration-guide.md#notificacion-por-webhook) en tu servidor. `<become-kyc-sdk mode="fullscreen">` en tu propia página sí emite eventos |
| `become-kyc:error` con `401` al final del flujo | La API rechazó el access token en el envío, por ejemplo porque expiró. Genera el token poco antes de que la persona empiece. Ver [Validación del token y seguridad](integration-guide.md#validacion-del-token-y-seguridad) |
| El webhook llega sin datos de la transacción | Es lo esperado. El webhook solo avisa de que los resultados están listos. Obtenlos con la API. Ver [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion) |
| Se emitió `result`, pero `payload.data` no es el resultado de la transacción | Es lo esperado. `data` es la respuesta al envío de la verificación. Obtén los resultados de la transacción con la API |
| El navegador abrió `redirect-url` tras un error | Es lo esperado. `redirect-url` se abre tras `userFinished`, que también sigue a un error final. No trates la redirección como señal de éxito |
| Mi listener `become-kyc:*` no recibe nada del botón | El botón emite eventos `become:*` en el elemento botón. Ver [Eventos](events.md#eventos-del-become-button) |
| El flujo vuelve a empezar solo | Cambió un atributo distinto de `theme-mode`, o el elemento se quitó y se volvió a añadir. Ambos reinician `<become-kyc-sdk>` |
| El elemento desaparece | `<become-kyc-sdk>` se elimina tras `userFinished` y `exitedSdk`, lo que incluye declinar los términos de tratamiento de datos |
| Los textos salen en español con `locale="en"` | El SDK incluye textos en español. Añade textos para ese locale en el Dashboard. Ver [Textos y locales](customization.md#textos-y-locales) |
| Los colores de hover y presionado conservan el color de marca anterior | Configura `primaryHover`, `primaryActive` y `primaryText` junto con `primary`. Ver [Colores](customization.md#colores) |
| `setConfig({ theming: { mode: 'dark' } })` no hace nada | La paleta se selecciona con el atributo `theme-mode`. Ver [Theme mode](customization.md#theme-mode) |
| Se ignora un país, tipo de documento o estado | El valor era inválido y se descartó. `become-kyc:warning` lo lista. Ver [Valores de runtime](api.md#valores-de-runtime) |
| El startup falla en `reverification` | `user-id` es requerido en ese flujo |
| El contenido hijo dentro de `<become-button>` no se muestra | El botón renderiza su propia etiqueta. Usa `button-text`, `hide-icon`, o la propiedad `icon`. Ver [button.md](button.md#etiqueta-e-icono) |
