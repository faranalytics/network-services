import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { CallMessage, ResultMessage } from "./messages";

const $data = Symbol('data');

export class PortStream extends stream.Duplex {
    public port?: threads.MessagePort;
    public messageQueue: Array<CallMessage | ResultMessage>;

    constructor(options?: stream.DuplexOptions) {
        super({ ...options, ...{ objectMode: true } });
        this.messageQueue  = [];
        if (threads.parentPort) {
            this.port = threads.parentPort;
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
}

export function createPortStream(options?: stream.DuplexOptions) : PortStream {
    return new PortStream(options);
}