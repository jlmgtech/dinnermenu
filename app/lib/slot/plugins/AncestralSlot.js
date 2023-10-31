import { delay } from "../utils.js";
import Slot from "../Slot.js";

// maps <Slot> components to Slot instances
const slotMap = new Map();
window.slotMap = slotMap;

export default function AncestralSlot(classDef) {
    return function(opts) {
        classDef.call(this, opts);

        this.id = Math.random().toString(36).split(".").pop();
        this.children = new Set();

        if (opts.parent) {
            this.parent = opts.parent;
            this.parent?.children.add(this);
        }

        const oldInit = this.initialize;
        this.initialize = async () => {
            return oldInit();
        };

        const oldFinalize = this.finalize;
        this.finalize = async () => {
            this.parent?.children.delete(this);
            this.parent = null;
            await oldFinalize();
        };

        //this.match = async handlers => {
        //    for (;;) {
        //        const [op, ...args] = await this.capture();
        //        const handler = handlers[op] ?? null;
        //        if (handler) {
        //            return handler(this, ...args);
        //        }
        //    }
        //};

        //this.expect = async (...ops) => {
        //    for (;;) {
        //        const [op, ...args] = await this.capture();
        //        if (ops.includes(op)) {
        //            return [op, ...args];
        //        }
        //    }
        //};

        //this.broadcast = async (...args) => {
        //    await Promise.all(
        //        ([...this.children]).map(c =>
        //            c.answer(...args)));
        //};

        //this.emit = async (...args) => {
        //    this.parent?.answer(...args);
        //};

        const OldSlot = Slot;
        this.Slot = class Slot extends OldSlot {};
        this.Slot.slot = this;
        // ^^ now you can map the react component back to the slot.

        const reactComponent = opts.reactComponent;
        const oldShow = this.show;
        this.show = async (compFunc, opts={}) => {

            // apply any wrapper functions so we can get the component list
            let component = compFunc;
            while (typeof component === "function") {
                component = component();
            }

            //const newchildren = descend(component);

            this.children = new Set();
            const rsp = await oldShow(component, opts);

            return rsp;
        };

        function set_sub(list_a, list_b) {
            return list_a.filter(a => !list_b.includes(a));
        }


    };
}

function reconcile(from, to) {
    if (from instanceof Array) {
        return reconcileArray(from, to);
    }
    if (node instanceof Object) {
        return reconcileNode(from, to);
    }
    return reconcilePrimitive(from, to);
}

function reconcileArray(from, to) {
    if (!(to instanceof Array)) {
        console.log(`replace array ${from} with ${to}`);
        return;
    }

    // this is where you use keys
    // but do that later
    const min = Math.min(from.length, to.length);
    for (let i = 0; i < min; i++) {
        reconcile(from[i], to[i]);
    }
    if (from.length === to.length) {
        return;
    }
    const diff = from.length - to.length;
    if (diff > 0) {
        // remove items
        for (let i = 0; i < diff; i++) {
            //from[from.length + diff];
        }
        return;
    }
    // add items
}

function reconcileNode(from, to) {
}

function reconcilePrimitive(from, to) {
    if (typeof from === typeof to) {
        if (from !== to) {
            console.log(`chg primitive ${from} to ${to}`);
        }
    }
}

function descend(node, output=[]) {
    if (node instanceof Array) {
        descendArray(node, output);
    } else if (node instanceof Object) {
        descendNode(node, output);
    }
    return output;
}

function descendArray(list, output) {
    for (const node of list) {
        descend(node, output);
    }
}

function descendNode(node, output) {
    if (node.type && node.type.name === "Slot") {
        output.push(node.type.slot);
        return;
    }
    if (node.props && node.props.children instanceof Array) {
        descendArray(node.props.children, output);
    }
}
