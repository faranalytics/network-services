import { CallMessage, ResultMessage } from "./messages";
import { QueueSizeLimitError, PropertyPathError } from "./errors";
import { Async, Callable, PropPath } from "./types";
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
                    throw new PropertyPathError(`The property path, ${propPath}, is not an allowed property path.`);
                }
            }

            let base = <{ [k: string]: unknown }>this.app;
            for (let i = 0; i < props.length - 1; i++) {
                base = <{ [k: string]: unknown }>base[props[i]];
            }

            if (typeof base[props[props.length-1]] != 'function') {
                throw new TypeError(`${props[props.length-1]} is not a function`);
            }

            const result = await (<Callable>base[props[props.length-1]])(...message.args);
            this.mux.mux(new ResultMessage({ type: 2, id, data: result }));
        }
        catch (err) {
            if (!(err instanceof QueueSizeLimitError)) {
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
            for (const name of Object.getOwnPropertyNames(err).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(err)))) {
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