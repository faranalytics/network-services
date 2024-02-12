import * as net from "node:net";
import { createService } from "network-services";
import { UnitA } from "./unit_a.js";
import { parentPort } from "node:worker_threads";
import { UnitB } from "./unit_b.js";

try {
    const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
    server.on('connection', (socket: net.Socket) => {
        socket.on('error', console.error);
        const service = createService(socket, { egressQueueSizeLimit: 1e8, ingressQueueSizeLimit: 1e8 });
        const unitA = service.createServiceAPI<UnitA>();
        const unitB = new UnitB(unitA, service);
        service.createServiceApp<UnitB>(unitB, {
            paths: ['deletePaths', 'echoString', 'echoStrings', 'callError', 'throwError', 'increment2', 'hasA.hasA_echoString', 'hasA.hasA_throwError', 'isA_hasA.hasA_echoString']
        });
    });
    server.once('listening', () => parentPort?.postMessage('ready'));
}
catch (err) {
    console.error(err);
}

