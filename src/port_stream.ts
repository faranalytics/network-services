import * as worker_threads from "node:worker_threads";
import * as stream from "node:stream";
import { CallMessage, ResultMessage } from "./messages";

const $data = Symbol('data');

export class PortStream extends stream.Duplex {
    public port?: worker_threads.MessagePort | worker_threads.Worker;
    public messageQueue: Array<CallMessage | ResultMessage>;

    constructor(port?: worker_threads.MessagePort | worker_threads.Worker, options?: stream.DuplexOptions) {
        super({ ...options, ...{ objectMode: true } });
        this.messageQueue = [];
        this.port = port ? port : worker_threads.parentPort ? worker_threads.parentPort : undefined;
        if (this.port) {
            this.port.on('message', (message: CallMessage | ResultMessage) => {
                this.messageQueue.push(message);
                this.emit($data);
            });
        }
    }

    public async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        try {
            await new Promise<null>((r, e) => {
                this.port?.once('messageerror', e);
                this.port?.postMessage(chunk);
                this.port?.removeListener('messageerror', e);
                r(null);
            });
            callback();
        }
        catch (err) {
            callback(err instanceof Error ? err : undefined);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _read(size: number): void {
        try {
            if (this.messageQueue.length) {
                while (this.messageQueue.length) {
                    const message = this.messageQueue.shift();
                    if (!this.push(message)) {
                        break;
                    }
                }
            }
            else {
                this.once($data, () => {
                    while (this.messageQueue.length) {
                        const message = this.messageQueue.shift();
                        if (!this.push(message)) {
                            break;
                        }
                    }
                });
            }
        }
        catch (err) {
            this.destroy(err instanceof Error ? err : undefined);
        }
    }
}

export function createPortStream(port?: worker_threads.MessagePort | worker_threads.Worker, options?: stream.DuplexOptions): PortStream {
    return new PortStream(port, options);
}