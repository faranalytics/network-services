/* eslint-disable @typescript-eslint/no-misused-promises */
import * as net from "node:net";
import { createService, createServicePool } from "network-services";
import { Greeter } from "./service.js"; // Import the `Greeter` type from the scaled module.

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

// memoryUsage();

const servicePool = createServicePool({ // Create a Service Pool consisting of 10 instances of the `service.js` module.
    workerCount: 10,
    workerURL: './dist/service.js'
});

await new Promise((r) => servicePool.on('ready', r)); // Wait for the pool to become ready.

const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
server.on('connection', (socket: net.Socket) => { // Connect each incomming connection to the Service Pool.
    socket.on('error', console.error);
    servicePool.connect(socket);
});

console.time(`test`);
const results: Array<Promise<string>> = [];
for (let i = 0; i < 100; i++) { // Connect to the remote Service 10 times and call and log the result of the `greeter.greet` method.
    const socket = net.connect({ port: 3000, host: '127.0.0.1' });
    socket.on('error', console.error);
    results.push(new Promise((r) => {
        socket.on('ready', () => {
            const service = createService(socket);
            const greeter = service.createServiceAPI<Greeter>();
            // console.time(`test ${i}`);
            const greeting = greeter.greet('happy');
            r(greeting);
            // console.log(greeting);
            // console.timeEnd(`test ${i}`);
        });
    }));
}

await Promise.all(results);

console.timeEnd(`test`);
