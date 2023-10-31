export default function CaptureShot(classDef) {
    return function(opts) {
        classDef.call(this, opts);
        this.resolver = () => {};

        this.answer = async (...values) => {
            // answer just resolves the promise returned by show
            await Promise.resolve();
            this.resolver(values);
        };

        this.capture = async (comp, opts) => {
            const result = await Promise.all([
                (async () => {
                    if (comp) await this.show(comp, opts);
                })(),
                new Promise(resolve => {
                    this.resolver = resolve;
                })
            ]);
            return result[1];
        }
    };
}
