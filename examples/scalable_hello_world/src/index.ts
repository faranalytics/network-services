/* eslint-disable @typescript-eslint/no-misused-promises */
import * as net from "node:net";
import { createService, createServicePool } from "network-services";
import { Greeter } from "./service.js"; // Import the `Greeter` type from the scaled module.

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

for (let i = 0; i < 10; i++) { // Connect to the remote Service 10 times and call and log the result of the `greeter.greet` method.
    const socket = net.connect({ port: 3000, host: '127.0.0.1' });
    socket.on('error', console.error);
    socket.on('ready', async () => {
        const service = createService(socket);
        const greeter = service.createServiceAPI<Greeter>();
        console.time(`Iteration ${i}`);
        const greeting = await greeter.greet('happy');
        console.log(greeting);
        console.timeEnd(`Iteration ${i}`);
    });
}


