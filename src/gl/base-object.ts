import type { BaseObjectParams } from './base-object.types';
import type { Logger } from '../common/logger.types';
import { EventProxy } from '../common/event-emitter.types';
import { EventEmitter } from '../common/event-emitter';
import { logger } from '../common/logger';

let nextId = 1;

export abstract class BaseObject {
    protected readonly _id: string;
    protected readonly _logger: Logger;
    private readonly _disposed = new EventEmitter();

    constructor(params: BaseObjectParams) {
        const name = params.name || this.constructor.name;
        this._id = `${name}#${params.tag || String(nextId++)}`;
        this._logger = logger(params.logger ?? (() => { /* none */ }), { prefix: this._id });
    }

    protected _dispose(): void {
        if (!this._disposed) {
            throw new Error('DEBUG: already disposed');
        }
        this._disposed.emit();
        this._disposed.reset();
        // @ts-ignore DEBUG
        this._disposed = null;
    }

    protected _logInfo(message: string, ...args: unknown[]): void {
        this._logger.info(message, ...args);
    }

    protected _logWarn(message: string, ...args: unknown[]): void {
        this._logger.warn(message, ...args);
    }

    protected _logError(message: string | Error, ...args: unknown[]): Error {
        if (message instanceof Error) {
            this._logger.error(message);
            return message;
        }
        return new Error(this._logger.error(message, ...args));
    }

    toString(): string {
        return this._id;
    }

    get logger(): Logger {
        return this._logger;
    }

    get disposed(): EventProxy {
        return this._disposed.proxy;
    }
}
