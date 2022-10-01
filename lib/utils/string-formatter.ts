// eslint-disable-next-line @typescript-eslint/unbound-method
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
            if ((param as object).toString !== objectToString) {
                return (param as object).toString();
            }
            if (objectToString.call(param) === '[object Object]') {
                return JSON.stringify(param);
            }
        }
        return String(param);
    });
}
