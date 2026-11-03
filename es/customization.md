# Personalización

Cómo hacer que el flujo de verificación coincida con tu producto: colores, lenguaje visual, logo, textos y opciones de UI. Estas opciones aplican a los tres productos. Cada campo y sus valores permitidos están en la [referencia de API](api.md#publicconfig).

## De dónde viene la configuración

1. **El Dashboard.** Configura tu contrato allí. Esa configuración se carga cada vez que el flujo inicia, en el Web SDK, el botón y la página alojada. Es la forma preferida de personalizar.
2. **`setConfig()`.** En `<become-kyc-sdk>` y `<become-button>`, `setConfig()` sobrescribe valores del contrato en una página, para valores que tu página decide en runtime. La página alojada no tiene `setConfig()`; usa la configuración del contrato.
3. **`theme-mode`.** Selecciona qué paleta está activa. Es un atributo (o el parámetro de URL `themeMode`), no configuración. Ver [Theme mode](#theme-mode).

```javascript
const sdk = document.querySelector('become-kyc-sdk');

// Selecciona la paleta activa. Esto no es un campo de setConfig().
sdk.setAttribute('theme-mode', 'dark');

sdk.setConfig({
  theming: {
    colors: {
      light: { primary: '#07a8b8' },
      dark: { primary: '#07a8b8' },
    },
  },
  branding: {
    logo: {
      url: 'https://websdk.svi.becomedigital.net/sdk/logo.svg',
      position: 'top-center',
      size: 'md',
    },
  },
  texts: {
    es: {
      intro: {
        title: 'Título personalizado',
      },
    },
  },
  ui: {
    hideIntroStep: true,
    presentation: {
      contentAlignment: 'center',
    },
  },
});
```

### Dominios de Configuración

| Dominio | Descripción | Opciones Clave |
|---------|-------------|----------------|
| `theming` | Colores, fuentes, espaciado, lenguaje visual | `appearance`, `colors.light/dark`, `typography.fontFamily`, `density`, `radius`, `shadows`, `container.size` |
| `components` | Presentación de controles | `button.size`, `input.labelStyle` (`outside`, `static-top`, `floating`), `input.size`, `stepper.variant`, `errorBox.variant` |
| `branding` | Logo y assets de branding | `logo.url`, `logo.position`, `logo.size`, `logo.opacity`, `logo.shadow`, `logo.radius` |
| `texts` | Strings de texto internacionalizados | Organizados por locale y namespace. Ver [Textos y locales](#textos-y-locales) |
| `ui` | Toggles de presentación y confirmación | `confirmations`, `hideIntroHeader`, `hideIntroStep`, `showStatusIcons`, `presentation` |

## Theme mode

`theme-mode` (`light`, `dark`, o `system`) selecciona la paleta activa. No es parte de `setConfig()`. Cuando el atributo se omite, o el valor no es uno de esos tres, la paleta activa es `light`. `system` sigue el sistema operativo solo cuando lo configuras. Los overrides de color pertenecen bajo `theming.colors.light` y `theming.colors.dark`. Un `theming.colors.primary` plano no es la forma soportada, y `theming.mode` se ignora.

En `<become-kyc-sdk>`, cambiar `theme-mode` cambia la paleta sin reiniciar el flujo.

### Por qué el theme mode es explícito

El theme mode es una **decisión explícita del cliente** porque el SDK debe respetar la identidad visual de cada cliente en lugar de imponer un esquema de color basado en suposiciones.

Diferentes clientes tienen diferentes requisitos de branding:

- **Solo light:** La marca del cliente define solo un tema visual claro.
- **Solo dark:** La marca del cliente define solo un tema visual oscuro.
- **Light y dark:** El cliente soporta ambos y puede seleccionar el tema según sus propias preferencias de usuario o configuración de la aplicación.
- **Paletas personalizadas:** Una paleta puede contener colores de apariencia oscura mientras sigue siendo el tema claro intencionado del cliente. El SDK no debe inferir el tema desde los colores mismos.

El SDK no puede determinar de forma fiable qué tema es apropiado a partir de la paleta, el sistema operativo del usuario o suposiciones genéricas sobre modo oscuro. Imponer un tema automáticamente podría introducir colores que entren en conflicto con la identidad de marca del cliente.

Por tanto, el cliente **debe** comunicar explícitamente el modo de theming intencionado a través del atributo `theme-mode` (o el parámetro de consulta `themeMode` en la página alojada).

El valor `system` es un **comportamiento opt-in** para clientes que quieren que el SDK siga la preferencia del sistema del usuario. No es el default universal para propósitos de branding. Si la marca de un cliente requiere un tema específico independientemente de la configuración del SO del usuario, el cliente debe pasar `light` o `dark` explícitamente.

## Colores

Cada paleta (`theming.colors.light`, `theming.colors.dark`) acepta las claves listadas en la [referencia de API](api.md#theming). Una clave que omites conserva el default del SDK.

Los colores no se derivan unos de otros. Cuando cambias `primary`, configura también `primaryHover`, `primaryActive` y `primaryText`, o los colores de hover, presionado y etiqueta conservan los defaults del SDK.

**Color del texto de error**: los mensajes de error usan `theming.colors.light.textError` y `theming.colors.dark.textError`. Si no los defines, los mensajes de error usan el color `text` de la paleta.

`theming.colors.light.shadow` y `theming.colors.dark.shadow` tiñen todas las sombras con un color hex, por ejemplo el color de tu marca. Cada modo usa el valor de su propia paleta. Si los omites, las sombras quedan en negro neutro.

## Apariencia

`theming.appearance` selecciona un lenguaje visual para todo el flujo. Omítelo, o pon `default`, y el SDK se ve como hoy.

| Valor | Qué cambia |
|-------|------------|
| `default` | Radios, sombras y bordes actuales |
| `flat` | Esquinas suaves, sin elevación. La separación viene de bordes |
| `material` | Esquinas medias, tarjetas y botones rellenos elevados, campos hundidos |

Un preset es el baseline. Estos campos aún pueden establecerse por separado, incluyendo junto con `default`:

| Campo | Valores soportados | Qué sigue |
|-------|-------------------|-----------|
| `radius.button` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Botones |
| `radius.input` | `xs`, `sm`, `md`, `lg`, `xl` | Campos y cajas de validación |
| `radius.card` | `xs`, `sm`, `md`, `lg`, `xl` | Tarjeta de paso, tarjetas de opción, diálogos e imágenes de revisión |
| `radius.stepper` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Indicador de progreso |
| `shadows.card` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | Tarjeta de paso, y en `material` tarjetas de documento y panel de país |
| `shadows.modal` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | Diálogos |
| `shadows.control` | `none`, `xs`, `sm`, `md`, `lg` | Botones. Si se omite, los botones siguen `shadows.card` |
| `borders.width` | 0–4px | Controles y diálogos |
| `borders.style` | `solid`, `dashed`, `dotted` | Controles y diálogos |

Colores, density, fuente, tamaño de tarjeta y texto permanecen independientes del preset. El preset también establece la etiqueta del campo: en el borde para `default`, encima del campo para `flat`, y flotante para `material`. `components.input.labelStyle` o `components.input.size` reemplaza el preset cuando lo configuras.

Orden de resolución, de menor a mayor prioridad:

1. Valores de fábrica.
2. El preset seleccionado, para radius, shadow, border, y la etiqueta y tamaño del campo.
3. Un campo que configuras en esa misma configuración.
4. Las llamadas posteriores a `setConfig()` reemplazan solo los campos explícitos que envían. Cambiar `appearance`, incluso a `default`, conserva los valores explícitos anteriores del contrato y del host. El nuevo preset aporta solo los campos que nunca se han sobrescrito. Actualizar un SDK abierto y volver a abrirlo siguen la misma precedencia. Para restablecer un campo personalizado, envía su valor explícitamente.

`appearance: "material"` con `shadows.card: "none"` mantiene las esquinas material y la elevación de diálogos, y elimina la sombra de tarjeta y botón. `appearance: "default"` con `radius.card: "xs"` cambia la esquina de la tarjeta y deja el resto de la UI actual en su lugar.

El tamaño de fuente base se mantiene dentro de 12px–24px. Un valor fuera de ese rango se ignora y el SDK usa 16px. El ancho de borde se mantiene dentro de 0–4px.

### Sombras

Los niveles de sombra usan los mismos nombres de tamaño que `radius`, desde sin elevación (`none`) hasta profundidad marcada (`xl`). La tarjeta de paso viene con `xs`. Cada nivel suma desplazamiento y desenfoque, así la sombra cae debajo de la tarjeta en lugar de extenderse a su alrededor. Sobre el fondo oscuro del modo `overlay`, una sombra negra se ve poco en cualquier nivel; un color de sombra se lee mejor ahí.

Los botones tienen una escala propia más ligera que llega hasta `lg`. Sin `shadows.control` siguen a la tarjeta: tarjetas `xs` y `sm` dan botones `xs`, `md` da `md`, y `lg` y `xl` dan `lg`. Configura `shadows.control` para elegir la sombra de los botones por separado, incluso `none` para botones planos sobre una tarjeta elevada.

También se aceptan `subtle`, `medium` y `elevated`, como `xs`, `md` y `lg`. Aplican a `shadows.card`, `shadows.modal`, `shadows.control` y `branding.logo.shadow`.

```js
sdk.setConfig({
  theming: {
    shadows: { card: 'lg' },
    colors: { light: { shadow: '#5b4bd1' } },
  },
});
```

## Logo

`branding.logo.url` muestra tu logo en la parte superior de la tarjeta, en `branding.logo.position` y `branding.logo.size`. La esquina del logo es `branding.logo.radius` (de fábrica `lg`, 16px) y su elevación es `branding.logo.shadow`: `none` (por defecto), `xs`, `sm`, `md` o `lg`, la misma escala que los botones. Ninguna sigue `radius.card` o `shadows.card`. La sombra del logo también usa el color de sombra.

## Ancho de tarjeta y densidad

`theming.container.size` limita qué tan ancho crece la tarjeta (`adaptive`, `sm`, `md`, o `lg`). No establece el height. `theming.density` cambia el espaciado (`compact`, `comfortable`, o `spacious`). Cómo la tarjeta llena tu página se describe en [Layout](web-sdk.md#layout).

## Íconos de estado

`ui.showStatusIcons` (por defecto `false`) muestra un ícono de Completado en la pantalla final de éxito y un ícono de Error en las pantallas de error. Los indicadores de carga se muestran siempre. Si omites la clave, los íconos quedan ocultos.

```javascript
sdk.setConfig({
  ui: { showStatusIcons: true },
  theming: { colors: { light: { textError: '#5b6478' } } },
});
```

## Textos y locales

El atributo `locale` (o parámetro de URL) selecciona qué textos se muestran. El SDK incluye sus textos en español (`es`). Los textos de otros locales, como `en` o `pt`, vienen de la configuración de tu contrato o de `setConfig({ texts })`. Cualquier string que falte para el locale seleccionado se muestra en español.

Los textos se agrupan por locale y namespace: `texts.<locale>.<namespace>.<key>`. Los namespaces están listados en la [referencia de API](api.md#texts). Edítalos en el Dashboard. Para cambiar un string en una página:

```javascript
sdk.setConfig({
  texts: {
    en: {
      intro: { title: 'Verify your identity' },
    },
  },
});
```

La frase que se muestra cuando el startup falla también es un texto (`errors.startup`). Sobrescríbela antes de que el elemento inicie. Ver [Troubleshooting](troubleshooting.md#fallas-de-startup).

### Pantalla de bienvenida

La pantalla de bienvenida anticipa la verificación: una lista numerada de lo que hará la persona, construida a partir de los pasos que ejecuta tu contrato, y un panel corto de "antes de empezar". Los textos son:

| Clave | Qué es |
|-------|--------|
| `intro.journey.lead` | Línea sobre la lista |
| `intro.journey.document.title`, `.description` | Se muestra cuando el flujo incluye los pasos del documento |
| `intro.journey.selfie.title`, `.description` | Se muestra cuando el flujo incluye la selfie |
| `intro.journey.confirmation.title`, `.description` | La revisión final |
| `intro.prepare.title` | Encabezado del panel |
| `intro.prepare.items.document.title` | Se muestra cuando el flujo incluye los pasos del documento |
| `intro.prepare.items.lighting.title` | Se muestra cuando el flujo incluye la captura del documento o la selfie |

Una descripción vacía no se muestra.

Las pantallas del documento y de la selfie abren con su propia lista corta de consejos para esa foto. Cada consejo tiene una etiqueta y una línea más corta debajo:

| Clave | Qué es |
|-------|--------|
| `capture.intro.prepare.title`, `liveness.intro.prepare.title` | Línea sobre la lista |
| `capture.intro.prepare.items.original`, `.uncovered`, `.reflections` (`.title`, `.description`) | Consejos del documento |
| `liveness.intro.prepare.items.uncovered`, `.lighting`, `.camera` (`.title`, `.description`) | Consejos de la selfie |

Las tres pantallas usan las mismas claves bajo `prepare`: un `title` e `items` con clave. Un encabezado, una etiqueta o una línea inferior vacíos no se muestran. Un consejo sin etiqueta no se muestra.

### Revisión y rechazo de la foto

Después de cada foto, la persona la revisa contra una lista corta de requisitos. Si la foto se rechaza, los mismos requisitos aparecen bajo una línea que introduce el siguiente intento.

| Clave | Qué es |
|-------|--------|
| `capture.review.title`, `.subtitle` | Encabezado de la revisión del documento |
| `liveness.review.title`, `.subtitle` | Encabezado de la revisión de la selfie |
| `liveness.review.validating` | Se muestra mientras se revisa la selfie |
| `capture.requirements.items.front`, `.legible`, `.reflections`, `.original` (`.title`, `.description`) | Requisitos del documento |
| `liveness.requirements.items.complete`, `.single`, `.sharp`, `.uncovered` (`.title`, `.description`) | Requisitos de la selfie |
| `capture.rejected.title`, `liveness.rejected.title` | Encabezado del rechazo. El motivo aparece debajo |
| `capture.rejected.retryTitle`, `liveness.rejected.retryTitle` | Línea sobre los requisitos en un rechazo |
| `capture.review.retake`, `.submit`; `liveness.recapture`, `liveness.confirm` | Botones de la revisión |
| `liveness.accessoryError.*` | Rechazo por accesorios: encabezado, la línea inicial y el nombre de cada accesorio |

Los requisitos son etiquetas con una línea más corta debajo de cada una. Cuando falta espacio, solo se muestran las etiquetas.

El encabezado de cada lista también la nombra para los lectores de pantalla, así que una lista no tiene una etiqueta accesible aparte.
