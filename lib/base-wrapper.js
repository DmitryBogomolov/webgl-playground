import { Logger, generateId } from './utils';

/** @typedef {import('./context').Context} Context */

export class BaseWrapper {
    constructor(/** @type {Context} */context, params) {
        this._id = generateId(this.constructor.name);
        this._logger = new Logger(this._id);
        this._context = context;
        this._params = params;
        this._logger.log('init');
        this._init();
    }

    dispose() {
        this._logger.log('dispose');
        this._dispose();
    }

    id() {
        return this._id;
    }

    /** @returns {WebGLObject} */
    handle() {
        return this._handle;
    }
}
