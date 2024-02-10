import * as net from "node:net";
import * as crypto from "node:crypto";
import * as assert from "node:assert";
import * as worker_threads from "node:worker_threads";
import { createService } from "network-services";
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

const ITERATIONS = 1;

try {
    const unitBWoker = new worker_threads.Worker("./dist/unit_b.js");
    await new Promise((r) => unitBWoker.once('online', r));
    await new Promise((r) => unitBWoker.once('message', r));

    const unitcWoker = new worker_threads.Worker("./dist/unit_c.js");
    await new Promise((r) => unitcWoker.once('online', r));
    await new Promise((r) => unitcWoker.once('message', r));

    for (let i = 0; i < ITERATIONS; i++) {

        console.log(`Iteration: ${i}`);

        const socketUnitB = net.connect({ port: 3000, host: '127.0.0.1' });
        // socketUnitB.on('error', console.error);
        await new Promise((r) => socketUnitB.on('ready', r));
        const serviceUnitB = createService(socketUnitB, { egressQueueSizeLimit: 1e7, ingressQueueSizeLimit: 1e7 });
        const asyncUnitB = serviceUnitB.createServiceAPI<UnitB>();
        const unitA = new UnitA(asyncUnitB);
        serviceUnitB.createServiceApp<UnitA>(unitA, { paths: ['increment1', 'increment3', 'throwError'] });

        const chars1 = crypto.randomBytes(1e6).toString();
        const chars2 = crypto.randomBytes(1e6).toString();
        const chars3 = crypto.randomBytes(1e6).toString();

        console.log("assert.strictEqual(await asyncUnitB.echoString(chars1), chars1);");
        assert.strictEqual(await asyncUnitB.echoString(chars1), chars1);

        console.log("assert.strictEqual(await asyncUnitB.hasA.hasA_echoString(chars1), chars1);");
        assert.strictEqual(await asyncUnitB.hasA.hasA_echoString(chars1), chars1);

        console.log("assert.strictEqual(await asyncUnitB.isA_hasA.hasA_echoString(chars1), chars1);");
        assert.strictEqual(await asyncUnitB.isA_hasA.hasA_echoString(chars1), chars1);

        console.log("assert.strictEqual(JSON.stringify(await asyncUnitB.echoStrings(chars1, chars2)), JSON.stringify([chars1, chars2]));");
        assert.strictEqual(JSON.stringify(await asyncUnitB.echoStrings(chars1, chars2)), JSON.stringify([chars1, chars2]));

        const results = await Promise.all([asyncUnitB.echoString(chars1), asyncUnitB.echoString(chars2), asyncUnitB.echoString(chars3)]);
        console.log("assert.strictEqual(JSON.stringify(results), JSON.stringify([chars1, chars2, chars3]));");
        assert.strictEqual(JSON.stringify(results), JSON.stringify([chars1, chars2, chars3]));

        console.log("assert.strictEqual(await unitA.increment1(0), 3);");
        assert.strictEqual(await unitA.increment1(0), 3);

        console.log("assert.rejects(asyncUnitB.throwError('Error'), { name: 'NotImplementedError' });");
        await assert.rejects(asyncUnitB.throwError('Error'), { name: 'NotImplementedError' });

        console.log("assert.rejects(asyncUnitB.callError('Error'), { name: 'NotImplementedError' });");
        await assert.rejects(asyncUnitB.callError('Error'), { name: 'NotImplementedError' });

        console.log("assert.rejects(asyncUnitB.hasA.hasA_throwError('Error'), { name: 'Error' });");
        await assert.rejects(asyncUnitB.hasA.hasA_throwError('Error'), { name: 'Error' });

        const chars4 = '0'.repeat(1e7);
        console.log("assert.rejects(asyncUnitB.echoString(chars4), { name: 'QueueSizeLimitError' });");
        await assert.rejects(asyncUnitB.echoString(chars4), { name: 'QueueSizeLimitError' });

        const socketUnitC = net.connect({ port: 3001, host: '127.0.0.1' });
        socketUnitC.on('error', console.error);
        await new Promise((r) => socketUnitC.on('ready', r));
        const service = createService(socketUnitC, { egressQueueSizeLimit: 1e7, ingressQueueSizeLimit: 1e7 });
        const asyncUnitC = service.createServiceAPI<IUnitC>();

        console.log("assert.rejects(asyncUnitC.undefinedMethod('test'), { name: 'TypeError' });");
        await assert.rejects(asyncUnitC.undefinedMethod('test'), { name: 'TypeError' });

        console.log('memoryUsage', memoryUsage());
    }
}
catch (err) {
    console.error(err);
}
finally {
    console.log('finally', memoryUsage());
    console.log('summary', statistics());
}