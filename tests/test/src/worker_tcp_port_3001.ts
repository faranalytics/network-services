import * as net from "node:net";
import { createService } from "network-services";
import { parentPort } from "node:worker_threads";
import { UnitC } from "./unit_c.js";

try {
    const server = net.createServer().listen({ port: 3001, host: '127.0.0.1' });
    server.on('connection', (socket: net.Socket) => {
        socket.on('error', console.error);
        const service = createService(socket, { egressQueueSizeLimit: 1e8, ingressQueueSizeLimit: 1e8 });
        const unitC = new UnitC();
        service.createServiceApp<UnitC>(unitC);
    });
    server.once('listening', () => parentPort?.postMessage('ready'));
}
catch (err) {
    console.error(err);
}

