# *Use Network-Services to create an API with a nested method.*

As in the Hello World example, in this example you will use Network-Services in order to create a Hello World `Greeter` Service; however, this `Greeter` *is a* `TruthSayer` who *has a* `secret`.  You will drill into the `Greeter` object and call its `Greeter.secret.tell` method and log the returned secret.

## Implementation

### How to create a Hello World Greeter Service App with a nested method.

#### Import the `node:net` module and the `createService` helper functions.
```ts
import * as net from "node:net";
import { createService } from 'network-services';
```
#### Create a Greeter Service App that is a TruthSayer.
```ts
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
```
#### Create a Server and connect the `net.Socket` to the Greeter Service App.
```ts
const greeter = new Greeter();
const server = net.createServer().listen({ port: 3000, host: '127.0.0.1' });
server.on('connection', (socket: net.Socket) => {
    socket.on('error', console.error);
    const service = createService(socket);
    service.createServiceApp<Greeter>(greeter, { paths: ['greet', 'speak', 'secret.tell'] });
});
```
#### Connect to the Server and use the `net.Socket` in order to create a Service API of type `Greeter`.
##### Use the `greeter` Service API in order to call the Service App's methods and log the greeting and the secret.
```ts
const socket = net.connect({ port: 3000, host: '127.0.0.1' });
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
```
## Requirements
Please make sure your firewall is configured to allow connections on `127.0.0.1:3000` for this example to work.

## Instructions

Follow the instructions to run the example.

### Clone the Network-Services repo.
```bash
git clone https://github.com/faranalytics/network-services.git
```
### Change directory into the relevant example directory.
```bash
cd network-services/examples/nested_method
```
### Install the example dependencies.
```bash
npm install && npm update
```
### Build the application.
```bash
npm run clean:build
```
### Run the application.
```bash
npm start
```
#### Output
The `greeter.secret.tell` method returns `null` because `Infinity` is serialized to `null` in accordance with `JSON.stringify's` [serialization rules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description).
```bash
Hello, happy world!
42
null // Infinity?.. *cf.* https://en.wikipedia.org/wiki/Null
```