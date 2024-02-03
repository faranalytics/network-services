import * as threads from "node:worker_threads";
import { createService } from "network-services";
import {MessagePortStream, UnitA, UnitB} from "./index.js";

if (threads.parentPort) {
    const stream = new MessagePortStream(threads.parentPort);
    const service = createService(stream);
    const unitA = service.createServiceAPI<UnitA>();
    const unitB = new UnitB(unitA);
    service.createServiceApp<UnitB>(unitB, {
        paths: ['echoObject', 'increment2', 'level.echoObject', 'level.throwError']
    });
}
