import { formatStr } from './string-formatter';

let isLogSilenced = false;

export function logSilenced(state: boolean): void {
    isLogSilenced = !!state;
}

const DUMMY_LOGGER = {
    log() { return null as unknown as string; },
    warn() { return null as unknown as string; },
    error() { return null as unknown as Error; },
} as Pick<Logger, 'log' | 'warn' | 'error'> as Logger;


export class Logger {
    private readonly _baseLogger: Logger;
    private readonly _prefix: string;

    constructor(name: string, baseLogger?: Logger | null) {
        this._baseLogger = baseLogger || DUMMY_LOGGER;
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
