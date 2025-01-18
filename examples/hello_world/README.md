# _An Instance of "Hello, World!"_

## Introduction

In this example you will use Network-Services in order to create a "Hello, World!" `Greeter` Service App and call its `greeter.greet` method and log the returned greeting.

## Implementation

### Instructions

#### Import the `node:net` module and the `createService` helper functions.

```ts
import * as net from "node:net";
import { createService } from "network-services";
```

#### Create a `Greeter` Service.

```ts
class Greeter {
  // Create a friendly Greeter Application.
  greet(kind: string) {
    return `Hello, ${kind} world!`;
  }
}

const greeter = new Greeter(); // Create an instance of the Greeter Application.
```

#### Create a `net.Server` and create a `Greeter` Service App that is connected to the `net.Socket`.

```ts
const server = net.createServer().listen({ port: 3000, host: "127.0.0.1" }); // Listen for incoming connections.
server.on("connection", (socket: net.Socket) => {
  socket.on("error", console.error);
  const service = createService(socket); // Create an instance of a Service.
  service.createServiceApp(greeter); // Create a Service App using a Greeter and connect it to the network.
});
```

#### Connect to the Server and use the `net.Socket` in order to create a Service.

Use the Service in order to create a Service API of type `Greeter`. Use the `greeter` Service API in order to call the Service App's methods and log the greeting.

```ts
const socket = net.connect({ port: 3000, host: "127.0.0.1" }); // Connect to the `net.Server`.
socket.on("error", console.error);
socket.on("ready", async () => {
  const service = createService(socket); // Create an instance of a Service.
  const greeter = service.createServiceAPI<Greeter>(); // Create a Service API of type Greeter.
  const greeting = await greeter.greet("happy"); // The `greeter` object supports code completion.
  console.log(greeting); // Hello, happy world!
});
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
cd network-services/examples/hello_world
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
Hello, happy world!
```
