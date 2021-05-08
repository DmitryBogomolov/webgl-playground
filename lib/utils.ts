let nextId = 1;

export function generateId(name: string): string {
    return `${name}#${nextId++}`;
}

let isLogSilenced = false;

export function logSilenced(state: boolean): void {
    isLogSilenced = !!state;
}

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

export class Logger {
    private readonly _prefix: string;

    constructor(name: string) {
        this._prefix = `[${name}]: `;
    }

    private _wrap(format: string, ...params: unknown[]): string {
        return this._prefix + formatStr(format, ...params);
    }

    log(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.log(message);
        return message;
    }

    warn(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.warn(message);
        return message;
    }

    error(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.error(message);
        return message;
    }
}

export function raiseError(logger: Logger, format: string, ...params: any[]): Error {
    return new Error(logger.error(format, ...params));
}

export function generateDefaultIndexes(vertexCount: number): number[] {
    const data: number[] = [];
    data.length = vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
        data[i] = i;
    }
    return data;
}
