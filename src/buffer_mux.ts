/* eslint-disable no-empty */

import * as stream from 'stream';
import { CallMessage, CallMessageList, ResultMessage, ResultMessageList } from "./messages";
import { QueueSizeLimitError, NotImplementedError } from './errors';
import { Mux, MuxOptions } from './mux';

export class BufferMux extends Mux {
    public ingressQueue?: Buffer;
    public egressQueue?: Buffer;

    constructor(stream: stream.Duplex, options?: MuxOptions) {
        super(stream, options);

        this.ingressQueue = Buffer.allocUnsafe(0);
        this.egressQueue = Buffer.allocUnsafe(0);

        if (stream.listenerCount('error') === 0) {
            stream.on('error', console.error);
        }

        this.stream.once('close', () => {
            delete this.ingressQueue;
            delete this.egressQueue;
        });

        this.stream.on('data', this.demux.bind(this));
    }

    public mux(message: CallMessage | ResultMessage) {
        if (this.egressQueue) {
            const data = this.serializeMessage(message);
            const size = Buffer.alloc(6, 0);
            size.writeUIntBE(data.length + 6, 0, 6);
            const buf = Buffer.concat([size, data]);

            this.egressQueue = Buffer.concat([this.egressQueue, buf]);

            if (this.egressQueueSizeLimit && this.egressQueue.length > this.egressQueueSizeLimit) {
                const error = new QueueSizeLimitError(`The egress buffer exeeded ${this.egressQueueSizeLimit.toLocaleString()} bytes.`);
                this.stream.destroy(error);
                throw error;
            }

            if (!this.stream.writableNeedDrain) {
                this.writeBufferToStream();
            }
        }
    }

    protected writeBufferToStream() {
        try {
            if (this.egressQueue?.length != 0) {
                if (!this.stream.write(this.egressQueue)) {
                    this.stream.once('drain', this.writeBufferToStream.bind(this));
                }
                this.egressQueue = Buffer.allocUnsafe(0);
            }
        }
        catch (err) {
            this.stream.destroy(err instanceof Error ? err : undefined);
        }
    }

    public demux(chunk: Buffer | string) {
        try {
            if (this.ingressQueue && chunk.length !== 0) {

                if (!Buffer.isBuffer(chunk)) {
                    chunk = Buffer.from(chunk, 'utf-8');
                }

                this.ingressQueue = Buffer.concat([this.ingressQueue, chunk]);

                if (this.ingressQueueSizeLimit && this.ingressQueue.length > this.ingressQueueSizeLimit) {
                    throw new QueueSizeLimitError(`The ingress buffer exeeded ${this.ingressQueueSizeLimit.toLocaleString()} bytes.`);
                }

                let messageSize = this.ingressQueue.readUintBE(0, 6);

                while (this.ingressQueue.length >= messageSize) {
                    const buf = this.ingressQueue.subarray(6, messageSize);
                    this.ingressQueue = this.ingressQueue.subarray(messageSize, this.ingressQueue.length);
                    const message = this.deserializeMessage(buf);

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

                    if (this.ingressQueue.length > 6) {
                        messageSize = this.ingressQueue.readUintBE(0, 6);
                    }
                    else {
                        break;
                    }
                }
            }
        }
        catch (err) {
            this.stream.destroy(err instanceof Error ? err : undefined);
        }
    }

    protected serializeMessage(message: ResultMessage | CallMessage): Buffer {
        if (message instanceof ResultMessage) {
            return Buffer.from(JSON.stringify([message.type, message.id, message.data]), 'utf-8');
        }
        else if (message instanceof CallMessage) {
            return Buffer.from(JSON.stringify([message.type, message.id, message.props, message.args]), 'utf-8');
        }
        else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new NotImplementedError(`The message type is not implemented.`);
        }
    }

    protected deserializeMessage(data: Buffer): ResultMessage | CallMessage {
        const message = <ResultMessageList | CallMessageList>JSON.parse(data.toString('utf-8'));
        const type = message[0];
        if (type == 0) {
            return new CallMessage({ type, id: message[1], props: message[2], args: message[3] });
        }
        else if (type == 1 || type == 2) {
            return new ResultMessage({ type, id: message[1], data: message[2] });
        }
        else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new NotImplementedError(`The message type ${type} is not implemented.`);
        }
    }
}