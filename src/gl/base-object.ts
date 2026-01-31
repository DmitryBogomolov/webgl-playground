import type { BaseObjectParams, Logger } from './base-object.types';
import { EventProxy } from '../common/event-emitter.types';
import { EventEmitter } from '../common/event-emitter';
import { formatStr } from '../utils/string-formatter';

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

    protected _logInfo(message: string, ...args: unknown[]): void {
        const msg = formatStr(message, ...args);
        this._logger.info(`${this._id}: ${msg}`);
    }

    protected _logWarn(message: string, ...args: unknown[]): void {
        const msg = formatStr(message, ...args);
        this._logger.warn(`${this._id}: ${msg}`);
    }

    protected _logError(message: string | Error, ...args: unknown[]): Error {
        if (message instanceof Error) {
            const err = new Error(message.message);
            err.name = message.name;
            err.stack = patchStack(message, message.message);
            this._logger.error(`${this._id}: ${err.stack || err.message}`);
            throw err;
        }
        const err = `${this._id}: ${formatStr(message, ...args)}`;
        this._logger.error(err);
        return new Error(err);
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
