import { useState, useEffect } from "/cp/resources/js/preact@10.5.13.hooks.module.js";
import { render } from "/cp/resources/js/preact@10.5.13.module.js";
import { html } from "/cp/resources/js/html.module.js";

function getWrapper(states) {
    let numStates = 0;
    return function Wrapper({comp, onmount}) {

        useEffect(() => {
            onmount();
        }, [comp, onmount]);

        let oldNumStates = numStates;
        numStates = 0;
        while (states.pop());
        while (typeof comp === "function") {
            numStates++;
            if (numStates > oldNumStates && oldNumStates !== 0) {
                console.log("TOO MANY STATES");
            }
            // eslint-disable-next-line
            const [state, setState] = useState(null);
            states.push([state, setState]);
            comp = comp(state, setState);
        }
        if (numStates < oldNumStates) {
            console.log("TOO FEW STATES");
        }

        return html`${comp}`;
    };
}

/// parse the function string to get the number of states
/// currently only supports arrow functions
/// this is a hack, but it works
/// we could make this more efficient by parsing only as much as we need.
function hashStates(comp) {
    const states = [];
    const parts = comp.toString().split(/=>/g).map(s => s.trim());
    for (const part of parts) {
        if (part[0] !== "(") break;
        states.push(part);
    }
    return states.join("|");
}

export default function WrapperShot(classDef) {
    return function(opts) {

        classDef.call(this, opts);

        this.states = [];
        let Wrapper = getWrapper(this.states);
        let oldStateHash = "";

        const oldShow = this.show;
        this.show = (comp, opts) => {

            /* flush the states when show is called with different states */
            const stateHash = hashStates(comp);
            if (stateHash !== oldStateHash) {
                // getting a new wrapper prevents react from trying to reuse the old one
                // and keeps it from complaining about "different number of hooks".
                this.states = [];
                Wrapper = getWrapper(this.states);
            }
            oldStateHash = stateHash;
            /* END clean slate */

            return new Promise(async (resolve) => {
                await oldShow(() => html`<${Wrapper} comp=${comp} onmount=${resolve} />`, opts);
            });
        };
    };
};
