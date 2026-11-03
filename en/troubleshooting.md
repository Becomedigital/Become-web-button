# Troubleshooting

What the person sees when something fails, which event your page receives, and fixes for common integration problems. Event payloads and error codes are in [events.md](events.md#error-codes).

## Startup failures

Startup loads your contract configuration and checks the runtime values. It fails when `contract-id` or `access-token` is missing, the token is malformed, `user-id` is missing in `reverification`, or the configuration request fails. The element shows a safe sentence to the person and your page receives the diagnostic.

### Web SDK

`<become-kyc-sdk>` paints the flow only after startup succeeds. Until then, it owns the visible error. It uses the mode already selected by the `mode` attribute (default `embed`):

| When | What the user sees |
|------|--------------------|
| `embed` startup fails | A message inside the element, in the embedded area. No page-level notice. |
| `overlay` or `fullscreen` startup fails before the SDK opens | The element itself becomes the viewport surface and shows an alert dialog. Close dismisses that surface. The element stays in the page. |
| Startup can be retried (`retryable`) | A retry control runs startup again. |
| The SDK is already mounted | The SDK paints the failure inside the open experience. The element does not add a second message. |
| The element is removed while startup is in flight | No error surface is left behind. |

`become-kyc:error` still carries the diagnostic (`CONFIG_FETCH_FAILED`, `message`, `status`, `retryable`). The sentence in the element is the SDK catalog sentence (`errors.startup`): it does not include tokens, status codes, or response bodies. Override it with `setConfig({ texts })` before the element starts. HTTP 401 and HTTP 403 use the authorization sentence, not a wrong end-user credential. The startup retry and close labels are `Reintentar` and `Cerrar`. Leaving the flow (`exitedSdk`, `userFinished`, `atdpDeclined`) is not a startup error.

### Become Button

The button loads the configuration when it is clicked, so a startup failure appears at that moment:

| When | What the user sees |
|------|--------------------|
| `overlay` (default) or `fullscreen` | An alert dialog over the page, with close, and retry when the failure is `retryable`. |
| `embed`, button visible | The message under the button. |
| `embed`, button hidden (`hidden`, or `display: none` / `visibility: hidden` on the button or an ancestor) | A non-blocking page notice with the same sentence, and retry only when `retryable` is true. Closing or removing the button removes the notice. |
| Failure is not `retryable` | The button is disabled. |

The failure is emitted as `become:errorSdk` (`code`, `message`, `status`, `retryable`). The user sentence is the SDK catalog sentence (`errors.startup`) and does not include the diagnostic text. Override it with `setConfig({ texts })` before opening the SDK. The SDK also emits `become-kyc:error` on `document` for the same failure. Listen to one contract.

After the SDK has opened, an error is forwarded once as `become:errorSdk`. The button does not paint that error again. User exit is not a startup failure.

### Hosted page

The page shows a message for the `locale` you passed, with retry only when the failure can be retried. It does not show the access token, and your application is not notified in the browser. See [hosted-web.md](hosted-web.md#behavior).

## Errors during the flow

Once the flow is open, the SDK shows errors inside the card and the person can retry where that is possible. Your page receives `become-kyc:error` for blocking failures: `401` when the verification submission is not authorized, and `RESULT_FAILED` when the person closes the final error screen. See [Error codes](events.md#error-codes).

The API validates the access token when it receives the verification submission, at the end of the flow. A token that expired while the person completed the flow is reported there as `401`. See [Token validation and security](integration-guide.md#token-validation-and-security).

## Common issues

| Symptom | Cause and fix |
|---------|---------------|
| The embedded flow is empty or cut off | The host has no height. Give the element, or a parent, a definite height of at least 560px and a width of at least 280px. See [Layout](web-sdk.md#layout) |
| My listener receives nothing from the hosted link | The hosted page's events stay inside that page and never reach yours, also when it is in an iframe. Use `redirectUrl` in the browser and the [webhook notification](integration-guide.md#webhook-notification) on your server. `<become-kyc-sdk mode="fullscreen">` on your own page does emit events |
| `become-kyc:error` with `401` at the end of the flow | The API rejected the access token at submission, for example because it expired. Generate the token shortly before the person starts. See [Token validation and security](integration-guide.md#token-validation-and-security) |
| The webhook arrives without transaction data | Expected. The webhook only says the results are ready. Retrieve them with the API. See [Retrieve the transaction results](integration-guide.md#retrieve-the-transaction-results) |
| `result` was emitted, but `payload.data` is not the transaction result | Expected. `data` is the response to the verification submission. Retrieve the transaction results with the API |
| The browser opened `redirect-url` after an error | Expected. `redirect-url` opens after `userFinished`, which also follows a final error. Do not treat the redirect as a success signal |
| My `become-kyc:*` listener receives nothing from the button | The button emits `become:*` events on the button element. See [Events](events.md#become-button-events) |
| The flow starts over by itself | An attribute other than `theme-mode` changed, or the element was removed and added back. Both restart `<become-kyc-sdk>` |
| The element disappears | `<become-kyc-sdk>` removes itself after `userFinished` and `exitedSdk`, which includes declining the data treatment terms |
| Texts show in Spanish with `locale="en"` | The SDK ships Spanish texts. Add texts for that locale in the Dashboard. See [Texts and locales](customization.md#texts-and-locales) |
| Hover and pressed colors keep the old brand color | Set `primaryHover`, `primaryActive`, and `primaryText` together with `primary`. See [Colors](customization.md#colors) |
| `setConfig({ theming: { mode: 'dark' } })` does nothing | The palette is selected with the `theme-mode` attribute. See [Theme mode](customization.md#theme-mode) |
| A country, document type, or state is ignored | The value was invalid and was dropped. `become-kyc:warning` lists it. See [Runtime values](api.md#runtime-values) |
| Startup fails in `reverification` | `user-id` is required in that flow |
| Child content inside `<become-button>` is not shown | The button renders its own label. Use `button-text`, `hide-icon`, or the `icon` property. See [button.md](button.md#button-label-and-icon) |
