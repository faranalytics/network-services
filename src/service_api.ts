import { CallMessage, ResultMessage } from "./messages";
import { StreamClosedError, CallTimeoutError } from "./errors";
import { IdentifierGenerator, NumericIdentifierGenerator } from "./identifier_generator";
import { Mux } from "./mux";

export interface CallOptions {
    id: string;
    r: (value: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: (reason?: any) => void;
    timeoutId?: NodeJS.Timeout;
}

export class Call {
    public id: string;
    public r: (value: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public e: (reason?: any) => void;
    public timeoutId?: NodeJS.Timeout;

    constructor({ id, r, e, timeoutId }: CallOptions) {
        this.id = id;
        this.r = r;
        this.e = e;
        this.timeoutId = timeoutId;
    }
}

export interface ServiceAPIOptions {
    timeout?: number;
    identifierGenerator?: IdentifierGenerator;
}

export class ServiceAPI {
    public callRegistrar: Map<string, Call>;
    public mux: Mux;
    public timeout?: number;
    public identifierGenerator: IdentifierGenerator;

    constructor(mux: Mux, options?: ServiceAPIOptions) {
        this.timeout = options?.timeout;
        this.callRegistrar = new Map<string, Call>();
        this.mux = mux;
        this.identifierGenerator = options?.identifierGenerator ?? new NumericIdentifierGenerator();

        this.mux.stream.on('error', (err: Error) => {
            try {
                for (const [key, call] of this.callRegistrar.entries()) {
                    if (call.timeoutId) {
                        clearTimeout(call.timeoutId);
                    }
                    this.callRegistrar.delete(key);
                    call.e(err);
                }
            }
            catch (err) {
                console.error(err);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.mux.stream.once('close', (hadError: boolean) => {
            try {
                for (const [key, call] of this.callRegistrar.entries()) {
                    if (call.timeoutId) {
                        clearTimeout(call.timeoutId);
                    }
                    this.callRegistrar.delete(key);
                    call.e(new StreamClosedError('The `stream.Duplex` closed.'));
                }
            }
            catch (err) {
                console.error(err);
            }
        });

        this.mux.on('result', this.evaluateResultMessage.bind(this));
    }

    public async call(props: Array<string>, ...args: Array<unknown>): Promise<unknown> {

        return new Promise((r, e) => {
            try {
                const id = this.identifierGenerator.getIdentifier();
                let timeoutId;
                if (this.timeout) {
                    timeoutId = setTimeout(() => {
                        this.callRegistrar.delete(id);
                        e(new CallTimeoutError(`${this.timeout}ms.`));
                    }, this.timeout);
                }
                const call = new Call({ id, r, e, timeoutId });
                this.callRegistrar.set(id, call);
                this.mux.mux(new CallMessage({ type: 0, id, props, args }));
            }
            catch (err) {
                e(err);
            }
        });
    }

    protected evaluateResultMessage(message: ResultMessage): void {
        try {
            const id: string = message.id;
            const call = this.callRegistrar.get(id);
            this.callRegistrar.delete(id);
            if (call) {
                const type: 1 | 2 = message.type;
                const result: unknown = message.data;
                if (call.timeoutId) {
                    clearTimeout(call.timeoutId);
                }
                if (type == 1) {
                    const error: { [key: string]: unknown } = new Error() as unknown as { [key: string]: unknown };
                    for (const [key, value] of Object.entries<unknown>(result as { [key: string]: unknown })) {
                        error[key] = value;
                    }
                    call.e(error);
                }
                else if (type == 2) {
                    call.r(result);
                }
                else {
                    throw new Error("`ResultMessage` has neither an `Error` nor a value.");
                }
            }
            else {
                throw new Error("`ResultMessage` has an unregistered identifier.");
            }
        }
        catch (err) {
            console.error(err);
        }
    }
}
