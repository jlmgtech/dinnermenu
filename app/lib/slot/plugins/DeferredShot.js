export default function DeferredShot(classDef) {
    return function(opts) {

        classDef.call(this, opts);

        this.deferrals = [];
        this.defer = (action) => {
            this.deferrals.push(action);
        };

        const oldFinalize = this.finalize;
        this.finalize = async (...args) => {
            let action;
            // eslint-disable-next-line no-cond-assign
            while (action = this.deferrals.pop()) {
                await action();
            }
            return await oldFinalize(...args);
        };

        const oldOnReturn = this.onreturn;
        this.onreturn = async (...args) => {
            let action;
            // eslint-disable-next-line no-cond-assign
            while (action = this.deferrals.pop()) {
                await action();
            }
            return await oldOnReturn(...args);
        };

    };
}
