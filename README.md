# Integrate Become KYC into Your Website

Add identity verification (Know Your Customer, KYC) to your website with a single tag. Your users verify their identity with a document photo and a selfie, without leaving your page.

## Prerequisites

Before you start, you need:

| Item | What it is | Where you use it |
|------|------------|------------------|
| Assigned credentials | API credentials assigned to your account | Your backend only, to request the access token |
| Contract ID | Identifies your contract and its configuration | `contract-id` attribute |
| Access token | A JWT that authorizes the verification | `access-token` attribute, from your backend |
| User ID | Your identifier for the person being verified | `user-id` attribute (optional in `onboarding`, required in `reverification`) |
| Flow | `onboarding` (default) or `reverification` | `flow` attribute |
| Redirect URL | Where the browser goes when the person finishes | `redirect-url` attribute |

Your backend requests the access token with your assigned credentials and passes only the resulting JWT to the page. Never put your assigned credentials in a page, a script, or a link.

## Three ways to add it

| Option | Tag / Method | Best for |
|--------|--------------|----------|
| Become Button | `<become-button>` | A ready-made button that opens the verification when clicked |
| Become KYC SDK | `<become-kyc-sdk>` | Placing the verification flow directly inside your own layout |
| Hosted web | Verification link | Sending a verification link (email, SMS, WhatsApp, QR code) |

All three run the same verification flow and use the same contract configuration.

## Become Button

**1. Add the script:**

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-web-button.js"></script>
```

**2. Add the button:**

```html
<become-button
  contract-id="<YOUR_CONTRACT_ID>"
  access-token="<YOUR_JWT_TOKEN>"
  user-id="<YOUR_USER_ID>"
></become-button>
```

`contract-id` and `access-token` are required.

## Become KYC SDK

**1. Add the script:**

```html
<script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>
```

**2. Add the component inside a container with a size:**

```html
<div style="width: 100%; max-width: 480px; height: 640px;">
  <become-kyc-sdk
    contract-id="<YOUR_CONTRACT_ID>"
    access-token="<YOUR_JWT_TOKEN>"
    user-id="<YOUR_USER_ID>"
  ></become-kyc-sdk>
</div>
```

Give the container at least 280px wide and 560px tall. The verification starts as soon as the component is on the page.

## Hosted web (verification link)

Send users to the verification as a link — no code on your page. Build the link on your backend so every value is URL-encoded:

```
https://websdk.svi.becomedigital.net/?contractId=<YOUR_CONTRACT_ID>&accessToken=<YOUR_JWT_TOKEN>&userId=<YOUR_USER_ID>&redirectUrl=https://example.com/verification-complete
```

The link opens full screen. Your system learns about completion from the webhook notification (the hosted page emits no browser events to your application).

## Common attributes

| Attribute | Description |
|-----------|-------------|
| `contract-id` | Required. The contract identifier for your KYC process |
| `access-token` | Required. A JWT created with your company credentials |
| `user-id` | Optional in `onboarding`, required in `reverification` |
| `flow` | `onboarding` (default) or `reverification` |
| `locale` | Language of the texts. Default: `es` |
| `country` | A 2-letter country code, for example `CO` or `FR` |
| `doc-type` | `national-id`, `passport`, `driving-license` |
| `redirect-url` | The page the browser opens after a successful verification |
| `theme-mode` | `light` (default), `dark`, or `system` |
| `mode` | Button: `overlay` (default), `embed`, `fullscreen`. SDK: `embed` (default), `overlay`, `fullscreen` |

Attribute names can also be written in camelCase (`contractId`, `userId`, `docType`, ...), and `token` is accepted for `access-token`.

## Events

Listen on the element to know what happened:

| Product | Events |
|---------|--------|
| `<become-button>` | `become:result`, `become:userFinishedSdk`, `become:exitedSdk`, `become:errorSdk` |
| `<become-kyc-sdk>` | `become-kyc:ready`, `become-kyc:event`, `become-kyc:error`, `become-kyc:warning` |

```js
const button = document.querySelector('become-button');
button.addEventListener('become:result', ({ detail }) => {
  console.log('Verification completed:', detail.data);
});
```

Events do not deliver the transaction results — retrieve them from your backend with the API after the webhook notification.

## Methods

| Method | `<become-button>` | `<become-kyc-sdk>` |
|--------|-------------------|--------------------|
| `setConfig(config)` | ✅ | ✅ |
| `getConfig()` | ✅ | ✅ |
| `click()` | ✅ | |
| `getResolvedSteps()` | | ✅ |

More details are in [en/](en/) (English) and [es/](es/) (Spanish).