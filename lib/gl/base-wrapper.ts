import type { Logger } from '../utils/logger.types';
import { LoggerImpl } from '../utils/logger';

let nextId = 1;

export abstract class BaseWrapper {
    protected readonly _id: string;
    protected readonly _logger: Logger;

    constructor(
        baseLogger: Logger | null,
        tag?: string,
        loggerCtor?: new (id: string, baseLogger?: Logger) => Logger,
    ) {
        this._id = `${this.constructor.name}#${tag ? tag : nextId++}`;
        this._logger = new (loggerCtor || LoggerImpl)(this._id, baseLogger || undefined);
    }

    id(): string {
        return this._id;
    }

    logger(): Logger {
        return this._logger;
    }
}
