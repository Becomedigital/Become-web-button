# Integration guide

The complete path of a Become KYC integration, from credentials to transaction results. Read it once before you start. The product guides ([web-sdk.md](web-sdk.md), [button.md](button.md), [hosted-web.md](hosted-web.md)) cover each product in detail.

The examples use the Web SDK (`<become-kyc-sdk>`), except the WhatsApp example, which uses the hosted page. The same stages apply to every product.

Contents:

- [How an integration works](#how-an-integration-works)
- [Prerequisites](#prerequisites)
- [Generate the access token](#generate-the-access-token)
- [Token validation and security](#token-validation-and-security)
- [Run the SDK](#run-the-sdk)
- [Example: WhatsApp flow](#example-whatsapp-flow)
- [Webhook notification](#webhook-notification)
- [Retrieve the transaction results](#retrieve-the-transaction-results)
- [Responsibilities at a glance](#responsibilities-at-a-glance)
- [API documentation](#api-documentation)

---

## How an integration works

An integration has four separate stages. Each one has its own owner and its own end.

| Stage | Where it runs | What happens | Ends when |
|-------|---------------|--------------|-----------|
| 1. [Prerequisites](#prerequisites) | Your backend | You request an access token with your assigned credentials | You have a token for the verification |
| 2. [SDK execution](#run-the-sdk) | The person's browser | The SDK runs the verification and submits it to the Become API | The SDK finishes. Its responsibility is complete |
| 3. [Webhook notification](#webhook-notification) | Become backend → your backend | Your server is told that a transaction is completed | Your server receives the notification |
| 4. [Result retrieval](#retrieve-the-transaction-results) | Your backend → Become API | Your system requests the transaction results | You have the results |

```text
Your backend               Browser (SDK)                 Become API
     │                          │                             │
     │ 1. POST token request (assigned credentials) ─────────▶│
     │◀──────────────────────────────────────── access token ─│
     │── contract-id, access-token, user-id ─▶│               │
     │                          │ 2. person completes the flow│
     │                          │── verification submission ─▶│  token validated here
     │                          │   SDK finishes              │
     │◀──────────────────────────── 3. webhook: results ready ─│
     │── 4. request transaction results ─────────────────────▶│
     │◀─────────────────────────────────── transaction results ─│
```

The SDK does not return the transaction results to your page, and the webhook does not carry them. Results always come from stage 4.

---

## Prerequisites

### What you need

| Item | What it is | Where it comes from | Where you use it |
|------|------------|---------------------|------------------|
| Assigned credentials | The API credentials assigned to your account | Become | Your backend only, to request the access token. Never put them in a page, a script, or a link |
| Contract ID | Identifies your contract and its configuration (flows, colors, logo, texts) | Your contract, managed in the Dashboard | `contract-id` attribute, `contractId` URL parameter |
| Access token | A JWT that authorizes the verification | The token request below | `access-token` attribute, `accessToken` URL parameter |
| User ID | Your identifier for the person being verified | Your system | `user-id` attribute, `userId` URL parameter. Optional in verification, required in reverification |
| Flow | Which verification to run | Your use case | `flow`: `onboarding` (verification) or `reverification` |
| Webhook | The URL of your server that receives the completion notification | Configured on the backend for your contract | Not an SDK value. See [Webhook notification](#webhook-notification) |
| Redirect URL | Optional. Where the browser goes when the person finishes | Your application | `redirect-url` attribute, `redirectUrl` URL parameter |
| Results API access | What your system needs to retrieve transaction results | The [API documentation](#api-documentation) | Your backend, in stage 4 |

### Choose the flow

The SDK supports two flows:

| Flow | `flow` value | Use it to | `user-id` |
|------|--------------|-----------|-----------|
| Verification | `onboarding` (default) | Verify a person for the first time | Optional. When it is missing, the backend generates one. Pass your own if you need to match the transaction to your user later |
| Reverification | `reverification` | Check again a person who was already verified | Required. Startup fails without it |

Any `flow` value other than `reverification` runs `onboarding`.

---

## Generate the access token

Your backend requests the token from the Become API with the credentials assigned to you. The browser receives only the resulting token.

1. Your backend sends a `POST` request to the token endpoint with your assigned credentials and the `grant_type` for this integration.
2. The API responds with an access token.
3. Your backend passes the token to the page or link that starts the SDK, together with the contract ID and, when needed, the user ID.

The endpoint, the credential fields, the `grant_type` value, the request format, and the token lifetime are defined in the [API documentation](#api-documentation). This guide does not repeat them.

| Request element | Value |
|-----------------|-------|
| Method | `POST` |
| Endpoint | `<TOKEN_ENDPOINT>`. See [API documentation](#api-documentation) |
| `grant_type` | `<GRANT_TYPE>`. See [API documentation](#api-documentation) |
| Credentials | `<ASSIGNED_CREDENTIALS>`. See [API documentation](#api-documentation) |
| Token in the response | `<TOKEN_RESPONSE_FIELD>`. See [API documentation](#api-documentation) |

Request shape, to complete with the values from the API documentation:

```bash
# Run this on your backend. Never in the browser.
curl -X POST "<TOKEN_ENDPOINT>" \
  -H "Content-Type: <CONTENT_TYPE>" \
  --data "grant_type=<GRANT_TYPE>&<ASSIGNED_CREDENTIALS>"
```

What the SDK expects from the token:

- The value must have the form of a JWT: three segments separated by dots. Otherwise startup fails with `CONFIG_FETCH_FAILED` and the message `Invalid or malformed accessToken`.
- The SDK sends it as `Authorization: Bearer <token>` on its requests to the Become API.
- It must still be valid when the person reaches the end of the flow. See [Token validation and security](#token-validation-and-security).

---

## Token validation and security

For security reasons, the SDK does not validate the access token when it starts.

Before startup, the SDK only checks that a token is present and has the form of a JWT. It does not check the signature, the expiry, or what the token allows. The token is validated by the API. The final validation happens at the last stage, when the API receives the verification submission from the service responsible for it.

What this means for your integration:

- A token that passes startup can still be rejected at the end. In that case `<become-kyc-sdk>` emits `become-kyc:error` with `code: 401`, and the person sees the authorization message on the result screen.
- Generate the token shortly before the person starts, so it does not expire while they complete the flow.
- The token reaches the browser: it is an attribute of the element or a parameter of the link. Your assigned credentials must not. Keep the token request on your backend.
- Send verification links only to the person who verifies. The link carries the token.
- The SDK's own requests also carry the token. If the API rejects the configuration request at startup, startup fails with `CONFIG_FETCH_FAILED` and `status` 401 or 403. See [Troubleshooting](troubleshooting.md#startup-failures).

---

## Run the SDK

Start the SDK with the values from the prerequisites:

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

For reverification, set `flow="reverification"` and the `user-id` of the person already verified.

The person then goes through the steps of your contract. When they finish, the SDK submits the verification to the Become API. Display modes, layout, and every attribute are in [web-sdk.md](web-sdk.md).

### When the SDK's responsibility ends

The SDK's job ends when the person leaves the flow. These are the possible endings for `<become-kyc-sdk>`:

| Ending | Events, in order | Then |
|--------|------------------|------|
| Verification submitted | `become-kyc:event` `result`, then `userFinished` when the person closes the result screen | `redirect-url` opens, if set. The element removes itself |
| Final error | `become-kyc:error` `401` if the token was rejected. When the person closes the error screen: `become-kyc:error` `RESULT_FAILED`, then `userFinished` | `redirect-url` opens, if set. The element removes itself |
| The person closes the flow | `exitedSdk` | The element removes itself. `redirect-url` does not open |
| The person declines the data treatment terms | `atdpDeclined`, then `exitedSdk` | The element removes itself. `redirect-url` does not open |

After any of these, the SDK has completed its part. It does not retrieve the transaction results and does not wait for them.

Keep in mind:

- `result` means that the API accepted the verification submission. `payload.data` is the response to that submission. It is not the transaction result. Retrieve the result in [stage 4](#retrieve-the-transaction-results).
- Opening `redirect-url` is browser navigation. It happens after a final error too, so arriving there does not mean the verification succeeded.
- The Become Button reports the same endings with its `become:*` events. The hosted page emits no events to your application. See [events.md](events.md).

---

## Example: WhatsApp flow

The person stays in your WhatsApp conversation, except for the verification itself. Your integration sends a link to the Become hosted page, the hosted page sends the person back to the chat, and your integration continues the conversation once the webhook arrives and the results are retrieved.

```text
Person (WhatsApp)    Your WhatsApp integration    Hosted page (Become)    Become API
   │── chats ───────────────▶│                             │                    │
   │                         │── 1. token request ─────────────────────────────▶│
   │◀── 2. verification link ─│                             │                    │
   │── 3. opens the link ──────────────────────────────────▶│                    │
   │                         │                             │── 4. submission ──▶│
   │◀── 5. redirect to wa.me ───────────────────────────────│                    │
   │                         │◀──────────────── 6. webhook: results ready ───────│
   │                         │── 7. retrieve results ──────────────────────────▶│
   │◀── 8. conversation continues                           │                    │
```

### Steps

1. The person is chatting with your business on WhatsApp, and your integration decides they must verify.
2. Your backend requests an access token. See [Generate the access token](#generate-the-access-token).
3. Your backend builds a link to the hosted page, with `redirectUrl` set to your WhatsApp chat, and sends it in the conversation.
4. The person opens the link and completes the verification on the hosted page.
5. The hosted page redirects the browser to `redirectUrl`. WhatsApp opens and the person is back in the chat.
6. Your server receives the [webhook notification](#webhook-notification).
7. Your system [retrieves the transaction results](#retrieve-the-transaction-results) with the API.
8. Your integration continues the conversation based on the results.

### Build the link

`https://wa.me/<number>` is WhatsApp's link format for opening a chat. Use your business number in international format, digits only. Build the link on your backend so every value is URL-encoded:

```javascript
// Your backend, after requesting the access token
const link = new URL('https://websdk.svi.becomedigital.net/');
link.search = new URLSearchParams({
  contractId,
  accessToken,
  userId, // lets you match the transaction to this conversation
  flow: 'onboarding',
  locale: 'es',
  redirectUrl: 'https://wa.me/15551234567',
}).toString();
// Send link.toString() to the person in the WhatsApp conversation.
```

For reverification, use `flow: 'reverification'` and the `userId` of the person already verified. Every parameter is in [hosted-web.md](hosted-web.md).

### What to expect

- The redirect only brings the person back to the chat. It does not tell you the outcome: the hosted page redirects as soon as the API accepts the verification, and also when the person closes a final error screen. Continue the conversation from the webhook and the retrieved results, not from the person's return.
- The person can be back in the chat before the webhook arrives. Your integration can reply that the verification is being processed, and continue once the results are retrieved.
- If startup fails or the person declines the data treatment terms, the hosted page does not redirect. The person returns to WhatsApp on their own. Plan for a person who never completes, for example with a timeout in your conversation.
- The hosted page emits no browser events to you. Everything your integration needs comes from the webhook and the API.
- The link carries the access token. Send it only to the person who verifies.

### Alternative: your own page with the Web SDK

Use this when the verification page must be on your domain, or when you want the browser events. The link in step 3 points to your page instead, and the page starts `<become-kyc-sdk>` with `redirect-url` pointing back to the chat. Steps 5 to 8 stay the same.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Identity verification</title>
</head>
<body>
  <script src="https://websdk.svi.becomedigital.net/sdk/become-kyc-sdk.js"></script>
  <script>
    async function startVerification() {
      // Your own endpoint: it requests the access token on your server.
      // Its name and response shape are yours to define.
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
      // Back to the chat when the person closes the result screen.
      sdk.setAttribute('redirect-url', 'https://wa.me/15551234567');

      sdk.addEventListener('become-kyc:event', (event) => {
        if (event.detail.action === 'exitedSdk') {
          // The person left without finishing. Offer a way back to the chat.
        }
      });
      sdk.addEventListener('become-kyc:error', (event) => {
        console.error('Verification error:', event.detail.code);
      });

      document.body.appendChild(sdk);
    }

    startVerification();
  </script>
</body>
</html>
```

`fullscreen` fits a link opened on a phone: the flow covers the viewport and has no close control. With `overlay`, the person can close the flow, and `exitedSdk` does not open `redirect-url`.

On your page, the SDK opens `redirect-url` after `userFinished`, when the person closes the result or final error screen, not as soon as the submission is accepted.

### Other channels

The same approach applies wherever the person receives a link, such as email or SMS, with either option. Only the redirect target changes: point it to where the person should continue, for example a page of your site or your app. The webhook and the result retrieval stay the same.

---

## Webhook notification

The webhook tells your server that a transaction is completed and its results are ready to be retrieved.

### It does not deliver transaction data

The webhook is a notification. It does not contain the transaction results. When it arrives, your system retrieves the results with the API. See [Retrieve the transaction results](#retrieve-the-transaction-results).

It is an HTTP call to your server. It is not a browser event, and listeners on your page do not receive it.

### How it is configured

| Option | Status | How |
|--------|--------|-----|
| Backend configuration | Recommended | The webhook is configured on the backend for your contract. The SDK needs no value for it |
| `webhook-url` attribute, `webhookUrl` URL parameter | Optional and temporary. Not recommended | The SDK sends the value together with the verification submission |

The runtime value exists as a temporary mechanism. A value placed in a page or a link passes through the person's browser. Prefer the backend configuration.

The content of the notification, how to authenticate it, and how to answer it are defined in the [API documentation](#api-documentation).

---

## Retrieve the transaction results

Transaction results are always retrieved separately, with the API, from your own system. They are not delivered by the SDK events, by `redirect-url`, or by the webhook.

1. Wait for the [webhook notification](#webhook-notification).
2. From your system, request the transaction results from the API.
3. Use the results according to your process.

Where step 2 runs depends on your architecture. For example, it could be part of your WhatsApp integration, before it replies to the person, or an internal or external API of your own. This guide does not prescribe one.

The request, its parameters, authentication, and the response format are defined in the [Become KYC API documentation](https://becomedigital.gitbook.io/kyc_api_es). Validation is asynchronous, so the response changes as the validation progresses. See the [API documentation notes](#api-documentation).

---

## Responsibilities at a glance

| Stage | Owner | Responsible for |
|-------|-------|-----------------|
| Prerequisites | Your backend | Keeping the assigned credentials, requesting the access token, choosing `flow` and `user-id` |
| SDK execution | Become SDK | Running the flow in the browser and submitting the verification |
| Final token validation | Become API | Validating the token when it receives the verification submission |
| Webhook notification | Become backend | Notifying your server that the results are ready |
| Result retrieval | Your system | Requesting the transaction results from the API and acting on them |

---

## API documentation

The single authoritative source for the Become API is the **[Become KYC API documentation](https://becomedigital.gitbook.io/kyc_api_es)**. Use it for:

- **Token generation:** endpoint, assigned credential fields, `grant_type`, request format, response, and token lifetime.
- **Transaction result retrieval:** request, parameters, authentication, and response.
- **Webhook notification:** content, authentication, and expected answer.

This guide does not repeat those specifications. When this guide and the API documentation differ on an API detail, the API documentation applies.

Notes:

- The API documentation is written in Spanish.
- Validation is asynchronous. The response of the result retrieval request changes as the validation progresses. Wait for the [webhook notification](#webhook-notification) before you retrieve the results, and handle the states the API documentation describes.
- To get your assigned credentials, or for technical help, contact Become Digital support.
- Sandbox test scenarios, such as the user ID suffixes, are described in the API documentation for direct API calls. With the SDK, the liveness check is always part of the flow. Read the sandbox section of the API documentation before you test an SDK integration.
