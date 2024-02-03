export interface CallMessageOptions {
    type: 0;
    id: string;
    props: Array<string>;
    args: Array<unknown>;
}

export class CallMessage {
    public type: 0;
    public id: string;
    public props: Array<string>;
    public args: Array<unknown>;

    constructor({ type, id, props, args }: CallMessageOptions) {
        this.type = type;
        this.id = id;
        this.props = props;
        this.args = args;
    }
}

export interface ResultMessageOptions {
    type: 1 | 2;
    id: string;
    data: unknown;
}

export class ResultMessage {
    public type: 1 | 2;
    public id: string;
    public data: unknown;

    constructor({ type, id, data }: ResultMessageOptions) {
        this.type = type;
        this.id = id;
        this.data = data;
    }
}

export type CallMessageList = [0, string, Array<string>, Array<unknown>];
export type ResultMessageList = [1 | 2, string, unknown];