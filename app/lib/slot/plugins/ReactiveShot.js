import { autorun } from "../utils.js";

export default function ReactiveShot(classDef) {
    return function(opts) {
        classDef.call(this, opts);

        let lastCancel = ()=>{};
        const oldShow = this.show;

        this.show = (compFunc, opts={}) => {
            if (typeof compFunc !== "function") {
                throw new TypeError("1st arg to show must be a function");
            }
            lastCancel();
            let rsp = null;
            const cancel = autorun(() => {
                const deps = opts.vars ?? [];
                for (const dep of deps) dep(); // track dependencies explicitly (not always necessary)
                rsp = oldShow(compFunc, opts);
            });
            lastCancel = cancel;
            this.defer(cancel);
            return rsp;
        };
    };
}
