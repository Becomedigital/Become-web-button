# Referencia de API

Todo lo que una integración puede usar: los dos custom elements, la URL de la página alojada, el objeto de configuración y los eventos. Para ver cómo combinarlos, empieza por la [guía para integradores](README.md).

| Producto | Script | Tag | Guía |
|----------|--------|-----|------|
| Web SDK | `https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js` | `<become-kyc-sdk>` | [web-sdk.md](web-sdk.md) |
| Become Button | `https://websdk.svi.becomedigital.net/sdk/become-web-button.js` | `<become-button>` | [button.md](button.md) |
| Página alojada | Ninguno. Una URL en `https://websdk.svi.becomedigital.net/` | Ninguno | [hosted-web.md](hosted-web.md) |

Cada script es autónomo y registra su tag una sola vez. No añade nada más a `window`. Los dos scripts son independientes: el botón no necesita `become-kyc-sdk.js`.

Contenido:

- [`<become-kyc-sdk>`](#become-kyc-sdk)
- [`<become-button>`](#become-button)
- [URL alojada](#url-alojada)
- [Valores de runtime](#valores-de-runtime)
- [`PublicConfig`](#publicconfig)
- [Eventos](#eventos)
- [Tipos](#tipos)

---

## `<become-kyc-sdk>`

### Atributos

Configúralos como atributos HTML, o con `setAttribute()` antes o después de añadir el elemento a la página.

| Atributo | Requerido | Default | Valores |
|----------|-----------|---------|---------|
| `contract-id` | Sí | | Identificador del contrato |
| `access-token` | Sí | | Token de acceso JWT, generado por tu backend. Ver [Generar el access token](integration-guide.md#generar-el-access-token) |
| `user-id` | En `reverification` | | Identificador de usuario |
| `flow` | | `onboarding` | `onboarding`, `reverification` |
| `locale` | | `es` | Locale de los textos. Ver [Textos y locales](customization.md#textos-y-locales) |
| `country` | | | Código ISO 3166 alpha-2, o una lista separada por comas. Ver [Valores de runtime](#valores-de-runtime) |
| `state` | | | Código de estado de EE. UU. Solo se usa cuando el país es `US` |
| `doc-type` | | | `national-id`, `passport`, `driving-license`, o una lista separada por comas |
| `national-id-type` | | | Subtipo de ID nacional, por ejemplo `CC`, `CE`, `TI` |
| `national-id-type-choices` | | | Subtipos ofrecidos en el paso de documento, separados por comas |
| `document-number` | | | Número de documento |
| `phone-number-enc` | | | Número de teléfono cifrado, enviado con la verificación |
| `redirect-url` | | | Página que abre el navegador tras `userFinished`. Ver [Valores de runtime](#valores-de-runtime) |
| `webhook-url` | | | Alternativa temporal al webhook configurado en el backend. No recomendado. Ver [Valores de runtime](#valores-de-runtime) |
| `mode` | | `embed` | `embed`, `overlay`, `fullscreen`. `overlay` y `fullscreen` se pintan en su propia capa en la parte superior de la página, no donde está el tag. Ver [web-sdk.md](web-sdk.md) |
| `theme-mode` | | `light` | `light`, `dark`, `system`. Un valor inválido usa `light` |
| `loading-text` | | `Cargando...` | Texto bajo el spinner mientras carga la configuración |

**Alias.** Cada atributo también se lee con su nombre camelCase: `contractId`, `accessToken`, `userId`, `flowType`, `locale`, `redirectUrl`, `webhookUrl`, `phoneNumberEnc`, `country`, `state`, `docType`, `nationalIdType`, `nationalIdTypeChoices`, `documentNumber`, `mode`, `themeMode`. Los nombres de atributos HTML no distinguen mayúsculas, así que `themeMode` y `thememode` son el mismo atributo. Cuando el atributo kebab-case está presente, tiene precedencia.

**Cambiar atributos después del inicio.** `theme-mode` cambia la paleta en el lugar. Cambiar cualquier otro atributo de la tabla reinicia el elemento: se cierra el flujo abierto y la verificación empieza de nuevo desde el primer paso con los nuevos valores. Quitar el elemento de la página y volver a añadirlo también empieza de nuevo.

El elemento no tiene propiedades de JavaScript para estos valores. Usa atributos.

### Métodos

| Método | Devuelve | Descripción |
|--------|----------|-------------|
| `setConfig(config: Partial<PublicConfig>)` | `void` | Aplica overrides de presentación. Llámalo antes o después de que el elemento inicie. Las llamadas se acumulan: cada una cambia solo los campos que envía. Ver [`PublicConfig`](#publicconfig) |
| `getConfig()` | `PublicConfig \| null` | La configuración resuelta en uso: defaults, tu contrato, y luego `setConfig()`. `null` hasta que el elemento ha iniciado |
| `getResolvedSteps()` | `ResolvedStepId[]` | Los pasos del flujo activo, en orden, tras aplicar tu contrato y los valores de runtime. Vacío hasta que el elemento ha iniciado |

La configuración de tu contrato se gestiona en el Dashboard. Usa `setConfig()` para valores que tu página decide en runtime.

### Ciclo de vida

1. **Inicio.** Al añadir el elemento a la página muestra un spinner con `loading-text`, carga la configuración del contrato y renderiza el flujo. Sigue `become-kyc:ready`.
2. **Falla de startup.** Si el startup falla, el elemento muestra la falla él mismo y emite `become-kyc:error`. Ver [Troubleshooting](troubleshooting.md#fallas-de-startup).
3. **Flujo.** La persona avanza por los pasos de `getResolvedSteps()`. Cada transición emite `become-kyc:event`.
4. **Fin.** Cuando la API acepta el envío de la verificación, el elemento emite `result`, y luego `userFinished` cuando la persona cierra la pantalla de resultado. En un error final, cerrar la pantalla de error emite `become-kyc:error` con `RESULT_FAILED`, y luego `userFinished`. Si `redirect-url` está configurado, el navegador lo abre tras `userFinished`.
5. **Eliminación.** El elemento se elimina de la página tras `userFinished` o `exitedSdk`. Declinar los términos de tratamiento de datos emite `atdpDeclined` seguido de `exitedSdk`, así que también se elimina.

Los eventos se despachan en el elemento y burbujean hasta `document`. Estos eventos no entregan los resultados de la transacción. Ver [Obtener los resultados de la transacción](integration-guide.md#obtener-los-resultados-de-la-transaccion).

### Ejemplo

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>

<div style="height: 640px">
  <become-kyc-sdk
    contract-id="contract_123"
    access-token="eyJhbGciOiJIUzI1NiIs..."
    flow="onboarding"
    locale="es"
    theme-mode="light"
  ></become-kyc-sdk>
</div>

<script>
  const sdk = document.querySelector('become-kyc-sdk');
  sdk.setConfig({ ui: { showStatusIcons: true } });

  sdk.addEventListener('become-kyc:event', (event) => {
    if (event.detail.action === 'result') {
      console.log('Verificación enviada para', event.detail.payload.userId);
    }
  });
</script>
```

---

## `<become-button>`

Renderiza un botón y abre el flujo cuando se hace click. Ejecuta el mismo flujo que `<become-kyc-sdk>`, incluida la reverificación. Para elegir entre ellos, ver [Elige un producto](README.md#elige-un-producto).

### Atributos

El botón lee los mismos atributos de runtime que `<become-kyc-sdk>` (`contract-id`, `access-token`, `user-id`, `flow`, `locale`, `country`, `state`, `doc-type`, `national-id-type`, `national-id-type-choices`, `document-number`, `phone-number-enc`, `redirect-url`, `webhook-url`, `theme-mode`), con estas diferencias y añadidos:

| Atributo | Default | Descripción |
|----------|---------|-------------|
| `mode` | `overlay` | `overlay`, `embed` o `fullscreen`. Todos los modos abren el flujo sobre la página, no dentro del contenedor del botón. Ver [Modos de visualización](button.md#modos-de-visualización) |
| `button-text` | `Iniciar verificación` | Etiqueta del botón |
| `loading-text` | `Cargando...` | Etiqueta del botón mientras se abre el flujo |
| `hide-icon` | | Atributo booleano. Oculta el icono de escudo por defecto |

Los valores se leen al hacer click en el botón, así que cambiar un atributo tiene efecto en la siguiente apertura.

**Alias.** Cada atributo de runtime también se lee con sus nombres camelCase y en minúsculas (`contractId`, `contractid`, etc.). El botón también acepta estos nombres:

| Alias | Igual que |
|-------|-----------|
| `token`, `data-access-token` | `access-token` |
| `data-user-id` | `user-id` |
| `flowId` | `flow` |
| `theme` | `theme-mode` |
| `language` | `locale` |

Cuando hay varios nombres presentes, el atributo kebab-case tiene precedencia. Los valores vacíos se ignoran.

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `contractId` | `string \| null` | Refleja `contract-id` |
| `accessToken` | `string \| null` | Refleja `access-token` |
| `userId` | `string \| null` | Refleja `user-id` |
| `flow` | `string \| null` | Refleja `flow` |
| `mode` | `string` | Refleja `mode`. Devuelve `overlay` si no está configurado |
| `redirectUrl` | `string \| null` | Refleja `redirect-url` |
| `webhookUrl` | `string \| null` | Refleja `webhook-url` |
| `icon` | `string \| null` | Markup SVG para el icono del botón. No se refleja como atributo. Usa solo markup que controlas |

Establecer una propiedad escribe el atributo. Leer una propiedad devuelve el valor que usará el botón, incluyendo alias.

### Métodos

| Método | Devuelve | Descripción |
|--------|----------|-------------|
| `setConfig(config: Partial<PublicConfig>)` | `void` | Igual que en `<become-kyc-sdk>`. Los valores configurados antes del click se aplican al abrir el flujo. Los configurados mientras está abierto se aplican de inmediato |
| `getConfig()` | `PublicConfig \| null` | La configuración resuelta mientras el flujo está abierto. `null` en otro caso |
| `click()` | `void` | Abre el flujo, como lo hace un click del usuario |

El botón no tiene `getResolvedSteps()`.

### Ciclo de vida

1. **Click.** La etiqueta cambia a `loading-text` y el botón carga la configuración del contrato.
2. **Apertura.** El flujo se abre en su propia capa sobre el contenido de tu página, un hijo directo de `<body>`. La página no hace scroll detrás.
3. **Fin o salida.** Con `userFinished` o `exitedSdk` el contenedor se cierra. El botón permanece en la página y puede abrir el flujo de nuevo.
4. **Falla de startup.** Ver [Troubleshooting](troubleshooting.md#become-button).

Los eventos se despachan en el botón y usan los nombres `become:*`. Ver [Eventos](#eventos).

### Ejemplo

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-web-button.js"></script>

<become-button
  contract-id="contract_123"
  access-token="eyJhbGciOiJIUzI1NiIs..."
  flow="onboarding"
  button-text="Verificar mi identidad"
></become-button>

<script>
  const button = document.querySelector('become-button');
  button.addEventListener('become:result', (event) => {
    console.log('Verificación enviada para', event.detail.userId);
  });
</script>
```

---

## URL alojada

```
https://websdk.svi.becomedigital.net/?contractId=…&accessToken=…
```

La página alojada lee los mismos valores de runtime como query parameters. Usa los nombres camelCase de abajo. Los nombres de atributo kebab-case (`contract-id`, `theme-mode`, etc.) también se aceptan.

| Parámetro | Requerido | Igual que el atributo |
|-----------|-----------|-----------------------|
| `contractId` | Sí | `contract-id` |
| `accessToken` | Sí | `access-token` |
| `userId` | En `reverification` | `user-id` |
| `flow` | | `flow` |
| `locale` | | `locale` |
| `country` | | `country` |
| `state` | | `state` |
| `docType` | | `doc-type` |
| `nationalIdType` | | `national-id-type` |
| `nationalIdTypeChoices` | | `national-id-type-choices` |
| `documentNumber` | | `document-number` |
| `phoneNumberEnc` | | `phone-number-enc` |
| `redirectUrl` | | `redirect-url` |
| `webhookUrl` | | `webhook-url` |
| `themeMode` | | `theme-mode` |
| `externaltxid` | | Solo página alojada. ID de transacción externa, para trazabilidad |

`mode` es siempre `fullscreen` en la página alojada. La página no emite eventos del navegador a tu aplicación. El navegador sigue `redirectUrl`, y tu servidor se entera de la finalización por la [notificación por webhook](integration-guide.md#notificacion-por-webhook). Ver [hosted-web.md](hosted-web.md).

---

## Valores de runtime

Reglas que aplican a los atributos y a los parámetros de la página alojada.

| Valor | Regla |
|-------|-------|
| `flow` | Cualquier valor distinto de `reverification` ejecuta `onboarding` |
| `user-id` | Opcional en `onboarding`; el backend genera uno cuando falta. Requerido en `reverification`, donde el startup falla sin él |
| `country` | Un código válido omite el paso de país. Varios códigos (`CO,MX`) limitan el paso de país a esos. Los códigos inválidos se descartan con un `become-kyc:warning` |
| `doc-type` | Un tipo válido omite el paso de tipo de documento. Varios tipos limitan el paso a esos. Los tipos inválidos se descartan con un warning |
| `state` | Se usa solo cuando el país es `US` y el código es un estado válido de EE. UU. En otro caso se descarta con un warning |
| `national-id-type` | Un subtipo de `national-id` del país, por ejemplo `CC`, `CE`, `TI`, `PPT` en Colombia |
| `redirect-url` | El navegador lo abre tras `userFinished`: cuando la persona cierra la pantalla de resultado, o cierra la pantalla de error final. No se abre tras `exitedSdk`, lo que incluye declinar los términos. En la página alojada también se abre en cuanto se emite `result`. Llegar ahí no significa que la verificación tuvo éxito |
| `webhook-url` | Opcional y temporal. El webhook se configura en el backend para tu contrato; prefiere eso. Cuando está configurado, el valor se envía con el envío de la verificación. El webhook es una notificación HTTP a tu servidor, no un evento del navegador, y no incluye datos de la transacción. Ver [Notificación por webhook](integration-guide.md#notificacion-por-webhook) |
| `theme-mode` | Selecciona la paleta activa. No es un campo de `setConfig()`. Ver [Theme mode](customization.md#theme-mode) |

---

## `PublicConfig`

La configuración de presentación. Los valores de tu contrato vienen del Dashboard; `setConfig()` los sobrescribe en una página. Todos los campos son opcionales en `setConfig()`. Un valor inválido restablece el grupo al que pertenece (por ejemplo todo `theming.radius`) a sus defaults, y `become-kyc:warning` lo reporta.

```typescript
interface PublicConfig {
  theming: ThemingConfig;
  components: ComponentsConfig;
  branding: BrandingConfig;
  texts: TextsConfig;
  ui: UiConfig;
}
```

La guía de estas opciones, con ejemplos y el orden de resolución, es [customization.md](customization.md).

### `theming`

| Campo | Valores | Default |
|-------|---------|---------|
| `appearance` | `default`, `flat`, `material` | `default` |
| `colors.light`, `colors.dark` | Objetos de paleta, ver abajo | Paletas del SDK |
| `typography.fontFamily` | `Source Sans 3`, `Inter`, `Lora`, `JetBrains Mono` | `Source Sans 3` |
| `typography.fontSizeBase` | `{ value: number, unit: 'px' \| 'rem' \| 'em' }`, 12–24px | 16px |
| `density` | `compact`, `comfortable`, `spacious` | `comfortable` |
| `radius.button` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Según `appearance` |
| `radius.input` | `xs`, `sm`, `md`, `lg`, `xl` | Según `appearance` |
| `radius.card` | `xs`, `sm`, `md`, `lg`, `xl` | Según `appearance` |
| `radius.stepper` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Según `appearance` |
| `borders.width` | `{ value: number, unit: 'px' \| 'rem' \| 'em' }`, 0–4px | 1px |
| `borders.style` | `solid`, `dashed`, `dotted` | `solid` |
| `shadows.card` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | `xs` |
| `shadows.modal` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | `md` |
| `shadows.control` | `none`, `xs`, `sm`, `md`, `lg` | Sigue `shadows.card` |
| `container.size` | `adaptive`, `sm`, `md`, `lg` | `adaptive` |

**Claves de paleta.** Cada una de `colors.light` y `colors.dark` acepta strings hex para estas claves:

| Grupo | Claves |
|-------|--------|
| Marca | `primary`, `primaryHover`, `primaryActive`, `primaryText`, `secondary`, `secondaryHover`, `secondaryText` |
| Estados | `success`, `successText`, `warning`, `warningText`, `danger`, `dangerText` |
| Superficies | `surface`, `surfaceSunken`, `background` |
| Texto | `text`, `textMuted`, `textSubtle`, `textError` |
| Bordes | `border`, `borderMuted`, `borderFocus`, `borderError` |
| Sombra | `shadow` |

Todas las claves excepto `textError` y `shadow` tienen un default en ambas paletas, y una clave que omites conserva su default. Una paleta no se deriva de `primary`: cuando cambias `primary`, configura también `primaryHover`, `primaryActive` y `primaryText`. `textError` y `shadow` no tienen default: `textError` sin configurar sigue a `text`, y `shadow` sin configurar mantiene las sombras en negro.

### `components`

| Campo | Valores | Default |
|-------|---------|---------|
| `button.size` | `sm`, `md`, `lg` | `md` |
| `button.widthMode` | `full`, `adaptive`, `custom` | `adaptive` |
| `button.width` | `{ value: number, unit: 'px' \| 'rem' \| 'em' \| '%' \| 'vw' }` | Ancho del contenido. Se usa con `custom` |
| `input.labelStyle` | `outside`, `static-top`, `floating` | Según `appearance` |
| `input.size` | `sm`, `md`, `lg` | `md` |
| `stepper.show` | `boolean` | `true` |
| `stepper.size` | `sm`, `md`, `lg` | `md` |
| `stepper.variant` | `default`, `progress` | `default` |
| `errorBox.variant` | `default`, `alert`, `danger` | `default` |

### `branding`

| Campo | Valores | Default |
|-------|---------|---------|
| `logo.url` | URL de la imagen. Vacío no muestra logo | `''` |
| `logo.alt` | Texto alternativo | `''` |
| `logo.size` | `xs`, `sm`, `md`, `lg` | `md` |
| `logo.position` | `top-left`, `top-center`, `top-right` | `top-center` |
| `logo.background` | Color CSS | `transparent` |
| `logo.opacity` | `0`–`1` | `1` |
| `logo.shadow` | `none`, `xs`, `sm`, `md`, `lg` | `none` |
| `logo.radius` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | `lg` |

### `texts`

Textos por locale, y luego por namespace: `texts.<locale>.<namespace>.<key>`. Los namespaces son `intro`, `atdp`, `contactValidation`, `documentType`, `countrySelection`, `capture`, `liveness`, `result`, `errors`, `confirmation`, `common` y `faceliveness`. Edítalos en el Dashboard; un valor de `setConfig()` reemplaza un string. Ver [Textos y locales](customization.md#textos-y-locales).

### `ui`

| Campo | Valores | Default |
|-------|---------|---------|
| `confirmations.atdpDecline` | `boolean`. Pregunta antes de declinar los términos de tratamiento de datos | `true` |
| `confirmations.close` | `boolean`. Pregunta antes de cerrar el flujo | `true` |
| `hideIntroHeader` | `boolean`. Oculta el bloque de encabezado de la pantalla de bienvenida | `false` |
| `hideIntroStep` | `boolean`. Deja la pantalla de bienvenida fuera del flujo | `false` |
| `showStatusIcons` | `boolean`. Muestra los íconos de Completado y Error | `false` |
| `presentation.contentAlignment` | `left`, `center`, `justify` | `center` |
| `presentation.contentVerticalAlignment` | `top`, `center`, `bottom` | `top` |
| `presentation.ctaAlignment` | `left`, `center`, `right` | `center` |
| `presentation.ctaLayout` | `responsive`, `stack`, `inline` | `responsive` |

---

## Eventos

Cada evento es un `CustomEvent` con `bubbles: true` y `composed: true`. Los payloads completos, secuencias y ejemplos de escucha están en [events.md](events.md).

### `<become-kyc-sdk>`

Se despachan en el elemento. Burbujean hasta `document`.

| Evento | `detail` |
|--------|----------|
| `become-kyc:ready` | `{ version, contractId, flow }` |
| `become-kyc:event` | `{ action, payload }`, o `{ action: 'stepChange', stepId }` |
| `become-kyc:error` | `{ code, message?, status?, retryable?, data?, flow? }` |
| `become-kyc:warning` | `{ warnings: string[] }` |

Acciones de `become-kyc:event`: `stepLifecycleEvent`, `stepChange`, `result`, `atdpDeclined`, `exitedSdk`, `userFinished`.

### `<become-button>`

Se despachan en el botón.

| Evento | `detail` |
|--------|----------|
| `become:result` | `{ flow, userId, contractId, data }` |
| `become:userFinishedSdk` | `{ flow, data }` |
| `become:exitedSdk` | `{ data }` |
| `become:errorSdk` | `{ code, message?, status?, retryable?, data?, flow? }` |

---

## Tipos

Los scripts no son paquetes npm y no incluyen declaraciones de tipos. Estas declaraciones describen las formas públicas, para proyectos que quieran tiparlas.

```typescript
type Flow = 'onboarding' | 'reverification';

/** Los pasos que puede contener un flujo. Un contrato puede añadir pasos con otros ids. */
type ResolvedStepId =
  | 'intro'
  | 'atdp'
  | 'contactValidation'
  | 'documentType'
  | 'countrySelection'
  | 'capture'
  | 'liveness'
  | 'result'
  | (string & {});

interface BecomeKycSdkElement extends HTMLElement {
  setConfig(config: Partial<PublicConfig>): void;
  getConfig(): PublicConfig | null;
  getResolvedSteps(): ResolvedStepId[];
}

interface BecomeButtonElement extends HTMLElement {
  contractId: string | null;
  accessToken: string | null;
  userId: string | null;
  flow: string | null;
  mode: string;
  redirectUrl: string | null;
  webhookUrl: string | null;
  icon: string | null;
  setConfig(config: Partial<PublicConfig>): void;
  getConfig(): PublicConfig | null;
}

interface BecomeKycError {
  code: string | number;
  message?: string;
  status?: number;
  retryable?: boolean;
  data?: unknown;
  flow?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'become-kyc-sdk': BecomeKycSdkElement;
    'become-button': BecomeButtonElement;
  }
}
```
