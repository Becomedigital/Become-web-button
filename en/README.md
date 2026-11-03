# Integrator documentation

Guides for embedding Become KYC: which product to use, how to load it, and which attributes, methods, and events it supports.

## Choose a product

| Product | Use it when | What you load |
|---------|-------------|----------------|
| [Become Button](button.md) | You want a ready-made button that opens the verification when clicked | `become-web-button.js` and `<become-button>` |
| [Web SDK](web-sdk.md) | You place the verification inside your own page layout | `become-kyc-sdk.js` and `<become-kyc-sdk>` |
| [Hosted web](hosted-web.md) | You send a verification link, including from WhatsApp or email | A URL on the hosted site. No script install |

The button and the web SDK run the same flow, onboarding and reverification, with the same contract configuration and `setConfig()`. They differ in how the flow is placed and how much your page can follow:

| | Become Button | Web SDK |
|---|---|---|
| Starts | When the button is clicked | When the element is added to the page |
| Modes | `overlay` (default), `embed`, `fullscreen` | `embed` (default), `overlay`, `fullscreen` |
| Where the flow shows | Always over the page, whatever the mode | In `embed`, inside your container |
| Events | Result, finish, exit, and error | The same, plus ready, warnings, step changes, and step lifecycle |
| Methods | `setConfig()`, `getConfig()`, `click()` | `setConfig()`, `getConfig()`, `getResolvedSteps()` |

The hosted page is a fullscreen link. It does not provide the custom elements' browser events, including when the URL is placed in an iframe.

## Integration steps

The [integration guide](integration-guide.md) walks through these steps end to end, with a WhatsApp example.

1. **Get the prerequisites.** Your assigned credentials, contract ID, and user ID. Your backend requests the access token: [Prerequisites](integration-guide.md#prerequisites).
2. **Choose a product** from the table above.
3. **Load and start it** with your contract ID and access token: [web-sdk.md](web-sdk.md), [button.md](button.md), or [hosted-web.md](hosted-web.md).
4. **Configure your contract** in the Dashboard: colors, logo, texts, and UI options. Override them on one page with `setConfig()`: [customization.md](customization.md).
5. **Follow the person in the browser**, if you need to, with events: [events.md](events.md). When the person leaves the flow, the SDK's responsibility is complete.
6. **Receive the webhook notification** on your server. It tells you the results are ready. It does not contain them: [Webhook notification](integration-guide.md#webhook-notification).
7. **Retrieve the transaction results** from your system with the API: [Retrieve the transaction results](integration-guide.md#retrieve-the-transaction-results).
8. **Check failures and edge cases** before going live: [troubleshooting.md](troubleshooting.md).

Look up any attribute, method, configuration field, or type in the [API reference](api.md). Token generation and result retrieval are in the [API documentation](integration-guide.md#api-documentation).

## Documents

| Document | Description |
|----------|-------------|
| [integration-guide.md](integration-guide.md) | End to end: prerequisites, access token, SDK execution, WhatsApp example, webhook, and result retrieval |
| [web-sdk.md](web-sdk.md) | `<become-kyc-sdk>`: setup, display modes, layout, and lifecycle |
| [button.md](button.md) | `<become-button>`: setup, button label, and `become:*` events |
| [hosted-web.md](hosted-web.md) | Hosted URL parameters, redirect, and fullscreen behavior |
| [customization.md](customization.md) | Dashboard and `setConfig()`, theme mode, colors, appearance, logo, texts, and status icons |
| [events.md](events.md) | Event names and payloads for the web SDK and the button |
| [troubleshooting.md](troubleshooting.md) | Startup failures, errors during the flow, and common issues |
| [api.md](api.md) | Reference: attributes, properties, methods, URL parameters, configuration, events, and types |

## Quick start

Replace `contract_123` with your contract ID and the token with one your backend generated: [Generate the access token](integration-guide.md#generate-the-access-token).

Embed:

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
  button-text="Start Verification"
></become-button>
```

Hosted link:

```
https://websdk.svi.becomedigital.net/?contractId=contract_123&accessToken=eyJhbGciOiJIUzI1NiIs...&flow=onboarding&locale=es
```
