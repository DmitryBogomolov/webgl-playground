import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';

export abstract class BaseWrapper {
    protected readonly _id: string;
    protected readonly _logger: Logger;

    constructor() {
        this._id = generateId(this.constructor.name);
        this._logger = new Logger(this._id);
    }

    id(): string {
        return this._id;
    }
}
