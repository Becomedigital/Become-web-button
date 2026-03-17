import { LitElement, html, css } from "lit-element";
import hexToHsl from "./hex-to-hsl";
import "./become-spinner";

const DEFAULT_COLOR = "green";

const COLOR_MAP = {
  blue: "#3757FF",
  green: "#00B257",
  red: "#EB5757",
  pink: "#FF527E",
  orange: "#F2994A",
  yellow: "#FFBD00"
};

const TRANSLATIONS = {
  en: { verify: "Verify me" },
  es: { verify: "Verifícame" },
  fr: { verify: "Vérifie moi" },
  pt: { verify: "Me confirma" }
};

function isDark(hexColor) {
  const [, , lightness] = hexToHsl(hexColor);
  return lightness < 70;
}

export default class BecomeButtonElement extends LitElement {
  static get properties() {
    return {
      role: { type: String, reflect: true },
      tabindex: { type: Number, reflect: true },
      ariaPressed: { type: String, reflect: true, attribute: "aria-pressed" },
      disabled: { type: Boolean },
      loading: { type: Boolean, reflect: true },
      language: { type: String },
      color: { type: String },
      logo: { type: String },
      radius: { type: String }
    };
  }

  static get styles() {
    return css`
      :host {
        position: relative;
        width: 100%;
        display: inline-flex;
        align-items: stretch;
        height: 43px;
        box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
        transition: box-shadow 200ms ease-in-out;
        border-radius: 4px;
        outline: 0;
        overflow: hidden;
        font-family: sans-serif;
        font-size: 15px;
        letter-spacing: 0.8px;
        white-space: nowrap;
        user-select: none;
      }

      :host(:not([disabled])) {
        cursor: pointer;
      }

      :host([disabled]) main {
        background: #eee;
        cursor: default;
      }

      :host(:active:not([disabled])) {
        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.15);
      }

      figure {
        margin: 0;
        padding: 0 15px;
        background: white;
        display: flex;
        align-items: center;
      }

      figure svg,
      figure img {
        width: 24px;
      }

      main {
        transition: background-color 100ms linear;
        padding: 0 40px;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      :host([loading]) label {
        visibility: hidden;
      }
      
      label {
        cursor: pointer;
      }

      become-spinner {
        position: absolute;
      }
      
    `;
  }

  constructor() {
    super();
    this.role = "button";
    this.tabindex = 0;
    this.ariaPressed = "false";
    this.color = DEFAULT_COLOR;
    this.defaultLanguage = "en";
    this.language = this.defaultLanguage;
  }

  set color(value) {
    const oldValue = this.color;
    this._color = value;
    this.requestUpdate("color", oldValue);
  }

  get color() {
    let colorValue = this._color;
    if (
      !colorValue ||
      !(
        Object.keys(COLOR_MAP).includes(colorValue) ||
        colorValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      )
    ) {
      colorValue = DEFAULT_COLOR;
    }
    return COLOR_MAP[colorValue] || colorValue;
  }

  get translations() {
    return TRANSLATIONS[this.language] || TRANSLATIONS[this.defaultLanguage];
  }

  render() {
    return html`
      <figure><img src="${this.logo}" alt="Become" /></figure>
      <main>
        ${this.loading
          ? html`
              <become-spinner />
            `
          : null}
        <label>${this.translations.verify}</label>
      </main>
    `;
  }

  updateStyles() {
    this.shadowRoot.querySelector("main").style.backgroundColor = this.color;
    this.shadowRoot.querySelector("main").style.color = isDark(this.color)
      ? "white"
      : "black";
    this.style.borderRadius = this.radius || "4px";
  }

  firstUpdated() {
    this.updateStyles();
  }

  updated(props) {
    if (props.has("color") || props.has("radius")) {
      this.updateStyles();
    }
  }
}

customElements.define("become-button-element", BecomeButtonElement);
