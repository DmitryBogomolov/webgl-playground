let nextId = 1;

export function generateId(name: string): string {
    return `${name}#${nextId++}`;
}

let isLogSilenced = false;

export function logSilenced(state: boolean): void {
    isLogSilenced = !!state;
}

export class Logger {
    private readonly _prefix: string;

    constructor(name: string) {
        this._prefix = `[${name}]: `;
    }

    private _wrap(message: string): string {
        return this._prefix + message;
    }

    log(message: string, ...params: any[]): void {
        isLogSilenced || console.log(this._wrap(message), ...params);
    }

    warn(message: string, ...params: any[]): void {
        isLogSilenced || console.warn(this._wrap(message), ...params);
    }

    error(message: string, ...params: any[]): void {
        isLogSilenced || console.error(this._wrap(message), ...params);
    }
}

export function raiseError(logger: Logger, message: string, ...params: any[]): Error {
    logger.error(message, ...params);
    return new Error(message);
}

export function generateDefaultIndexes(vertexCount: number): number[] {
    const data: number[] = [];
    data.length = vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
        data[i] = i;
    }
    return data;
}
