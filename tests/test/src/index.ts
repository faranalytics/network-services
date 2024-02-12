import { after, describe, test } from 'node:test';
import * as net from "node:net";
import * as crypto from "node:crypto";
import * as assert from "node:assert";
import * as worker_threads from "node:worker_threads";
import { createService, createPortStream } from "network-services";
import { UnitA } from "./unit_a.js";
import { IUnitB } from "./unit_b.js";

const ingressQueueSizeLimit = 1e7;
const egressQueueSizeLimit = 1e7;

try {
    // Create materials to be used in tests.
    const chars1 = crypto.randomBytes(1e6).toString();
    const chars2 = crypto.randomBytes(1e6).toString();
    const chars3 = crypto.randomBytes(1e6).toString();
    const chars4 = '0'.repeat(egressQueueSizeLimit);

    await describe('Test variations of uni-directional and bi-directional methods calls.', async () => {
        const worker = new worker_threads.Worker("./dist/worker_tcp_port_3000.js");
        await new Promise((r) => worker.once('online', r));
        await new Promise((r) => worker.once('message', r));

        const socket = net.connect({ port: 3000, host: '127.0.0.1' });
        // socket.on('error', console.error);
        await new Promise((r) => socket.on('ready', r));
        const service = createService(socket, { egressQueueSizeLimit, ingressQueueSizeLimit });
        const unitB = service.createServiceAPI<IUnitB>();
        const unitA = new UnitA(unitB);
        service.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

        after(() => worker.terminate().catch(console.error));

        await test('Call a method that echos a string.', async () => {
            assert.strictEqual(await unitB.echoString(chars1), chars1);
        });

        await test('Call a nested method and echo a string.', async () => {
            assert.strictEqual(await unitB.hasA.hasA_echoString(chars1), chars1);
        });

        await test('Call a nested method that is defined in the super class and echo a string.', async () => {
            assert.strictEqual(await unitB.isA_hasA.hasA_echoString(chars1), chars1);
        });

        await test('Call a method that echos multiple arguments as an array of the arguments.', async () => {
            assert.strictEqual(JSON.stringify(await unitB.echoStrings(chars1, chars2)), JSON.stringify([chars1, chars2]));
        });

        await test('Call echoString multiple times synchronously and asynchronously await their results.', async () => {
            const results = await Promise.all([unitB.echoString(chars1), unitB.echoString(chars2), unitB.echoString(chars3)]);
            assert.strictEqual(JSON.stringify(results), JSON.stringify([chars1, chars2, chars3]));
        });

        await test('Call a method that bi-directionally calls another method.', async () => {
            assert.strictEqual(await unitA.increment1(0), 3);
        });

        await test('Call a method that throws an error.', async () => {
            await assert.rejects(unitB.throwError('Error'), { name: 'NotImplementedError' });
        });

        await test('Call a method that bi-directionally calls another method that throws an Error.', async () => {
            await assert.rejects(unitB.callError('Error'), { name: 'NotImplementedError' });
        });

        await test('Call a nested method that throws an Error.', async () => {
            await assert.rejects(unitB.hasA.hasA_throwError('Error'), { name: 'Error' });
        });

        await describe('Test subversive method calls.', async () => {

            await test('Call a method that is not a defined property path.', async () => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                await assert.rejects(unitB.undefinedMethod(''), { name: 'PropertyPathError' });
                await unitB.deletePaths();
            });

            await test('Call an undefined method.', async () => {
                await assert.rejects(unitB.undefinedMethod(''), { name: 'TypeError' });
            });

            await test('Call a method on a function object.', async () => {
                const result = unitB.echoString.bind(null);
                if (result instanceof Promise) {
                    assert.strictEqual(await result, null);
                }
            });

            await test('Make a call that exceeds the queue size limit.', async () => {
                await assert.rejects(unitB.echoString(chars4), { name: 'QueueSizeLimitError' });
            });
        });
    });

    await describe('Test bi-directional calls over a stream.Duplex in object mode.', async () => {
        const worker = new worker_threads.Worker("./dist/worker_message_port.js");
        await new Promise((r) => worker.once('online', r));
        await new Promise((r) => worker.once('message', r));

        const stream = createPortStream(worker);
        const service = createService(stream);
        const unitB = service.createServiceAPI<IUnitB>();
        const unitA = new UnitA(unitB);
        service.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

        after(() => worker.terminate().catch(console.error));

        await test('Call a method that bi-directionally calls another method.', async () => {
            assert.strictEqual(await unitA.increment1(0), 3);
        });
    });
}
catch (err) {
    console.error(err);
}