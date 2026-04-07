/* eslint-disable no-undef */
__webpack_public_path__ = "https://aval.svi.becomedigital.net/sdk/";

const WEBCOMPONENTS_ROOT =
  "https://unpkg.com/@webcomponents/webcomponentsjs@2.3.0/";
window.WebComponents = window.WebComponents || {};
window.WebComponents.root = window.WebComponents.root || WEBCOMPONENTS_ROOT;
const script =
  document.querySelector("script#webcomponentsLoader") ||
  document.createElement("script");
script.id = "webcomponentsLoader";
script.src = `${WEBCOMPONENTS_ROOT}webcomponents-loader.js`;
document.head.appendChild(script);

if (WebComponents.ready) {
  require("./src/become-button");
} else {
  addEventListener("WebComponentsReady", () => require("./src/become-button"));
}
