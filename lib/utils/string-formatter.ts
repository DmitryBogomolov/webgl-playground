const objectToString = Object.prototype.toString;

export function formatStr(format: string, ...params: unknown[]): string {
    return format.replace(/{(\d+)}/g, (_match, i: number) => {
        const param = params[i];
        if (param === null || param === undefined) {
            return String(param);
        }
        const type = typeof param;
        if (type === 'symbol') {
            return String(param);
        }
        if (Array.isArray(param)) {
            return JSON.stringify(param);
        }
        if (type === 'object') {
            const obj = param as Object;
            if (obj.toString !== objectToString) {
                return obj.toString();
            }
            if (objectToString.call(obj) === '[object Object]') {
                return JSON.stringify(obj);
            }
        }
        return String(param);
    });
}
