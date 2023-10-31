import { forever } from "./utils.js";

export default function SlotGroup() {

    // <${Slot} group=${grp} flow=... />

    const slots = [];
    const ress = [];
    const prms = [];
    const done = new Set();

    this.size = 0;
    /// add is called by the slot when a group is specified:
    this.add = slot => {
        if (slots.includes(slot)) {
            throw new Error("slot already in group - cannot add again");
        }
        slots.push(slot);
        return this.size++;
    };

    this.onCapture = slot_id => {
        if (typeof ress[slot_id] === "function") {
            ress[slot_id]();
        }
    };
    this.onEnd = slot_id => {
        this.onCapture(slot_id);
        const slot = slots[slot_id];
        if (!slot.running) {
            done.add(slot_id);
        }
    };

    /// register a promise for the next capture call:
    this.nextCapture = slot_id => {
        prms[slot_id] = new Promise(
            resolve =>
                ress[slot_id] = () =>
                    resolve(slot_id));
        return prms[slot_id];
    };

    const flow_exited = slot_id => {
        return done.has(slot_id);
    };

    this.answer = async (message) => {
        console.log("broadcasting ", message);
        for (let slot_id = 0; slot_id < slots.length; slot_id++) {
            await slots[slot_id].answer(message);
            if (!flow_exited(slot_id)) {
                await this.nextCapture(slot_id);
            }
        }
    };

    this.answerAsync = async (message) => {
        console.log("broadcasting ", message);
        const promises = [];
        for (let slot_id = 0; slot_id < slots.length; slot_id++) {
            promises.push(slots[slot_id].answer(message).then(() => {
                if (!flow_exited(slot_id)) {
                    return this.nextCapture(slot_id);
                }
            }));
        }
        await Promise.all(promises);
    };

};
