import { ContextView } from './context-view';
import { Logger, generateId } from './utils';

export abstract class BaseWrapper<T extends WebGLObject> {
    protected readonly _id: string;
    protected readonly _logger: Logger;
    protected readonly _context: ContextView;
    protected readonly _handle: T;

    constructor(context: ContextView) {
        this._id = generateId(this.constructor.name);
        this._logger = new Logger(this._id);
        this._context = context;
        this._logger.log('init');
        this._handle = this._createHandle();
    }

    protected abstract _createHandle(): T;
    protected abstract _destroyHandle(handle: T): void;

    dispose(): void {
        this._logger.log('dispose');
        this._destroyHandle(this._handle);
    }

    id(): string {
        return this._id;
    }

    context(): ContextView {
        return this._context;
    }

    handle(): T {
        return this._handle;
    }
}
