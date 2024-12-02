// eslint-disable-next-line @typescript-eslint/unbound-method
const objectToString = Object.prototype.toString;

export function formatStr(format: string, ...params: unknown[]): string {
    return format.replace(/{(\d+)}/g, (_match, i: number) => toStr(params[i]));
}

export function toStr(obj: unknown): string {
    if (obj === null || obj === undefined) {
        return String(obj);
    }
    const type = typeof obj;
    if (type === 'symbol') {
        return String(obj);
    }
    if (Array.isArray(obj)) {
        return JSON.stringify(obj);
    }
    if (type === 'object') {
        if ((obj as object).toString !== objectToString) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            return (obj as object).toString();
        }
        if (objectToString.call(obj) === '[object Object]') {
            return JSON.stringify(obj);
        }
    }
    return String(obj);
}

export function toArgStr(obj: unknown): string {
    if (obj === null || obj === undefined) {
        return String(obj);
    }
    const type = typeof obj;
    if (type === 'symbol') {
        return String(obj);
    }
    if (Array.isArray(obj)) {
        return obj.join(', ');
    }
    if (type === 'object') {
        return Object.entries(obj as object)
            .filter(([_, val]) => val !== undefined)
            .map(([key, val]) => `${key}=${val}`)
            .join(', ');
    }
    return String(obj);
}
