export interface IdentifierGenerator {
    getIdentifier(): string;
}

export class NumericIdentifierGenerator implements IdentifierGenerator {
    public id: number;
    constructor() {
        this.id = 0;
     }
    public getIdentifier(): string {
        return (++this.id).toString();
    }
}