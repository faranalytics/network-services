/* eslint-disable @typescript-eslint/no-misused-promises */
import * as net from "node:net";
import { createService } from 'network-services';

class Secret {
    private truth: number = Infinity;
    tell() {
        return this.truth;
    }
}

class TruthSayer {
    public secret: Secret = new Secret();
    speak(): number {
        return 42;
    }
}

class Greeter extends TruthSayer {
    greet(kind: string) {
        return `Hello, ${kind} world!`;
    }
}

const greeter = new Greeter();
const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
server.on('connection', (socket: net.Socket) => {
    socket.on('error', console.error);
    const service = createService(socket);
    service.createServiceApp<Greeter>(greeter, { paths: ['greet', 'speak', 'secret.tell'] });
});

const socket = net.connect({ port: 3000, host: '127.0.0.1' });
socket.on('error', console.error);
socket.on('ready', async () => {
    const service = createService(socket);
    const greeter = service.createServiceAPI<Greeter>();
    const greeting = await greeter.greet('happy'); // The `greeter` object supports code completion.
    console.log(greeting); // Hello, happy world!
    const spoken = await greeter.speak();
    console.log(spoken); // 42
    const truth = await greeter.secret.tell(); //  Call a nested method named `tell` in the `secret` object.
    console.log(truth); // null
});