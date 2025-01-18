# _Use Network-Services with TLS Encryption and Client Certificate Authentication._

## Introduction

In this hypothetical example you will use Network-Services in order to create two Service Apps connected by a Socket that is secured using TLS Encryption and Client Certificate Authentication.

## Implement the example

You will create two Service Apps, `ServiceA` and `ServiceB`. Each Service App has a setter named `setSecret`. `ServiceA` will set a secret on `ServiceB` and `ServiceB` will set a secret on `ServiceA`. When a secret is set on an object it will be logged to the console.

### Implement `index.ts`

##### Import the `node:fs` and `node:tls` modules and `Async` Proxy type, and the `createService` helper functions.

```ts
import * as tls from "node:tls";
import * as fs from "node:fs";
import { Async, createService } from "network-services";
```

##### Define `ServiceA` and its interface.

```ts
interface IServiceA {
  setSecret: (secret: number) => void;
}

class ServiceA implements IServiceA {
  private serviceB: Async<IServiceB>;
  private secret: number;

  constructor(serviceB: Async<IServiceB>, secret: number) {
    this.serviceB = serviceB;
    this.secret = secret;
    this.serviceB.setSecret(secret).catch(console.error);
  }

  public setSecret(secret: number): void {
    this.secret = secret;
    console.log(this.secret);
  }
}
```

#### Create a Server and use its `net.Socket` to create a Service.

You will use the Service in order to create a `ServiceB` Service API instance and a `ServiceA` Service App instance.

```ts
const server = tls
  .createServer({
    key: fs.readFileSync("./secrets/serviceA_key.pem"),
    cert: fs.readFileSync("./secrets/serviceA_cert.pem"),
    ca: [fs.readFileSync("./secrets/serviceB_cert.pem")],
    requestCert: true,
  })
  .listen({ port: 3000, host: "localhost" });

server.on("secureConnection", (socket: tls.TLSSocket) => {
  socket.on("error", console.error);
  const service = createService(socket);
  const serviceB = service.createServiceAPI<IServiceB>();
  const serviceA = new ServiceA(serviceB, 23);
  service.createServiceApp<IServiceA>(serviceA, { paths: ["setSecret"] });
});
```

#### Define `ServiceB` and its interface.

```ts
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

  public setSecret(secret: number): void {
    this.secret = secret;
    console.log(this.secret);
  }
}
```

#### Create a `net.Socket` and use it to create a Service.

You will use the Service in order to create a `ServiceA` Service API instance and a `ServiceB` Service App instance.

```ts
const socket = tls.connect({
  port: 3000,
  host: "localhost",
  key: fs.readFileSync("./secrets/serviceB_key.pem"),
  cert: fs.readFileSync("./secrets/serviceB_cert.pem"),
  ca: [fs.readFileSync("./secrets/serviceA_cert.pem")],
});
socket.on("error", console.error);
socket.on("ready", () => {
  try {
    const service = createService(socket);
    const serviceA = service.createServiceAPI<IServiceA>();
    const serviceB = new ServiceB(serviceA, 42);
    service.createServiceApp<IServiceB>(serviceB, { paths: ["setSecret"] });
  } catch (err) {
    console.error(err);
  }
});
```

## Run the example

### Requirements

- The `tls.Server` will attempt to bind to `localhost:3000`.

### How to run the example

#### Clone the Network-Services repo.

```bash
git clone https://github.com/faranalytics/network-services.git
```

#### Change directory into the relevant example directory.

```bash
cd network-services/examples/tls_encryption_and_client_auth
```

#### Make a directory for keys.

```bash
mkdir secrets
```

#### Create a private key and certificate for the Service.

```bash
openssl genrsa -out ./secrets/serviceA_key.pem 2048
openssl req -new -x509 -key ./secrets/serviceA_key.pem -out ./secrets/serviceA_cert.pem
```

```bash
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:localhost
Email Address []:
```

#### Create a private key and certificate for the Client.

```bash
openssl genrsa -out ./secrets/serviceB_key.pem 2048
openssl req -new -x509 -key ./secrets/serviceB_key.pem -out ./secrets/serviceB_cert.pem
```

```bash
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:localhost
Email Address []:
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

#### Output

The Services shared and logged each other's secretes.

```bash
42
23
```
