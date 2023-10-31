import { useState, useEffect } from "preact/hooks";
import html from "html";
import Shot from "./plugins/Shot.js";
import DeferredShot from "./plugins/DeferredShot.js";
import CaptureShot from "./plugins/CaptureShot.js";
import ReactiveShot from "./plugins/ReactiveShot.js";
import AnimSlot from "./plugins/AnimShot.js";
import GroupShot from "./plugins/GroupShot.js";
import AncestralSlot from "./plugins/AncestralSlot.js";
import SignalSlot from "./plugins/SignalSlot.js";
export { default as SlotGroup } from "./SlotGroup.js";
const SlotClass = GroupShot(AnimSlot(CaptureShot(ReactiveShot(SignalSlot(AncestralSlot(DeferredShot(Shot)))))));

export default function Slot(opts) {
    const [comp, setComp] = useState('');
    function effect(newopts) {
        opts = {
            ...opts,
            setComp,
            reset: (newflow) => effect.call(this, {flow: newflow}),
            reactComponent: this,
            ...newopts,
        };
        const slot = new SlotClass(opts);
        this.slot = slot;
        slot.initialize().then(() => slot.runloop());
        return slot.finalize;
    };

    useEffect(effect.bind(this), [...Object.values(opts)]);
    return comp;
}

/// a way to specify the location of slots in a layout
export function Stamp() {
    let res = null;
    let numcalls = 0;
    this.stamp = () => html `<${Slot} flow=${(slot) => {
        if (numcalls++) throw new Error("can only call stamp() once per Stamp instance");
        res(slot);
        return new Promise(()=>{});
    }} />`;
    const prm = new Promise((resolve) => {
        res = resolve;
    });
    this.slot = () => {
        return prm;
    };
}
