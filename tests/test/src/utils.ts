const aggregator: { [key: string]: Array<number> } = {};

export function memoryUsage() {
    const memoryUsage = process.memoryUsage();
    const result: { [s: string]: string; } = {};
    gc?.();
    for (const [key, value] of Object.entries<number>(<{ [s: string]: number; }><unknown>memoryUsage)) {
        const mb = Math.round(value / (1024 * 1024));
        if (!Object.hasOwn(aggregator, key)) {
            aggregator[key] = [];
        }
        aggregator[key].push(mb);
        result[key] = `${mb}MB`;
    }
    return result;
}

export function statistics() {
    const result: { [s: string]: string; } = {};
    for (const [key, value] of Object.entries(aggregator)) {
        const mean = Math.round(value.reduce((a, b) => a + b, 0) / value.length);
        const max = value.reduce((a, b) => a < b ? b : a, 0);
        const min = value.reduce((a, b) => a < b ? a : b, max);
        result[key] = `mean: ${mean}MB, min: ${min}MB, max: ${max}MB`;
    }
    return result;
}
