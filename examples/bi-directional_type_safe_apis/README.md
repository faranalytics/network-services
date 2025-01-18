# _Use Network-Services to Create Bi-directional Type-safe APIs._

## Introduction

In this example you will use Network-Services in order to create two Service Apps connected by a Socket. Communication between the two Service Apps will be bi-directional. Their APIs will be type safe and support code completion, parameter types, and return types.

## Implement the example

In this hypothetical example you will create two Service Apps, a `DataStore` and a `DataProvider`, that call each other's methods over a `net.Socket`. The `DataProvider` will add data to the `DataStore` using the `DataStore.addData` method. When the `DataStore` reaches a limit it will call the `DataProvider.stop` method in order to stop it from adding more data to the store. The `DataProvider` will then call the `DataStore.getData` method in order to get the stored data that it sent to the `DataStore` and log it to the console.

### Implement the `index.ts` module

#### Import the `node:net` module, `Async` type, and the `createService` helper functions.

```ts
import * as tls from "node:tls";
import * as fs from "node:fs";
import { Async, createService } from "network-services";
```

#### Define a `DataStore` and its interface.

```ts
interface IDataStore {
  addData: (...args: Array<number>) => Promise<void>;
  getData: () => Array<number>;
}

class DataStore implements IDataStore {
  private data: Array<number> = [];
  private provider: Async<IDataProvider>;
  private storageLimit: number = 10;

  constructor(provider: Async<IDataProvider>) {
    // The `provider` object type is a transformed Async analog of IDataProvider.
    this.provider = provider;
  }

  async addData(...args: Array<number>): Promise<void> {
    if (this.data.length < this.storageLimit) {
      this.data = this.data.concat(args);
    } else {
      await this.provider.stop(); // The type safe `provider` object type supports code completion.
    }
  }

  getData(): Array<number> {
    return this.data;
  }

  throwError() {
    throw new Error("Something wonderful happened.");
  }
}
```

#### Create a `net.Server` and use its `net.Socket` to create a Service.

Use the Service in order to create a `DataProvider` Service API and a `DataStore` Service App.

```ts
const server = net.createServer().listen({ port: 3000, host: "127.0.0.1" });
server.on("connection", (socket: net.Socket) => {
  socket.on("error", console.error);
  const service = createService(socket);
  const provider = service.createServiceAPI<IDataProvider>();
  const store = new DataStore(provider);
  service.createServiceApp<IDataStore>(store, {
    paths: ["addData", "getData"],
  });
});
```

#### Define a `DataProvider` and its interface.

```ts
interface IDataProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
}

class DataProvider implements IDataProvider {
  public store: Async<IDataStore>;
  public continue: boolean = true;

  constructor(store: Async<IDataStore>) {
    // The `store` object is a transformed Async analog of IDataStore.
    this.store = store;
  }

  async start() {
    let n = 0;
    while (this.continue) {
      await this.store.addData(n++); // The type safe `store` object type supports code completion.
    }
  }

  async stop() {
    if (this.continue) {
      this.continue = false;
      const data = await this.store.getData(); // The type safe `store` object type supports code completion.
      console.log(data);
    }
  }
}
```

#### Create a `net.Socket` and use it to create a Service.

Use Service in order to create a `DataStore` Service API and a `DataProvider` Service App and start the `DataProvider`.

```ts
const socket = net.connect({ port: 3000, host: "127.0.0.1" });
socket.on("ready", async () => {
  try {
    const service = createService(socket);
    const store = service.createServiceAPI<IDataStore>();
    const provider = new DataProvider(store);
    service.createServiceApp(provider);
    await provider.start();
  } catch (err) {
    console.error(err);
  }
});
```

## Run the example

### Requirements

- The `net.Server` will attempt to bind to `localhost:3000`.

### How to run the example

#### Clone the Network-Services repo.

```bash
git clone https://github.com/faranalytics/network-services.git
```

#### Change directory into the relevant example directory.

```bash
cd network-services/examples/bi-directional_type_safe_apis
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

This is the array that was stored in the DataStore.

```bash
[
  0, 1, 2, 3, 4,
  5, 6, 7, 8, 9
]
```
