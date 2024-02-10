import * as net from "node:net";
// import * as crypto from "node:crypto";
import * as assert from "node:assert";
import { Async, createService } from "network-services";

// const aggregator: { [key: string]: Array<number> } = {};

// function memoryUsage() {
//     gc?.();
//     for (const [key, value] of Object.entries<number>(<{ [key: string]: number }>(process.memoryUsage() as unknown))) {
//         const mb = Math.round(value / (1024 * 1024));
//         if (!Object.hasOwn(aggregator, key)) {
//             aggregator[key] = [];
//         }
//         aggregator[key].push(mb);
//         console.log(`${key}: ${mb}MB`);
//     }
// }

// function statistics() {
//     for (const [key, value] of Object.entries(aggregator)) {
//         const mean = Math.round(value.reduce((a, b) => a + b, 0) / value.length);
//         const max = value.reduce((a, b) => a < b ? b : a, 0);
//         const min = value.reduce((a, b) => a < b ? a : b, max);
//         console.log(`${key}: ${mean}MB, ${min}MB, ${max}MB`);
//     }
//     console.log('');
// }

class UnitBLevel {

    echoString(data: string): string {
        return data;
    }

    throwError(message: string) {
        throw new Error(message);
    }
}

class UnitB {
    public level: UnitBLevel = new UnitBLevel();
    private unitA: Async<UnitA>;
    constructor(UnitA: Async<UnitA>) {
        this.unitA = UnitA;
    }

    echoString(data: string): string {
        return data;
    }

    async increment2(n: number): Promise<number> {
        console.log('TEST');
        console.log('this.unitA', this.unitA);
        return await this.unitA.increment3(++n);
    }
}

class UnitA {
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

// memoryUsage();

(() => {
    const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
    server.on('connection', (socket: net.Socket) => {
        try {
            socket.on('error', console.error);
            const service = createService(socket, { egressQueueSizeLimit: 1e8, ingressQueueSizeLimit: 1e8 });
            const unitA = service.createServiceAPI<UnitA>();
            console.log('unitA', unitA);
            const unitB = new UnitB(unitA);
            service.createServiceApp<UnitB>(unitB, {
                paths: ['echoString', 'increment2', 'level.echoString', 'level.throwError']
            });
        }
        catch (err) {
            console.error(err);
        }
    });
})();

async function test(n: number) {
    return new Promise((r, e) => {
        const socket = net.connect({ port: 3000, host: '127.0.0.1' });
        socket.on('error', e);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        socket.on('ready', async () => {
            try {
                console.log('Start test ', n);
                const service = createService(socket, { egressQueueSizeLimit: 1e7, ingressQueueSizeLimit: 1e7 });
                const unitB = service.createServiceAPI<UnitB>();
                console.log('unitB', unitB);
                const unitA = new UnitA(unitB);
                service.createServiceApp<UnitA>(unitA, {
                    paths: ['echo', 'increment1', 'increment3']
                });

                // const chars = crypto.randomBytes(1e6).toString();
                // const result = await unitB.echoString(chars);
                // assert.equal(result, chars);
                // const results = await Promise.all([unitB.echoString(chars), unitB.echoString(chars), unitB.echoString(chars)]);
                // assert.equal(results[0], chars);
                // assert.equal(results[1], chars);
                // assert.equal(results[2], chars);
                // assert.equal(await unitB.echoString(chars), chars);
                // assert.equal(await unitB.level.echoString(chars), chars);
                assert.equal(await unitA.increment1(0), 3);

                try {
                    await unitA.callError('test');
                }
                catch (err) {
                    if (err instanceof Error) {
                        assert.equal(err.message, 'test');
                    }
                }
            }
            catch (err) {
                e(err);
            }
            finally {
                socket.destroy();
                // memoryUsage();
                console.log('Stop test ', n);
            }
        });
        socket.once('close', r);
    });
}

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
    // console.log('\nfinal');
    // memoryUsage();
    // console.log('');
    // statistics();
}