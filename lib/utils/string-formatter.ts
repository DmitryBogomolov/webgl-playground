export function formatStr(format: string, ...params: unknown[]): string {
    return format.replace(/{(\d+)}/g, (_match, i: number) => {
        const param = params[i];
        const type = typeof param;
        if (type === 'object') {
            return JSON.stringify(param);
        } else if (type === 'symbol') {
            return (param as symbol).toString();
        } else {
            return param as string;
        }
    });
}
