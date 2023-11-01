import { delay } from "../utils.js";
import Slot from "../Slot.js";
import {Store} from "../utils.js";
import html from "html";

export default function SignalSlot(classDef) {
    console.log("wrapped in SignalSlot");
    return function(opts) {
        classDef.call(this, opts);
        console.log("signal slot invoked");

        this.match = async handlers => {
            for (;;) {
                const [op, ...args] = await this.capture();
                const handler = handlers[op] ?? null;
                if (handler) {
                    return handler(this, ...args);
                }
            }
        };

        this.expect = async (...ops) => {
            for (;;) {
                const [op, ...args] = await this.capture();
                if (ops.includes(op)) {
                    return [op, ...args];
                }
            }
        };

        this.broadcast = async (...args) => {
            await Promise.all(
                ([...this.children]).map(c =>
                    c.answer(...args)));
        };

        this.emit = async (...args) => {
            this.parent?.answer(...args);
        };

        this.vmatch = async (title, handlers) => {
            // the idea is to automatically create a view based on the match params
            const output = [];
            for (const [op, handler] of Object.entries(handlers)) {
                const stores = [];
                const args = parseArgsFromFxn(handler).slice(1);
                const row = [];
                row.push(html `<h4>${op}</h4>`);
                for (const arg of args) {
                    const store = new Store("");
                    row.push(html `
                        <div class="col-md-6">
                            <input class="form-control" type="text" placeholder="${arg}" value=${store} onInput=${store.bind} />
                        </div>
                    `);
                    stores.push(store);
                }
                row.push(html `
                    <div class="col-md-4"> </div>
                    <div class="col-md-4">
                        <br />
                        <button class="btn btn-primary form-control" onClick=${() => this.answer(op, ...args.map((a, i) => stores[i].get()))}>
                            ${op}
                        </button>
                        <br />
                        <br />
                    </div>
                    <hr />
                `);
                output.push(html `
                    <div class="row">
                        ${row}
                    </div>
                `);
            }
            this.show(() => html `
                <div class="container">
                    <h3>${title}</h3>
                    ${output}
                </div>
            `);
            return await this.match(handlers);
        };
    };
}

// TODO - use an actual JS parser.
function parseArgsFromFxn(fxn) {
    const input = fxn.toString();
    const args = input
        .split("=>")[0]
        .split("(")[1]
        .split(")")[0]
        .split(",")
        .map(s => s.trim());
    return args;
}
