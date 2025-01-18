# _Use Network-Services to Scale a "Hello, World!" Greeter Service Using a Service Pool._

## Introduction

In this example you will create two modules: A module named `service.ts` that will contain your scaled `Greeter` Service. A module named `index.ts` that will spawn 10 instances of the `service.ts` module using a Service Pool. You will create 10 connections to the remote Server and connect each `net.Socket` to the Service Pool. You will use the Service API to call the `greeter.greet` method over each connection. Each call will be handled round-robin by the Service in each Worker thread.

## Implementation

### Instructions

#### Create an `index.ts` module and import the required dependencies.

```ts
import * as net from "node:net";
import { createService, createServicePool } from "network-services";
import { Greeter } from "./service.js"; // Import the `Greeter` type from the scaled module.
```

#### Create a pool of 10 instances of the scaled module `service.js` and wait for the Workers to come online.

```ts
const servicePool = createServicePool({
  // Create a Service Pool consisting of 10 instances of the `service.js` module.
  workerCount: 10,
  workerURL: "./dist/service.js",
});

await new Promise((r) => servicePool.on("ready", r)); // Wait for the pool to become ready.
```

#### Create a Server that will connect incoming Sockets to the Service Pool.

```ts
const server = net.createServer().listen({ port: 3000, host: "127.0.0.1" });
server.on("connection", (socket: net.Socket) => {
  // Connect each incomming connection to the Service Pool.
  socket.on("error", console.error);
  servicePool.connect(socket);
});
```

#### Create 10 connections to the Server, and on each iteration, create a Service API, call its `greeter.greet` method, and log the result to the console.

```ts
for (let i = 0; i < 10; i++) {
  // Connect to the remote Service 10 times and call and log the result of the `greeter.greet` method.
  const socket = net.connect({ port: 3000, host: "127.0.0.1" });
  socket.on("error", console.error);
  socket.on("ready", async () => {
    const service = createService(socket);
    const greeter = service.createServiceAPI<Greeter>();
    console.time(`Iteration ${i}`);
    const greeting = await greeter.greet("happy");
    console.log(greeting);
    console.timeEnd(`Iteration ${i}`);
  });
}
```

#### Create the scaled `service.ts` module and import the required dependencies.

```ts
import { createPortStream, createService } from "network-services";
```

Create an instance of a `Greeter`.

```ts
export class Greeter {
  greet(kind: string) {
    for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
    return `Hello, ${kind} world! from thread ${threadId}.`;
  }
}
const greeter = new Greeter(); // Create an instance of the Greeter.
```

#### Create a `PortStream` and create a Service App using the `Greeter`.

```ts
const portStream = createPortStream(); // Create a PortStream that will wrap the `parentThread` MessagePort in a stream.Duplex.
const service = createService(portStream); // Create a Service.
service.createServiceApp(greeter); // Create a Service App.
```

## Run the Example

### Requirements

Please make sure your firewall is configured to allow connections on `127.0.0.1:3000` for this example to work.

### Instructions

#### Clone the Network-Services repo.

```bash
git clone https://github.com/faranalytics/network-services.git
```

#### Change directory into the relevant example directory.

```bash
cd network-services/examples/scalable_hello_world
```

#### Install the example dependencies.

```bash
npm install && npm update
```

#### Build the application.

```bash
npm run clean:build
```

#### Run the application.

```bash
npm start
```

##### Output

```bash
Hello, happy world! from thread 3.
Iteration 2: 109.488ms
Hello, happy world! from thread 2.
Iteration 1: 110.72ms
Hello, happy world! from thread 1.
Iteration 0: 113.176ms
Hello, happy world! from thread 7.
Iteration 6: 111.972ms
Hello, happy world! from thread 4.
Iteration 3: 113.045ms
Hello, happy world! from thread 5.
Iteration 4: 113.361ms
Hello, happy world! from thread 8.
Iteration 7: 113.815ms
Hello, happy world! from thread 10.
Iteration 9: 113.665ms
Hello, happy world! from thread 9.
Iteration 8: 151.919ms
Hello, happy world! from thread 6.
Iteration 5: 159.103ms
```
