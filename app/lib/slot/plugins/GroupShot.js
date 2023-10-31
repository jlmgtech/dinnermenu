export default function GroupShot(classDef) {
    return function(opts) {
        classDef.call(this, opts);

        const group = opts.group ?? null;
        let slot_id = -1;
        if (group) {
            slot_id = group.add(this);
        }

        // <${Slot} group=${grp} ...>

        const oldCapture = this.capture;
        this.capture = async (...args) => {
            if (group) {
                group.onCapture(slot_id);
            }
            return await oldCapture(...args);
        };

        const oldOnReturn = this.onreturn;
        this.onreturn = async (...args) => {
            if (group) {
                group.onEnd(slot_id, this.running);
            }
            return await oldOnReturn(...args);
        };


    };
}
