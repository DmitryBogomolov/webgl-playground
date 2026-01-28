import type { BaseObjectParams, Logger } from './base-object.types';
import { EventProxy } from '../common/event-emitter.types';
import { EventEmitter } from '../common/event-emitter';
import { formatStr, toArgStr } from '../utils/string-formatter';

let nextId = 1;

export abstract class BaseObject {
    protected readonly _id: string;
    protected readonly _logger: Logger;
    private readonly _disposed = new EventEmitter();

    constructor(params: BaseObjectParams) {
        const name = params.name || this.constructor.name;
        this._id = `${name}#${params.tag || String(nextId++)}`;
        this._logger = params.logger || stubLogger;
    }

    protected _dispose(): void {
        if (!this._disposed) {
            throw new Error('DEBUG: already disposed');
        }
        this._disposed.emit();
        this._disposed.clear();
        // @ts-ignore DEBUG
        this._disposed = null;
    }

    protected _logInfo(message: string): void {
        this._logger.info(this._id + '.' + message);
    }

    protected _logInfo_(message: string, ...args: unknown[]): void {
        const msg = args.length > 0 ? formatStr(message, ...args) : message;
        this._logger.info(this._id + '.' + msg);
    }

    protected _logMethod(method: string, args: unknown): void {
        this._logInfo(`${method}(${args})`);
    }

    protected _logMethodError(method: string, args: unknown, err: string): void {
        throw this._logError(`${method}(${toArgStr(args)}): ${err}`);
    }

    protected _logWarn(message: string): void {
        this._logger.warn(this._id + '.' + message);
    }

    protected _logWarn_(message: string, ...args: unknown[]): void {
        const msg = args.length > 0 ? formatStr(message, ...args) : message;
        this._logger.warn(this._id + '.' + msg);
    }

    protected _logError(message: string | Error): Error {
        if (message instanceof Error) {
            const err = new Error(message.message);
            err.name = message.name;
            err.stack = patchStack(message, message.message);
            this._logger.error(this._id + '.' + (err.stack || err.message));
            throw err;
        }
        this._logger.error(this._id + '.' + message);
        return new Error(this._id + '.' + message);
    }

    protected _logError_(message: string | Error, ...args: unknown[]): Error {
        if (message instanceof Error) {
            const err = new Error(message.message);
            err.name = message.name;
            err.stack = patchStack(message, message.message);
            this._logger.error(this._id + '.' + (err.stack || err.message));
            throw err;
        }
        const msg = args.length > 0 ? formatStr(message, ...args) : message;
        this._logger.error(this._id + '.' + msg);
        return new Error(this._id + '.' + msg);
    }

    toString(): string {
        return this._id;
    }

    logger(): Logger {
        return this._logger;
    }

    disposed(): EventProxy {
        return this._disposed.proxy();
    }
}

// TODO: Is it required? Should it be moved next to Logger?
function patchStack(err: Error, message: string): string | undefined {
    if (!err.stack) {
        return undefined;
    }
    const prefix = err.name + ': ';
    const k = err.stack.indexOf('\n');
    return prefix + message + err.stack.substring(k);
}

const stubLogger: Logger = {
    info() { /* empty */ },
    warn() { /* empty */ },
    error() { /* empty */ },
};
