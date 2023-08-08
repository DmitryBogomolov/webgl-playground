import type { BaseObjectParams } from './base-object.types';
import type { Logger } from '../common/logger.types';
import { EventProxy } from '../common/event-emitter.types';
import { EventEmitter } from '../common/event-emitter';
import { LoggerImpl } from '../common/logger';

let nextId = 1;

export abstract class BaseObject {
    protected readonly _id: string;
    protected readonly _logger: Logger;
    private readonly _disposed = new EventEmitter();

    constructor(params: BaseObjectParams) {
        const name = params.name || this.constructor.name;
        this._id = `${name}#${params.tag || String(nextId++)}`;
        this._logger = new LoggerImpl(`${this._id}`, params.logger);
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

    id(): string {
        return this._id;
    }

    logger(): Logger {
        return this._logger;
    }

    disposed(): EventProxy {
        return this._disposed.proxy();
    }
}
