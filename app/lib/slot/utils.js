export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const forever = () => new Promise(() => {});

export const animready = async () => {
    for (let i = 0; i < 4; i++) await delay(0);
};

//// RVAR ////
//let current_func = null;
const current_funcs = [];
let rvar_list = [];

export class Store {

    constructor(value) {
        this.value = value;
        this.listeners = [];

        // convenience function for setting this value from an onInput/onChange event:
        this.bind = (e) => this.set(e.currentTarget.value);
    }

    untrack(func) {
        this.listeners = this.listeners.filter(l => l !== func);
    }

    /// return the wrapped value and subscribe to whichever autorun you're in
    get() {
        // NOTE - test the case where an autorun is within another autorun. How should this behave?
        // I think it will only subscribe to the inner autorun.
        // However, I think maybe this pattern should not be allowed.
        // autorun(() => {
        //      autorun(() => {
        //          console.log(store.get());
        //      });
        // });
        //if (typeof current_func === "function") {
        if (current_funcs.length) {
            //this.listeners.push(current_func);
            this.listeners.push(current_funcs.at(-1));
            rvar_list.push(this);
        }
        return this.value;
    }

    /// change wrapped data and trigger listeners
    set(value) {
        const oldval = this.value;
        this.value = value;
        this.trigger();
        return value;
    }

    /// trigger listeners without changing the data
    trigger() {
        for (const listener of this.listeners) {
            if (current_funcs.includes(listener)) {
                console.warn("Store debugging: reason = autorun listener is setting its own value");
                console.warn("Store debugging: previous value = " + oldval);
                console.warn("Store debugging: previous value = " + this.value);
                console.warn("Store debugging: listener = " + listener);
                throw new Error("Infinite loop - setting an Store within its own listener will cause the listener to run forever and brick your computer. See stack trace.");
            } else {
                listener();
            }
        }
    }

    valueOf() {
        return this.get();
    }

    toString() {
        return this.get();
    }
}

export function autorun(func) {
    //const last_func = current_func;
    // ^ no translation
    const last_rvar_list = rvar_list;

    //current_func = func;
    current_funcs.push(func);
    rvar_list = [];
    func();

    const cancel = ((rvar_list) => () => {
        for (const rvar of rvar_list) {
            rvar.untrack(func);
        }
    })(rvar_list);

    //current_func = last_func;
    current_funcs.pop();
    rvar_list = last_rvar_list;

    return cancel;
}

// note - preprocess html `` template literals
// filter through all the variables and if any are instanceof Store, then sync them to that function.
//// RVAR ////
