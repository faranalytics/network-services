import { CallMessage, ResultMessage } from "./messages";
import { QueueSizeLimitError, PropertyPathError } from "./errors";
import { Async, PropPath } from "./types";
import { Mux } from "./mux";

export interface ServiceAppOptions<T extends object> {
    paths?: Array<PropPath<Async<T>>>;
}

export class ServiceApp<T extends object> {
    public app?: object;
    public paths?: Array<PropPath<Async<T>>>;
    public mux: Mux;

    constructor(app: T, mux: Mux, options?: ServiceAppOptions<T>) {
        this.app = app;
        this.paths = options?.paths;
        this.mux = mux;

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.mux.on('call', this.tryCall.bind(this));

        this.mux.stream.once('close', () => {
            delete this.app;
        });
    }

    protected async tryCall(message: CallMessage): Promise<void> {
        const id = message.id;
        try {
            const props = message.props;

            let propPath;
            if (this.paths) {
                propPath = <PropPath<Async<T>>>props.join('.');
                if (this.paths.indexOf(propPath) == -1) {
                    throw new PropertyPathError(`The property path \`${propPath}\` is not an allowed property path.`);
                }
            }

            let base = <{ [k: string]: unknown }>this.app;
            for (let i = 0; i < props.length; i++) {
                const name = props[i];
                if (typeof name == 'string') {
                    const value = base[name];
                    if (typeof value == 'function' && name in base) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const result = await value.call(base, ...message.args);
                        this.mux.mux(new ResultMessage({ type: 2, id, data: result }));
                        return;
                    }
                    else if (value !== null && typeof value == 'object' && !Array.isArray(value)) {
                        base = <{ [k: string]: unknown }>value;
                        continue;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            throw new TypeError(`${propPath ?? props.join('.')} is not a function.`);
        }
        catch (err) {
            if (err instanceof QueueSizeLimitError) {
                console.error(err);
            }
            else {
                try {
                    const error = this.createError(err);
                    this.mux.mux(new ResultMessage({ type: 1, id, data: error }));
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    }

    protected createError(err: unknown): { [key: string]: unknown } {
        if (err instanceof Error) {
            const error: { [key: string]: unknown } = {};
            for (const name of Object.getOwnPropertyNames(err)) {
                error[name] = (err as unknown as { [key: string]: unknown })[name];
            }
            return error;
        }
        else {
            const error: { [key: string]: unknown } = {};
            error.message = err?.toString?.();
            return error;
        }
    }
}