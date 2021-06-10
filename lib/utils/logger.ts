import { formatStr } from './string-formatter';

let isLogSilenced = false;

export function logSilenced(state: boolean): void {
    isLogSilenced = !!state;
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

    error(format: string, ...params: unknown[]): Error {
        const message = this._wrap(format, ...params);
        isLogSilenced || console.error(message);
        throw new Error(message);
    }
}
