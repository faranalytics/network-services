import {parentPort} from "node:worker_threads";
import { createPortStream, createService } from 'network-services';
import { UnitB } from './unit_b.js';
import { UnitA } from './unit_a.js';

const portStream = createPortStream();
const service = createService(portStream);
const unitA = service.createServiceAPI<UnitA>();
const unitB = new UnitB(unitA, service);
service.createServiceApp(unitB);
parentPort?.postMessage('ready');