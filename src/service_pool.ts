import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import * as crypto from "node:crypto";
import * as events from "node:events";
import { CallMessage, ResultMessage } from "./messages";
import { Mux } from "./mux";
import { ObjectMux } from "./object_mux";
import { BufferMux } from "./buffer_mux";
import { NotImplementedError } from "./errors";

interface MuxMapOptions {
    mux: Mux;
    id: string;
}

class MuxMap {
    public mux: Mux;
    public id: string;
    constructor({ mux, id }: MuxMapOptions) {
        this.mux = mux;
        this.id = id;
    }
}

export interface ServicePoolOptions {
    workerCount: number;
    workerURL: string | URL;
    restartWorkerOnError?: boolean;
    workerOptions?: threads.WorkerOptions;
}

export class ServicePool extends events.EventEmitter {

    public workers: Array<threads.Worker>;
    public callRegistrar: Map<string, MuxMap>;
    public servicePoolOptions: ServicePoolOptions;

    constructor(servicePoolOptions: ServicePoolOptions, options?: { captureRejections: boolean }) {
        super(options);

        this.servicePoolOptions = servicePoolOptions;
        this.workers = [];
        this.callRegistrar = new Map<string, MuxMap>();
        this.servicePoolOptions.restartWorkerOnError = servicePoolOptions.restartWorkerOnError ?? false;

        const workers: Array<Promise<threads.Worker>> = [];
        for (let i = 0; i < servicePoolOptions.workerCount; i++) {
            workers.push(this.startWorker());
        }

        void (async () => {
            const values = await Promise.allSettled(workers);

            for (const value of values) {
                if (value.status == 'rejected') {
                    console.error(value.reason);
                }
            }

            this.emit('ready');
        })();
    }

    public connect(stream: stream.Duplex): void {

        let mux: Mux;

        if (stream.writableObjectMode) {
            mux = new ObjectMux(stream);
        }
        else {
            mux = new BufferMux(stream);
        }

        stream.on('close', () => {
            for (const [uuid, muxMap] of this.callRegistrar.entries()) {
                if (muxMap.mux === mux) {
                    mux.removeAllListeners();
                    this.callRegistrar.delete(uuid);
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        mux.on('call', this.onCallMessage.bind(this, mux));
    }

    protected async onCallMessage(mux: Mux, message: CallMessage): Promise<void> {
        try {
            const id = message.id;
            const uuid = crypto.randomUUID();
            const worker = this.workers.shift();
            if (worker) {
                this.workers.push(worker);
                await new Promise<null>((r, e) => {
                    if (worker) {
                        worker.once('messageerror', e);
                        message.id = uuid;
                        worker.postMessage(message);
                        worker.removeListener('messageerror', e);
                    }
                    r(null);
                });

                this.callRegistrar.set(uuid, new MuxMap({ mux, id }));
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    protected onResultMessage(message: ResultMessage) {
        try {
            if (message.type == 1 || message.type == 2) {
                const muxMap = this.callRegistrar.get(message.id);
                this.callRegistrar.delete(message.id);
                if (muxMap) {
                    const { mux, id } = muxMap;
                    message.id = id;
                    mux.mux(new ResultMessage(message));
                }
            }
            else {
                throw new NotImplementedError("A call from a Worker thread to an arbitrary remote Service is not implemented.");
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    protected async startWorker(): Promise<threads.Worker> {
        return new Promise<threads.Worker>((r, e) => {
            const worker = new threads.Worker(this.servicePoolOptions.workerURL, this.servicePoolOptions.workerOptions);
            worker.on('message', this.onResultMessage.bind(this));
            worker.once('error', e);
            worker.once('online', () => {
                worker.removeListener('error', e);
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                worker.once('exit', async () => {
                    this.workers.splice(this.workers.indexOf(worker), 1);
                    if (this.servicePoolOptions.restartWorkerOnError) {
                        const worker = await this.startWorker();
                        this.workers.push(worker);
                    }
                });
                r(worker);
            });
            this.workers.push(worker);
        });
    }
}

export function createServicePool(servicePoolOptions: ServicePoolOptions) {
    return new ServicePool(servicePoolOptions);
}