import { after, describe, test } from 'node:test';
import { once } from "node:events";
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

    void describe('Test variations of uni-directional and bi-directional methods calls.', async () => {
        const worker = new worker_threads.Worker("./dist/worker_tcp_port_3000.js");
        await once(worker, 'online');
        await once(worker, 'message');

        const socket = net.connect({ port: 3000, host: '127.0.0.1' });
        // socket.on('error', console.error);
        await once(socket, 'ready');
        const service = createService(socket, { egressQueueSizeLimit, ingressQueueSizeLimit });
        const unitB = service.createServiceAPI<IUnitB>();
        const unitA = new UnitA(unitB);
        service.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

        after(() => worker.terminate().catch(console.error));

        void test('Call a method that echos a string.', async () => {
            assert.strictEqual(await unitB.echoString(chars1), chars1);
        });

        void test('Call a nested method and echo a string.', async () => {
            assert.strictEqual(await unitB.hasA.hasA_echoString(chars1), chars1);
        });

        void test('Call a nested method that is defined in the super class and echo a string.', async () => {
            assert.strictEqual(await unitB.isA_hasA.hasA_echoString(chars1), chars1);
        });

        void test('Call a method that echos multiple arguments as an array of the arguments.', async () => {
            assert.strictEqual(JSON.stringify(await unitB.echoStrings(chars1, chars2)), JSON.stringify([chars1, chars2]));
        });

        void test('Call echoString multiple times synchronously and asynchronously await their results.', async () => {
            const results = await Promise.all([unitB.echoString(chars1), unitB.echoString(chars2), unitB.echoString(chars3)]);
            assert.strictEqual(JSON.stringify(results), JSON.stringify([chars1, chars2, chars3]));
        });

        void test('Call a method that bi-directionally calls another method.', async () => {
            assert.strictEqual(await unitA.increment1(0), 3);
        });

        void test('Call a method that throws an error.', () => {
            void assert.rejects(unitB.throwError('Error'), { name: 'NotImplementedError' });
        });

        void test('Call a method that bi-directionally calls another method that throws an Error.', () => {
            void assert.rejects(unitB.callError('Error'), { name: 'NotImplementedError' });
        });

        void test('Call a nested method that throws an Error.', () => {
            void assert.rejects(unitB.hasA.hasA_throwError('Error'), { name: 'Error' });
        });

        void describe('Test subversive method calls.', () => {

            void test('Call a method that is not a defined property path.', async () => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
                void assert.rejects(unitB.undefinedMethod(''), { name: 'PropertyPathError' });
                await unitB.deletePaths();
            });

            void test('Call an undefined method.', () => {
                void assert.rejects(unitB.undefinedMethod(''), { name: 'TypeError' });
            });

            void test('Call a method on a function object.', async () => {
                const result = unitB.echoString.bind(null);
                if (result instanceof Promise) {
                    assert.strictEqual(await result, null);
                }
            });

            void test('Make a call that exceeds the queue size limit.', () => {
                void assert.rejects(unitB.echoString(chars4), { name: 'QueueSizeLimitError' });
            });
        });
    });

    void describe('Test bi-directional calls over a stream.Duplex in object mode.', async () => {
        const worker = new worker_threads.Worker("./dist/worker_message_port.js");
        await once(worker, 'online');
        await once(worker, 'message');

        const stream = createPortStream(worker);
        const service = createService(stream);
        const unitB = service.createServiceAPI<IUnitB>();
        const unitA = new UnitA(unitB);
        service.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

        after(() => worker.terminate().catch(console.error));

        void test('Call a method that bi-directionally calls another method.', async () => {
            assert.strictEqual(await unitA.increment1(0), 3);
        });
    });
}
catch (err) {
    console.error(err);
}