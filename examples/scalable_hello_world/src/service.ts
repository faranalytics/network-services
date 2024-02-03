import { createPortStream, createService } from 'network-services';
import { threadId } from 'worker_threads';

export class Greeter {
    greet(kind: string) {
        for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
        return `Hello, ${kind} world! from thread ${threadId}.`;
    }
}

const greeter = new Greeter(); // Create an instance of the Greeter.
const portStream = createPortStream(); // Create a PortStream that will wrap the `parentThread` MessagePort in a stream.Duplex. 
const service = createService(portStream); // Create a Service.
service.createServiceApp(greeter); // Create a Service App.