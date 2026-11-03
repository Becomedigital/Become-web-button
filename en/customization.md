# Customization

How to make the verification flow match your product: colors, visual language, logo, texts, and UI options. These options apply to all three products. Every field and its allowed values are listed in the [API reference](api.md#publicconfig).

## Where configuration comes from

1. **The Dashboard.** Configure your contract there. That configuration is loaded every time the flow starts, by the web SDK, the button, and the hosted page. This is the preferred way to customize.
2. **`setConfig()`.** On `<become-kyc-sdk>` and `<become-button>`, `setConfig()` overrides contract values on one page, for values your page decides at runtime. The hosted page has no `setConfig()`; it uses the contract configuration.
3. **`theme-mode`.** Selects which palette is active. It is an attribute (or the `themeMode` URL parameter), not configuration. See [Theme mode](#theme-mode).

```javascript
const sdk = document.querySelector('become-kyc-sdk');

// Selects the active palette. This is not a field of setConfig().
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
        title: 'Custom title',
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

### Configuration domains

| Domain | Description | Key Options |
|--------|-------------|-------------|
| `theming` | Colors, fonts, spacing, visual language | `appearance`, `colors.light/dark`, `typography.fontFamily`, `density`, `radius`, `shadows`, `container.size` |
| `components` | Control presentation | `button.size`, `input.labelStyle` (`outside`, `static-top`, `floating`), `input.size`, `stepper.variant`, `errorBox.variant` |
| `branding` | Logo and branding assets | `logo.url`, `logo.position`, `logo.size`, `logo.opacity`, `logo.shadow`, `logo.radius` |
| `texts` | Internationalized text strings | Organized by locale and namespace. See [Texts and locales](#texts-and-locales) |
| `ui` | Presentation and confirmation toggles | `confirmations`, `hideIntroHeader`, `hideIntroStep`, `showStatusIcons`, `presentation` |

## Theme mode

`theme-mode` (`light`, `dark`, or `system`) selects the active palette. It is not part of `setConfig()`. When the attribute is omitted, or the value is not one of those three, the active palette is `light`. `system` follows the operating system only when you set it. Color overrides belong under `theming.colors.light` and `theming.colors.dark`. A flat `theming.colors.primary` is not the supported shape, and `theming.mode` is ignored.

On `<become-kyc-sdk>`, changing `theme-mode` switches the palette without restarting the flow.

### Why theme mode is explicit

The theme mode is an **explicit client decision** because the SDK must respect each client's visual identity rather than impose a color scheme based on assumptions.

Different clients have different branding requirements:

- **Light-only:** The client's brand defines only a light visual theme.
- **Dark-only:** The client's brand defines only a dark visual theme.
- **Light and dark:** The client supports both and may select the theme according to its own user preferences or application settings.
- **Custom palettes:** A palette may contain dark-looking colors while still being the client's intended light theme. The SDK must not infer the theme from the colors themselves.

The SDK cannot reliably determine which theme is appropriate from the palette, the user's operating system, or generic assumptions about dark mode. Automatically imposing a theme could introduce colors that conflict with the client's brand identity.

Therefore, the client **must** explicitly communicate the intended theming mode through the `theme-mode` attribute (or the `themeMode` query parameter on the hosted page).

The `system` value is an **opt-in behavior** for clients that want the SDK to follow the user's system preference. It is not the universal default for branding purposes. If a client's brand requires a specific theme regardless of the user's OS setting, the client should pass `light` or `dark` explicitly.

## Colors

Each palette (`theming.colors.light`, `theming.colors.dark`) accepts the keys listed in the [API reference](api.md#theming). A key you leave out keeps the SDK default.

Colors are not derived from each other. When you change `primary`, also set `primaryHover`, `primaryActive`, and `primaryText`, or the hover, pressed, and label colors keep the SDK defaults.

**Error text color**: error messages use `theming.colors.light.textError` and `theming.colors.dark.textError`. When you don't set them, error messages use the palette's `text` color.

`theming.colors.light.shadow` and `theming.colors.dark.shadow` tint every shadow with a hex color, for example your brand color. Each mode uses its own palette's value. Leave them out and shadows stay neutral black.

## Appearance

`theming.appearance` selects a visual language for the whole flow. Omit it, or set `default`, and the SDK looks as it does today.

| Value | What changes |
|-------|----------------|
| `default` | Current radii, shadows, and borders |
| `flat` | Soft corners, no elevation. Separation comes from borders |
| `material` | Medium corners, raised cards and filled buttons, sunken fields |

A preset is the baseline. These fields can still be set on their own, including together with `default`:

| Field | Supported values | What follows it |
|-------|------------------|-----------------|
| `radius.button` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Buttons |
| `radius.input` | `xs`, `sm`, `md`, `lg`, `xl` | Fields and validation boxes |
| `radius.card` | `xs`, `sm`, `md`, `lg`, `xl` | Step card, option cards, dialogs, and review images |
| `radius.stepper` | `xs`, `sm`, `md`, `lg`, `xl`, `full` | Progress indicator |
| `shadows.card` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | Step card, and on `material` the document cards and country panel |
| `shadows.modal` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | Dialogs |
| `shadows.control` | `none`, `xs`, `sm`, `md`, `lg` | Buttons. When omitted, buttons follow `shadows.card` |
| `borders.width` | 0–4px | Controls and dialogs |
| `borders.style` | `solid`, `dashed`, `dotted` | Controls and dialogs |

Colors, density, font, card size, and text stay independent of the preset. The preset also sets the field label: on the border for `default`, above the field for `flat`, and floating for `material`. `components.input.labelStyle` or `components.input.size` replaces the preset when you set it.

Resolution order, from lowest to highest:

1. Shipped values.
2. The selected preset, for radius, shadow, border, and the field label and size.
3. A field you set in that same configuration.
4. Later `setConfig()` calls replace only the explicit fields they send. Changing `appearance`, including selecting `default`, preserves earlier explicit values from the contract and the host. The new preset supplies only fields that have never been overridden. Updating an open SDK and reopening it use the same precedence. To reset a customized field, send its desired value explicitly.

`appearance: "material"` with `shadows.card: "none"` keeps the material corners and dialog elevation, and removes the card and button shadow. `appearance: "default"` with `radius.card: "xs"` changes the card corner and leaves the rest of the current UI in place.

The base font size stays within 12px–24px. A value outside that range is ignored and the SDK uses 16px. Border width stays within 0–4px.

### Shadows

Shadow levels use the same size names as `radius`, from no elevation (`none`) to pronounced depth (`xl`). The step card ships with `xs`. Each level adds offset and blur, so the shadow falls below the card rather than spreading around it. On the dark backdrop of `overlay` mode, a black shadow is hard to see at any level; a shadow color reads better there.

Buttons have a lighter scale of their own that stops at `lg`. Without `shadows.control` they follow the card: `xs` and `sm` cards give `xs` buttons, `md` gives `md`, and `lg` and `xl` give `lg`. Set `shadows.control` to choose the button shadow independently, including `none` for flat buttons on a raised card.

`subtle`, `medium`, and `elevated` are also accepted, as `xs`, `md`, and `lg`. They apply to `shadows.card`, `shadows.modal`, `shadows.control`, and `branding.logo.shadow`.

```js
sdk.setConfig({
  theming: {
    shadows: { card: 'lg' },
    colors: { light: { shadow: '#5b4bd1' } },
  },
});
```

## Logo

`branding.logo.url` shows your logo at the top of the card, at `branding.logo.position` and `branding.logo.size`. The logo corner is `branding.logo.radius` (shipped `lg`, 16px) and its elevation is `branding.logo.shadow`: `none` (default), `xs`, `sm`, `md`, or `lg`, the same scale as buttons. Neither follows `radius.card` or `shadows.card`. The logo shadow uses the shadow color too.

## Card size and density

`theming.container.size` limits how wide the card grows (`adaptive`, `sm`, `md`, or `lg`). It does not set the height. `theming.density` changes the spacing (`compact`, `comfortable`, or `spacious`). How the card fills your page is described in [Layout](web-sdk.md#layout).

## Status icons

`ui.showStatusIcons` (default `false`) shows a Completed icon on the final success screen and an Error icon on error screens. Loading indicators are always shown. If you omit the key, the icons stay hidden.

```javascript
sdk.setConfig({
  ui: { showStatusIcons: true },
  theming: { colors: { light: { textError: '#5b6478' } } },
});
```

## Texts and locales

The `locale` attribute (or URL parameter) selects which texts are shown. The SDK ships its texts in Spanish (`es`). Texts for other locales, such as `en` or `pt`, come from your contract configuration or from `setConfig({ texts })`. Any string missing for the selected locale is shown in Spanish.

Texts are grouped by locale and namespace: `texts.<locale>.<namespace>.<key>`. The namespaces are listed in the [API reference](api.md#texts). Edit them in the Dashboard. To change one string on a page:

```javascript
sdk.setConfig({
  texts: {
    en: {
      intro: { title: 'Verify your identity' },
    },
  },
});
```

The sentence shown when startup fails is also a text (`errors.startup`). Override it before the element starts. See [Troubleshooting](troubleshooting.md#startup-failures).

### Welcome screen

The welcome screen outlines the verification: a numbered list of what the person will do, built from the steps your contract runs, and a short "before you start" panel. The texts are:

| Key | What it is |
|-----|------------|
| `intro.journey.lead` | Line above the list |
| `intro.journey.document.title`, `.description` | Shown when the flow includes the document steps |
| `intro.journey.selfie.title`, `.description` | Shown when the flow includes the selfie |
| `intro.journey.confirmation.title`, `.description` | The final review |
| `intro.prepare.title` | Panel heading |
| `intro.prepare.items.document.title` | Shown when the flow includes the document steps |
| `intro.prepare.items.lighting.title` | Shown when the flow includes the document capture or the selfie |

An empty description is not shown.

The document and selfie screens open with their own short list of tips for that photo. Each tip has a label and a shorter line under it:

| Key | What it is |
|-----|------------|
| `capture.intro.prepare.title`, `liveness.intro.prepare.title` | Line above the list |
| `capture.intro.prepare.items.original`, `.uncovered`, `.reflections` (`.title`, `.description`) | Document tips |
| `liveness.intro.prepare.items.uncovered`, `.lighting`, `.camera` (`.title`, `.description`) | Selfie tips |

The three screens use the same keys under `prepare`: a `title` and keyed `items`. An empty heading, label or line under it is not shown. A tip without a label is not shown.

### Photo review and rejection

After each photo, the person reviews it against a short list of requirements. If the photo is rejected, the same requirements appear under a line that introduces the next attempt.

| Key | What it is |
|-----|------------|
| `capture.review.title`, `.subtitle` | Document review heading |
| `liveness.review.title`, `.subtitle` | Selfie review heading |
| `liveness.review.validating` | Shown while the selfie is being checked |
| `capture.requirements.items.front`, `.legible`, `.reflections`, `.original` (`.title`, `.description`) | Document requirements |
| `liveness.requirements.items.complete`, `.single`, `.sharp`, `.uncovered` (`.title`, `.description`) | Selfie requirements |
| `capture.rejected.title`, `liveness.rejected.title` | Rejection heading. The reason appears below it |
| `capture.rejected.retryTitle`, `liveness.rejected.retryTitle` | Line above the requirements on a rejection |
| `capture.review.retake`, `.submit`; `liveness.recapture`, `liveness.confirm` | Review buttons |
| `liveness.accessoryError.*` | Rejection for accessories: heading, the lead line and each accessory's name |

The requirements are labels with a shorter line under each one. Where space is short, only the labels are shown.

Each list's heading also names the list for screen readers, so a list has no separate accessible label.
