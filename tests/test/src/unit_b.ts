import * as net from "node:net";
import { Async, createService } from "network-services";
import { UnitA } from "./unit_a.js";
import { parentPort } from "node:worker_threads";
import { NotImplementedError } from "network-services";

class HasA {

    hasA_echoString(data: string): string {
        return data;
    }

    hasA_throwError(message: string) {
        throw new Error(message);
    }
}

class IsA {

    public isA_hasA: HasA = new HasA();

    isA_echoString(data: string): string {
        return data;
    }

    isA_throwError(message: string) {
        throw new Error(message);
    }
}

export class UnitB extends IsA {
    public hasA: HasA = new HasA();
    private unitA: Async<UnitA>;
    constructor(UnitA: Async<UnitA>) {
        super();
        this.unitA = UnitA;
    }

    echoString(data: string): string {
        return data;
    }

    echoStrings(str1: string, str2: string) {
        return [str1, str2];
    }

    async callError(message: string) {
        await this.unitA.throwError(message);
    }

    throwError(message: string): void {
        throw new NotImplementedError(message);
    }

    doNotCall(data: string): string {
        return data;
    }

    async increment2(n: number): Promise<number> {
        return await this.unitA.increment3(++n);
    }
}

try {
    const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
    server.on('connection', (socket: net.Socket) => {
        socket.on('error', console.error);
        const service = createService(socket, { egressQueueSizeLimit: 1e8, ingressQueueSizeLimit: 1e8 });
        const unitA = service.createServiceAPI<UnitA>();
        const unitB = new UnitB(unitA);
        service.createServiceApp<UnitB>(unitB, {
            paths: ['echoString', 'echoStrings', 'callError', 'throwError', 'increment2', 'hasA.hasA_echoString', 'hasA.hasA_throwError', 'isA_hasA.hasA_echoString']
        });
    });
    server.once('listening', () => parentPort?.postMessage('ready'));
}
catch (err) {
    console.error(err);
}

