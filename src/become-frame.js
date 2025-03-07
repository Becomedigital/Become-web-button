import {LitElement, html, css} from "lit-element";

export default class BecomeFrame extends LitElement {
    static get properties() {
        return {
            clientId: {type: String},
            token: {type: String},
            userId: {type: String},
            contractId: {type: String},
            country: {type: String},
            docType: {type: String},
            state: {type: String},
            disabled: {type: Boolean, reflect: true},
            signupHost: {type: String},
            metadata: {type: String},
            flowId: {type: String}
        };
    }

    static get styles() {
        return css`
          iframe {
            z-index: 2147483647;
            background: rgba(0, 0, 0, 0.004);
            border: 0px none transparent;
            overflow: hidden auto;
            visibility: visible;
            margin: 0px;
            padding: 0px;
            position: fixed;
            left: 0px;
            top: 0px;
            width: 100%;
            height: 100%;
            -webkit-tap-highlight-color: transparent;
          }
        `;
    }

    constructor() {
        super();
        this.metadata = null;
    }

    render() {
        const url = new URL(this.signupHost);
        [["accessToken", this.token], ["userId", this.userId], ["contractId", this.contractId], ["country", this.country], ["state", this.state], ["docType", this.docType]]
            .filter(([unused, value]) => value)
            .forEach(([attr, value]) => url.searchParams.append(attr, value));
        return html`
            <iframe
                    frameborder="0"
                    src="${url}"
                    allow="geolocation; microphone; camera; midi; encrypted-media;"
            ></iframe>
        `;
    }
}
customElements.define("become-frame", BecomeFrame);
