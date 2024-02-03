import * as stream from 'node:stream';
import * as events from 'node:events';
import { CallMessage, ResultMessage } from './messages';

export interface MuxConstructor {
    new(stream: stream.Duplex, options?: MuxOptions): Mux;
}

export interface MuxOptions {
    ingressQueueSizeLimit?: number;
    egressQueueSizeLimit?: number;
}

export abstract class Mux extends events.EventEmitter {
    public stream: stream.Duplex;
    public ingressQueueSizeLimit?: number;
    public egressQueueSizeLimit?: number;

    constructor(stream: stream.Duplex, options?: MuxOptions) {
        super();
        this.stream = stream;
        this.egressQueueSizeLimit = options?.egressQueueSizeLimit;
        this.ingressQueueSizeLimit = options?.ingressQueueSizeLimit;
    }

    abstract mux(message: CallMessage | ResultMessage): void;
    abstract demux(chunk: Buffer | string | object): void;
}