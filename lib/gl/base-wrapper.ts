import { Logger } from '../utils/logger';

let nextId = 1;

export abstract class BaseWrapper {
    protected readonly _id: string;
    protected readonly _logger: Logger;

    constructor(tag?: string) {
        this._id = `${this.constructor.name}#${tag ? tag : nextId++}`;
        this._logger = new Logger(this._id);
    }

    id(): string {
        return this._id;
    }
}
