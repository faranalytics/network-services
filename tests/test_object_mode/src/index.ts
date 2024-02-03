import * as assert from "node:assert";
import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { Async, CallMessage, ResultMessage, createService } from "network-services";

// createWorkerPool, createWorkerService
export class MessagePortStream extends stream.Duplex {
    static $data = Symbol('data');
    public port: threads.MessagePort | threads.Worker;
    public messageQueue: Array<CallMessage | ResultMessage> = [];
    constructor(port: threads.MessagePort | threads.Worker, options?: stream.DuplexOptions) {
        super({ ...options, ...{ objectMode: true } });
        this.port = port;
        this.port.on('message', (message: CallMessage | ResultMessage) => {
            this.messageQueue.push(message);
            this.emit(MessagePortStream.$data);
        });
    }

    async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        try {
            await new Promise<null>((r, e) => {
                this.port.once('messageerror', e);
                this.port.postMessage(chunk);
                this.port.removeListener('messageerror', e);
                r(null);
            });
            callback();
        }
        catch (err) {
            callback(err instanceof Error ? err : undefined);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _read(size: number): void {
        if (this.messageQueue.length) {
            while (this.messageQueue.length) {
                const message = this.messageQueue.shift();
                if (!this.push(message)) {
                    break;
                }
            }
        }
        else {
            this.once(MessagePortStream.$data, () => {
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

const aggregator: { [key: string]: Array<number> } = {};

function memoryUsage() {
    gc?.();
    for (const [key, value] of Object.entries<number>(<{ [key: string]: number }>(process.memoryUsage() as unknown))) {
        const mb = Math.round(value / (1024 * 1024));
        if (!Object.hasOwn(aggregator, key)) {
            aggregator[key] = [];
        }
        aggregator[key].push(mb);
        console.log(`${key}: ${mb}MB`);
    }
}

function statistics() {
    for (const [key, value] of Object.entries(aggregator)) {
        const mean = Math.round(value.reduce((a, b) => a + b, 0) / value.length);
        const max = value.reduce((a, b) => a < b ? b : a, 0);
        const min = value.reduce((a, b) => a < b ? a : b, max);
        console.log(`${key}: ${mean}MB, ${min}MB, ${max}MB`);
    }
    console.log('');
}

export class UnitBLevel {

    echoObject(data: object): object {
        return data;
    }

    throwError(message: string) {
        throw new Error(message);
    }
}

export class UnitB {
    public level: UnitBLevel = new UnitBLevel();
    private unitA: Async<UnitA>;
    constructor(UnitA: Async<UnitA>) {
        this.unitA = UnitA;
    }

    echoObject(data: object): object {
        return data;
    }

    async increment2(n: number): Promise<number> {
        return await this.unitA.increment3(++n);
    }
}

export class UnitA {
    private unitB: Async<UnitB>;
    constructor(unitB: Async<UnitB>) {
        this.unitB = unitB;
    }

    echo(data: string): string {
        return data;
    }

    async increment1(n: number): Promise<number> {
        return await this.unitB.increment2(++n);
    }

    increment3(n: number): number {
        return ++n;
    }

    async callError(message: string) {
        await this.unitB.level.throwError(message);
    }
}

memoryUsage();

async function test(n: number) {
    return new Promise((r, e) => {
        void (async () => {
            try {
                console.log('Start test ', n);
                const worker = new threads.Worker("./dist/worker_thread.js");
                const stream = new MessagePortStream(worker);
                const service = createService(stream);
                const unitB = service.createServiceAPI<UnitB>();
                const unitA = new UnitA(unitB);
                service.createServiceApp<UnitA>(unitA, {
                    paths: ['echo', 'increment1', 'increment3']
                });

                const obj = { 'test': 123 };
                const result = await unitB.echoObject(obj);
                console.log(result);
                try {
                    await unitA.callError('test');
                }
                catch (err) {
                    if (err instanceof Error) {
                        assert.equal(err.message, 'test');
                        console.log(err);
                    }
                }
            }
            catch (err) {
                e(err);
            }
            finally {
                memoryUsage();
                console.log('Stop test ', n);
                r(null);
            }
        })();
    });
}

if (threads.isMainThread) {
    try {
        console.time('test');

        const ITERATIONS = 1;

        for (let i = 0; i < 1; i++) {
            const tests = [];
            for (let i = 1; i <= ITERATIONS; i++) {
                tests.push(test(i));
            }
            await Promise.all(tests);
        }
        console.timeEnd('test');
    }
    catch (err) {
        console.error(err);
    }
    finally {
        console.log('\nfinal');
        memoryUsage();
        console.log('');
        statistics();
    }
}
