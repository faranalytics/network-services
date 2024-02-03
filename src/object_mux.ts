import * as stream from 'stream';
import { CallMessage, ResultMessage } from "./messages";
import { QueueSizeLimitError, NotImplementedError } from './errors';
import { Mux, MuxOptions } from './mux';

export class ObjectMux extends Mux {
    public egressQueueSizeLimit?: number;
    public egressQueue?: Array<CallMessage | ResultMessage>;

    constructor(stream: stream.Duplex, options?: MuxOptions) {
        super(stream, options);
        this.egressQueue = [];
        this.egressQueueSizeLimit = options?.egressQueueSizeLimit;

        if (stream.listenerCount('error') === 0) {
            stream.on('error', console.error);
        }

        this.stream.once('close', () => {
            delete this.egressQueue;
        });

        this.stream.on('data', this.demux.bind(this));
    }

    public mux(message: CallMessage | ResultMessage) {
        if (this.egressQueue) {
            this.egressQueue.push(message);

            if (this.egressQueueSizeLimit && this.egressQueue.length > this.egressQueueSizeLimit) {
                const error = new QueueSizeLimitError(`The egress buffer exeeded ${this.egressQueueSizeLimit.toLocaleString()} bytes.`);
                this.stream.destroy(error);
                throw error;
            }

            if (!this.stream.writableNeedDrain) {
                this.writeObjectToStream();
            }
        }
    }

    protected writeObjectToStream() {
        try {
            while (this.egressQueue?.length) {
                if (!this.stream.write(this.egressQueue.shift())) {
                    this.stream.once('drain', this.writeObjectToStream.bind(this));
                    break;
                }
            }
        }
        catch (err) {
            this.stream.destroy(err instanceof Error ? err : undefined);
        }
    }

    public demux(message: CallMessage | ResultMessage) {
        try {
            if (message.type == 1 || message.type == 2) {
                this.emit('result', message);
            }
            else if (message.type === 0) {
                this.emit('call', message);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new NotImplementedError(`The message type ${message.type} is not implemented.`);
            }
        }
        catch (err) {
            this.stream.destroy(err instanceof Error ? err : undefined);
        }
    }
}