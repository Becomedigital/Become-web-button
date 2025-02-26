# Integrate [Become](https://becomedigital.ai/) KYC Service into Your Website with the Become KYC Web Button

Add the Become KYC button to your website to allow users to complete the Know Your Customer (KYC) process smoothly.

## Usage in Your Code:

To include the Become KYC button in your website, simply add the following HTML tag to your page:

```html
<become-button
  userId="<YOUR_USER_ID>"
  contractId="<YOUR_CONTRACT_ID>"
  token="<YOUR_JWT_TOKEN>"
/>
```

How It Looks on Your Page:

<img src="https://gist.githubusercontent.com/Tyg0th/15c5131ef7d2b24b9effa97eb45dedce/raw/07a5e1f3e428bd1d32bfe2940591872e1ae1ec2d/become-button-example.jpg" width="211" />

## Integration Steps

- Add the Script: Include the following script in your HTML <head> or before the closing <body> tag:

```html
<script src="https://onboarding.svi.becomedigital.net/resources/button.js"></script>
```

- Declare Required Attributes: Use the <become-button> custom element and provide the required attributes such as userId, contractId, and token:

```html
<become-button
  userId="<YOUR_USER_ID>"
  contractId="<YOUR_CONTRACT_ID>"
  token="<YOUR_JWT_TOKEN>"
/>
```

- Dynamically Create the Button with JavaScript: Alternatively, you can dynamically create the button using JavaScript, like so:

```js
const button = document.createElement("become-button");
button.setAttribute("userId", "user_12345");
button.setAttribute("contractId", "contract_67890");
button.setAttribute("token", "your_jwt_token_here");
document.body.appendChild(button);
```

## API Reference

KYC (Know Your Customer) Process

The KYC button integrates the onboarding process for verifying users' identities. When users click on the button, the system initiates the KYC process, requiring the user to upload an identity document or authenticate using other methods.

Button Attributes

| Attribute Name | Description                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| userId         | A unique identifier for the user undergoing KYC verification.                                                                                                                                    |
| contractId     | The contract identifier associated with the KYC process.                                                                                                                                         |
| token          | A JWT token created using company credentials, used for secure API requests.                                                                                                                     |
| country        | A 2-character country code (default: "CO" for Colombia). Example: "FR" for France.                                                                                                               |
| state          | A 2-character state code (only required for users from the US when the country is set to "US").                                                                                                  |
| docType        | Defines the type(s) of documents that can be used for KYC verification. This can be a single string or a comma-separated list of strings. Valid options: national-id, passport, driving-license. |

### Example of docType Usage:

Single Document Type (String):

```html
<become-button
  userId="<YOUR_USER_ID>"
  contractId="<YOUR_CONTRACT_ID>"
  token="<YOUR_JWT_TOKEN>"
  docType="passport"
/>
```

Multiple Document Types (Comma-Separated List):

```html
<become-button
  userId="<YOUR_USER_ID>"
  contractId="<YOUR_CONTRACT_ID>"
  token="<YOUR_JWT_TOKEN>"
  docType="passport,national-id,driving-license"
/>
```

Note: If single document is provided the system will use it as default. If multiple document types are provided as a comma-separated string, the system will accept only the specified document types.

## Events

The KYC button emits events to notify your application about the verification process. Below are the key events you can subscribe to:

| Event Name                 | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| become:verificationStarted | Fired when the KYC verification process begins.                          |
| become:userFinishedSdk     | Fired when the user completes the KYC verification process successfully. |
| become:exitedSdk           | Fired when the user exits the KYC process manually.                      |

### Example Event Listener:

```js
document
  .querySelector("become-button")
  .addEventListener("become:userFinishedSdk", (event) => {
    console.log("User has completed the KYC verification:", event.detail);
  });

// Or using destructuring:

document
  .querySelector("become-button")
  .addEventListener("become:userFinishedSdk", ({ detail }) => {
    console.log("finished payload", detail);
  });
```

### Example Usage:

Here’s an example of how to integrate the KYC button in your website using Vanilla JavaScript:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Become KYC Integration</title>
    <script src="https://onboarding.svi.becomedigital.net/resources/button.js"></script>
  </head>
  <body>
    <!-- Become KYC Button -->
    <become-button
      userId="user123"
      contractId="contract456"
      token="your-jwt-token"
      country="US"
      state="NY"
      docType="passport, national-id"
    ></become-button>

    <script>
      // Example event listener for handling events from the Become KYC button
      document
        .querySelector("become-button")
        .addEventListener("become:userFinishedSdk", function(event) {
          console.log("User has completed the KYC process", event.detail);
        });
    </script>
  </body>
</html>
```

Summary:

- Integration: Add the script and the <become-button> element to your HTML with the necessary attributes.
- Attributes: Pass information like userId, contractId, token, country, state, and docType.
- Events: Subscribe to events to monitor the progress of the KYC verification.

### Full Example:

- Vanilla JS: see [`index.html`](index.html)
