import type { Logger, LoggerDriver } from './logger.types';
import { formatStr } from '../utils/string-formatter';

const DUMMY_DRIVER: LoggerDriver = {
    info() { /* empty */ },
    warn() { /* empty */ },
    error() { /* empty */ },
};

export class LoggerImpl implements Logger {
    private readonly _driver: LoggerDriver;
    private readonly _prefix: string;

    constructor(name: string, baseLogger?: Logger) {
        this._driver = baseLogger instanceof LoggerImpl ? baseLogger._driver : DUMMY_DRIVER;
        this._prefix = `[${name}]: `;
    }

    private _wrap(format: string, ...params: unknown[]): string {
        return this._prefix + formatStr(format, ...params);
    }

    driver(): LoggerDriver {
        return this._driver;
    }

    info(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        this._driver.info(message);
        return message;
    }

    warn(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        this._driver.warn(message);
        return message;
    }

    error(format: string | Error, ...params: unknown[]): Error {
        if (format instanceof Error) {
            const message = this._wrap(format.message);
            const err = new Error(message);
            err.name = format.name;
            err.stack = patchStack(format, message);
            this._driver.error(err.stack || message);
            throw err;
        }
        const message = this._wrap(format, ...params);
        this._driver.error(message);
        throw new Error(message);
    }
}

function patchStack(err: Error, message: string): string | undefined {
    if (!err.stack) {
        return undefined;
    }
    const prefix = err.name + ': ';
    const k = err.stack.indexOf('\n');
    return prefix + message + err.stack.substring(k);
}

class ConsoleLoggerDriver implements LoggerDriver {
    private _silent: boolean = false;

    info(message: string): void {
        this._silent || console.log(message);
    }

    warn(message: string): void {
        this._silent || console.warn(message);
    }

    error(message: string): void {
        this._silent || console.error(message);
    }

    setSilent(silent: boolean): void {
        this._silent = silent;
    }
}

export class RootLogger extends LoggerImpl {
    constructor(name: string) {
        const driver = new ConsoleLoggerDriver();
        const holder = new LoggerImpl('');
        // @ts-ignore Temporary object is used as driver container.
        holder._driver = driver;
        super(name, holder);
    }

    setSilent(silent: boolean): void {
        (this.driver() as ConsoleLoggerDriver).setSilent(silent);
    }
}
