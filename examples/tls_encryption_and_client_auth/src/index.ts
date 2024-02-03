import * as tls from "node:tls";
import * as fs from "node:fs";
import { Async, createService } from 'network-services';

interface IServiceA {
    setSecret: (secret: number) => void;
}

class ServiceA implements IServiceA {

    private serviceB: Async<IServiceB>;
    private secret: number;

    constructor(serviceB: Async<IServiceB>, secret:number) {
        this.serviceB = serviceB;
        this.secret = secret;
        this.serviceB.setSecret(secret).catch(console.error);
    }

    public setSecret(secret: number): void {
        this.secret = secret;
        console.log(this.secret);
    }
}

const server = tls.createServer({
    key: fs.readFileSync('./secrets/serviceA_key.pem'),
    cert: fs.readFileSync('./secrets/serviceA_cert.pem'),
    ca: [fs.readFileSync('./secrets/serviceB_cert.pem')],
    requestCert: true
}).listen({ port: 3000, host: 'localhost' });

server.on('secureConnection', (socket: tls.TLSSocket) => {
    socket.on('error', console.error);
    const service = createService(socket);
    const serviceB = service.createServiceAPI<IServiceB>();
    const serviceA = new ServiceA(serviceB, 23);
    service.createServiceApp<IServiceA>(serviceA, { paths: ['setSecret'] });
});

interface IServiceB {
    setSecret(secret: number): void;
}

class ServiceB implements IServiceB {

    private serviceA: Async<IServiceA>;
    private secret: number;

    constructor(serviceA: Async<IServiceA>, secret: number) {
        this.serviceA = serviceA;
        this.secret = secret;
        this.serviceA.setSecret(this.secret).catch(console.error);
    }

    public setSecret(secret:number): void {
        this.secret = secret;
        console.log(this.secret);
    }
}

const socket = tls.connect({
    port: 3000,
    host: 'localhost',
    key: fs.readFileSync('./secrets/serviceB_key.pem'),
    cert: fs.readFileSync('./secrets/serviceB_cert.pem'),
    ca: [fs.readFileSync('./secrets/serviceA_cert.pem')]
});
socket.on('error', console.error);
socket.on('ready', () => {
    try {
        const service = createService(socket);
        const serviceA = service.createServiceAPI<IServiceA>();
        const serviceB = new ServiceB(serviceA, 42);
        service.createServiceApp<IServiceB>(serviceB, { paths: ['setSecret'] });
    }
    catch (err) {
        console.error(err);
    }
});
