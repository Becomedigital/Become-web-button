import { LitElement, html, css } from "lit-element";
import "./become-button-element";
import "./become-frame";

const EventBase = "become";

const Events = {
  loaded: "loaded",
  error: "errorSdk",
  exitedSdk: "exitedSdk",
  userFinishedSdk: "userFinishedSdk",
};

function htmlDecode(string) {
  const e = document.createElement("textarea");
  e.innerHTML = string;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

export default class BecomeButton extends LitElement {
  static get properties() {
    return {
      clientId: { type: String },
      token: { type: String },
      userId: { type: String },
      contractId: { type: String },
      docType: { type: String },
      country: { type: String },
      state: { type: String },
      apiHost: { type: String },
      signupHost: { type: String },
      disabled: { type: Boolean },
      loading: { type: Boolean },
      color: { type: String },
      language: { type: String },
      metadata: { type: String },
      flowId: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
      }
    `;
  }

  constructor() {
    super();
    this.disabled = true;
    this.loading = true;
    this.apiHost = "https://api.svi.becomedigital.net";
    this.signupHost = "https://onboarding.svi.becomedigital.net/";
    [this.language] = navigator.language.split("-");
    this.metadata = null;

    this.addEventListener("click", this.openIframe);
    this._boundHandleFrameMessages = this.handleFrameMessages.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("message", this._boundHandleFrameMessages);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("message", this._boundHandleFrameMessages);
  }

  get metadata() {
    return this._metadata ? htmlDecode(this._metadata) : this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
  }

  handleFrameMessages({ data }) {
    try {
      let parsedData;

      // Check if data is already an object
      if (typeof data === "string") {
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // If it's not valid JSON, it's likely not our message, so we ignore it silently
          return;
        }
      } else if (typeof data === "object" && data !== null) {
        parsedData = data;
      } else {
        return;
      }

      if (!parsedData?.action || !parsedData?.payload) {
        return;
      }

      const { action, payload } = parsedData;

      // Check if action is defined and is a string
      if (typeof action === "string" && action.includes("::")) {
        const [, actionName] = action.split("::");
        switch (actionName) {
          // Handle different actions
          case Events.loaded:
            this.disabled = false;
            this.loading = false;
            break;
          case Events.exitedSdk:
          case Events.userFinishedSdk:
            this.removeFrame();
            break;
        }
        this.emitEvent(actionName, payload);
      }
    } catch (e) {
      // We only reach here if something genuinely went wrong during processing
      console.error("Become: error processing message from popup", e);
      this.emitEvent(Events.error, e);
    }
  }

  emitEvent(name, payload) {
    const event = new CustomEvent(`${EventBase}:${name}`, {
      detail: {
        ...payload,
      },
    });
    this.dispatchEvent(event);
  }

  removeFrame() {
    const oldIframe = document.querySelector("become-frame");
    if (oldIframe) {
      oldIframe.remove();
    }
  }

  openIframe() {
    this.disabled = true;
    this.loading = true;
    this.removeFrame();
    const frame = document.createElement("become-frame");
    for (const key of [
      "signupHost",
      "userId",
      "contractId",
      "token",
      "country",
      "state",
    ]) {
      this[key] && frame.setAttribute(key, this[key]);
    }
    window.document.body.appendChild(frame);

    // Force re-enable button and allow user to retry the click.
    setTimeout(() => {
      this.disabled = false;
      this.loading = false;
    }, 2000);
  }

  async firstUpdated() {
    const api = `${this.apiHost}/api/v1/merchants/me`;
    const headers = {
      authorization: `Bearer ${this.clientId}`,
    };
    try {
      /*const response = await fetch(api, { headers });
      const {
        configurations: {
          style: { color }
        }
      } = await response.json();
      this.color = color;*/

      setTimeout(() => {
        this.loading = false;
      }, 1000);
    } catch (e) {
      setTimeout(() => {
        this.loading = false;
      }, 1000);
      console.error("Become: unable to read data for the client");
    }
  }

  render() {
    return html`
      <become-button-element
        ?disabled="${this.disabled}"
        ?loading="${this.loading}"
        color="${this.color}"
        language="${this.language}"
      ></become-button-element>
    `;
  }
}

customElements.define("become-button", BecomeButton);
