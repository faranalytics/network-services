import * as stream from 'stream';
import { ServiceApp, ServiceAppOptions } from './service_app';
import { ServiceAPI, ServiceAPIOptions } from './service_api';
import { InstantiationError, NotImplementedError } from './errors';
import { Async, Callable } from './types';
import { BufferMux } from './buffer_mux';
import { ObjectMux } from './object_mux';
import { Mux, MuxConstructor, MuxOptions } from './mux';

export interface ServiceOptions {
    muxClass?: MuxConstructor;
}

export class Service {

    public static streams: WeakSet<stream.Duplex> = new WeakSet();
    public mux: Mux;
    public serviceAPI?: ServiceAPI;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public serviceApp?: ServiceApp<any>;

    constructor(stream: stream.Duplex, options?: ServiceOptions & MuxOptions) {
        if (Service.streams.has(stream)) {
            throw new InstantiationError(`The stream.Duplex instance has already been associated with a Service.`);
        }
        else {
            Service.streams.add(stream);
        }

        if (options?.muxClass) {
            this.mux = new options.muxClass(stream, options);
        }
        if (stream.writableObjectMode) {
            this.mux = new ObjectMux(stream, options);
        }
        else {
            this.mux = new BufferMux(stream, options);
        }
    }

    public createServiceApp<T extends object>(app: T, options?: ServiceAppOptions<T>): ServiceApp<T> {
        if (!this.serviceApp) {
            const serviceApp = this.serviceApp = new ServiceApp<T>(app, this.mux, options);
            return serviceApp;
        }
        else {
            throw new InstantiationError(`A ServiceApp instance has already been instantiated for this Service.`);
        }
    }

    public createServiceAPI<T extends object>(options?: ServiceAPIOptions): Async<T> {
        if (!this.serviceAPI) {
            const serviceAPI = this.serviceAPI = new ServiceAPI(this.mux, options);
            let props: Array<string> = [];
            const handler = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                get(target: any, property: string, receiver: any): Callable {
                    props.push(property);
                    return new Proxy<Callable>(() => { }, handler);
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                set(target: any, property: string, value: any, receiver: any) {
                    props.push(property);
                    throw new NotImplementedError(`The \`set\` property is not implemented for the property named \`${props.join('.')}\`.`);
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                apply(target: any, thisArg: any, argumentsList: Array<unknown>): Promise<unknown> {
                    return serviceAPI.call(props, ...argumentsList);
                }
            };
            return <Async<T>>new Proxy({}, {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                get(target: any, property: string, receiver: any): Callable {
                    props = [];
                    props.push(property);
                    return new Proxy<Callable>(() => { }, handler);
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
                set(target: any, property: string, value: any, receiver: any) {
                    props.push(property);
                    throw new NotImplementedError(`The \`set\` property is not implemented for the property named \`${props.join('.')}\`.`);
                }
            });
        }
        else {
            throw new InstantiationError(`A ServiceAPI instance has already been instantiated for this Service.`);
        }
    }
}

export function createService(stream: stream.Duplex, options?: ServiceOptions & MuxOptions): Service {
    return new Service(stream, options);
}