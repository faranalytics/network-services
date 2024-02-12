import { Async, Service } from "network-services";
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

export interface IUnitB extends IsA {
    hasA: HasA;
    deletePaths(): void;
    undefinedMethod(data: string): string;
    echoString(data: string): string;
    echoStrings(str1: string, str2: string): Array<string>;
    callError(message: string): Promise<void>;
    throwError(message: string): void;
    doNotCall(data: string): string;
    increment2(n: number): Promise<number>;
    exit(): void;
}

export class UnitB extends IsA {

    public hasA: HasA = new HasA();
    private unitA: Async<UnitA>;
    private service: Service;

    constructor(UnitA: Async<UnitA>, service: Service) {
        super();
        this.unitA = UnitA;
        this.service = service;
    }

    deletePaths(): void {
        delete this.service.serviceApp?.paths;
    }

    echoString(data: string): string {
        return data;
    }

    echoStrings(str1: string, str2: string): Array<string> {
        return [str1, str2];
    }

    async callError(message: string): Promise<void> {
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