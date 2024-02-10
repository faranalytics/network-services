import { Async } from "network-services";
import { UnitA } from "./unit_a.js";
import { NotImplementedError } from "network-services";

class HasA {

    hasA_echoString(data: string): string {
        return data;
    }

    hasA_throwError(message: string) {
        throw new Error(message);
    }
}

class IsA {

    public isA_hasA: HasA = new HasA();

    isA_echoString(data: string): string {
        return data;
    }

    isA_throwError(message: string) {
        throw new Error(message);
    }
}

export class UnitB extends IsA {
    public hasA: HasA = new HasA();
    private unitA: Async<UnitA>;
    constructor(UnitA: Async<UnitA>) {
        super();
        this.unitA = UnitA;
    }

    echoString(data: string): string {
        return data;
    }

    echoStrings(str1: string, str2: string) {
        return [str1, str2];
    }

    async callError(message: string) {
        await this.unitA.throwError(message);
    }

    throwError(message: string): void {
        throw new NotImplementedError(message);
    }

    doNotCall(data: string): string {
        return data;
    }

    async increment2(n: number): Promise<number> {
        return await this.unitA.increment3(++n);
    }
}