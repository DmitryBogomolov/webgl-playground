import type { BaseObjectParams } from './base-object.types';
import type { Logger } from '../common/logger.types';
import { logger } from '../common/logger';

let nextId = 1;

export abstract class BaseObject {
    protected readonly _id: string;
    protected readonly _logger: Logger;

    constructor(params: BaseObjectParams) {
        const name = params.name || this.constructor.name;
        this._id = `${name}#${params.tag || String(nextId++)}`;
        this._logger = logger(params.logger ?? (() => { /* none */ }), { prefix: this._id });
    }

    toString(): string {
        return this._id;
    }

    get logger(): Logger {
        return this._logger;
    }
}
