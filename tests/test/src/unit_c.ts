export interface IUnitC {
    undefinedMethod(data: string): string;
}

export class UnitC {

    echoString(data: string): string {
        return data;
    }
}