import { test } from 'node:test';
import * as net from "node:net";
import * as crypto from "node:crypto";
import * as assert from "node:assert";
import * as worker_threads from "node:worker_threads";
import { createPortStream, createService } from "network-services";
import { UnitA } from "./unit_a.js";
import { UnitB } from "./unit_b.js";
import { IUnitC } from "./unit_c.js";

const aggregator: { [key: string]: Array<number> } = {};

function memoryUsage() {
    const memoryUsage = process.memoryUsage();
    const result: { [s: string]: string; } = {};
    gc?.();
    for (const [key, value] of Object.entries<number>(<{ [s: string]: number; }><unknown>memoryUsage)) {
        const mb = Math.round(value / (1024 * 1024));
        if (!Object.hasOwn(aggregator, key)) {
            aggregator[key] = [];
        }
        aggregator[key].push(mb);
        result[key] = `${mb}MB`;
    }
    return result;
}

function statistics() {
    const result: { [s: string]: string; } = {};
    for (const [key, value] of Object.entries(aggregator)) {
        const mean = Math.round(value.reduce((a, b) => a + b, 0) / value.length);
        const max = value.reduce((a, b) => a < b ? b : a, 0);
        const min = value.reduce((a, b) => a < b ? a : b, max);
        result[key] = `mean: ${mean}MB, min: ${min}MB, max: ${max}MB`;
    }
    return result;
}

console.log(memoryUsage());

const QUEUE_SIZE_LIMIT = 1e7;
const ITERATIONS = 1;

try {
    const unitBTCPWoker = new worker_threads.Worker("./dist/worker_tcp_port_3000.js");
    await new Promise((r) => unitBTCPWoker.once('online', r));
    await new Promise((r) => unitBTCPWoker.once('message', r));

    const unitBMessagePortWoker = new worker_threads.Worker("./dist/worker_message_port.js");
    await new Promise((r) => unitBMessagePortWoker.once('online', r));
    await new Promise((r) => unitBMessagePortWoker.once('message', r));

    const unitCWoker = new worker_threads.Worker("./dist/worker_tcp_port_3001.js");
    await new Promise((r) => unitCWoker.once('online', r));
    await new Promise((r) => unitCWoker.once('message', r));

    for (let i = 0; i < ITERATIONS; i++) {

        // Create materials to be used in tests.
        const chars1 = crypto.randomBytes(1e6).toString();
        const chars2 = crypto.randomBytes(1e6).toString();
        const chars3 = crypto.randomBytes(1e6).toString();
        const chars4 = '0'.repeat(QUEUE_SIZE_LIMIT);

        console.log(`Iteration: ${i}`);

        await test('Test variations of uni-directional and bi-directional methods calls.', async (t) => {
            const socket = net.connect({ port: 3000, host: '127.0.0.1' });
            // socketUnitB.on('error', console.error);
            await new Promise((r) => socket.on('ready', r));
            const service = createService(socket, { egressQueueSizeLimit: QUEUE_SIZE_LIMIT, ingressQueueSizeLimit: QUEUE_SIZE_LIMIT });
            const unitB = service.createServiceAPI<UnitB>();
            const unitA = new UnitA(unitB);
            service.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

            await t.test('Call a method that echos a string.', async () => {
                assert.strictEqual(await unitB.echoString(chars1), chars1);
            });

            await t.test('Call a nested method and echo a string.', async () => {
                assert.strictEqual(await unitB.hasA.hasA_echoString(chars1), chars1);
            });

            await t.test('Call a nested method that is defined in the super class and echo a string.', async () => {
                assert.strictEqual(await unitB.isA_hasA.hasA_echoString(chars1), chars1);
            });

            await t.test('Call a method that echos multiple arguments as an array of the arguments.', async () => {
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

            await test('Make a call that exceeds the QUEUE_SIZE_LIMIT', async () => {
                await assert.rejects(unitB.echoString(chars4), { name: 'QueueSizeLimitError' });
            });

            await t.test(JSON.stringify(memoryUsage()));
        });

        await test('Test subversive method calls.', async (t) => {
            const socket = net.connect({ port: 3001, host: '127.0.0.1' });
            socket.on('error', console.error);
            await new Promise((r) => socket.on('ready', r));
            const service = createService(socket, { egressQueueSizeLimit: QUEUE_SIZE_LIMIT, ingressQueueSizeLimit: QUEUE_SIZE_LIMIT });
            const unitC = service.createServiceAPI<IUnitC>();

            await t.test('Call an undefined method.', async () => {
                await assert.rejects(unitC.undefinedMethod(''), { name: 'TypeError' });
            });

            await t.test(JSON.stringify(memoryUsage()));
        });

        await test('Test calls over a stream.Duplex in object mode.', async (t) => {

            const messagePortUnitB = createPortStream(unitBMessagePortWoker);
            const messagePortUnitBService = createService(messagePortUnitB);
            const asyncMessagePortUnitB = messagePortUnitBService.createServiceAPI<UnitB>();
            const messagePortUnitA = new UnitA(asyncMessagePortUnitB);
            messagePortUnitBService.createServiceApp<UnitA>(messagePortUnitA, { paths: ['increment1', 'increment3', 'throwError'] });

            await t.test('Call an undefined method.', async () => {
                assert.strictEqual(await asyncMessagePortUnitB.echoString(chars1), chars1);
            });

            await t.test('Call a method that bi-directionally calls another method.', async () => {
                assert.strictEqual(await messagePortUnitA.increment1(0), 3);
            });

            await t.test(JSON.stringify(memoryUsage()));
        });
    }
}
catch (err) {
    console.error(err);
}
finally {
    // eslint-disable-next-line @typescript-eslint/require-await
    await test('Summary', async (t) => {
        await t.test(JSON.stringify(memoryUsage()));
        await t.test(JSON.stringify(statistics(),  null, " "));
    });
}

