export default function AnimShot(classDef) {
    return function(opts) {
        classDef.call(this, opts);

        let oldLeave;
        let currentOptions = {};

        const oldShow = this.show;
        this.show = async (comp, opts={}) => {
            currentOptions = opts;

            // perform leave animation from previous show call:
            await invoke(oldLeave);

            oldLeave = opts.onLeave;
            await oldShow(() => comp, opts);

            // perform enter animation:
            await invoke(opts.onEnter);

        };

        const oldAnswer = this.answer;
        this.answer = async (...args) => {
            await invoke(currentOptions.onAnswer ?? currentOptions.onLeave);
            return await oldAnswer(...args);
        };
    };
}

function invoke(func) {
    if (typeof func === "function") {
        return func();
    }
    return Promise.resolve();
}
