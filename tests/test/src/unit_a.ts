import { Async } from "network-services";
import { UnitB } from "./unit_b.js";
import { NotImplementedError } from "./errors.js";

export class UnitA {
    private unitB: Async<UnitB>;
    constructor(unitB: Async<UnitB>) {
        this.unitB = unitB;
    }

    async increment1(n: number): Promise<number> {
        return await this.unitB.increment2(++n);
    }

    increment3(n: number): number {
        return ++n;
    }

    async callError(message: string) {
        await this.unitB.hasA.hasA_throwError(message);
    }

    throwError(message: string): void {
        throw new NotImplementedError(message);
    }
}
