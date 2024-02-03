/* eslint-disable @typescript-eslint/no-misused-promises */
import * as net from "node:net";
import { createService } from 'network-services';

class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        return `Hello, ${kind} world!`;
    }
}

const greeter = new Greeter(); // Create an instance of the Greeter Application.
const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' }); // Listen for incoming connections.
server.on('connection', (socket: net.Socket) => {
    socket.on('error', console.error);
    const service = createService(socket); // Create an instance of a Service.
    service.createServiceApp(greeter); // Create a Service App using the Greeter and connect it to the network.
});

const socket = net.connect({ port: 3000, host: '127.0.0.1' }); // Connect to the `net.Server`.
socket.on('error', console.error);
socket.on('ready', async () => {
    const service = createService(socket); // Create an instance of a Service.
    const greeter = service.createServiceAPI<Greeter>(); // Create a Service API of type Greeter.
    const greeting = await greeter.greet('happy'); // The `greeter` object supports code completion.
    console.log(greeting); // Hello, happy world!
});

