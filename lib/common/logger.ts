import type { Logger, LoggerDriver } from './logger.types';
import { formatStr } from '../utils/string-formatter';

const DUMMY_DRIVER: LoggerDriver = {
    log() { /* empty */ },
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

    log(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        this._driver.log(message);
        return message;
    }

    warn(format: string, ...params: unknown[]): string {
        const message = this._wrap(format, ...params);
        this._driver.warn(message);
        return message;
    }

    error(format: string, ...params: unknown[]): Error {
        const message = this._wrap(format, ...params);
        this._driver.error(message);
        throw new Error(message);
    }
}

class ConsoleLoggerDriver implements LoggerDriver {
    private _silent: boolean = false;

    log(message: string): void {
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
