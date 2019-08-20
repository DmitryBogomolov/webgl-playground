import { generateId, log } from './utils';

export class BaseWrapper {
    constructor(context, params) {
        this._id = generateId(this._idPrefix);
        this._context = context;
        this._params = params;
        log(this._id, 'init');
        this._init();
    }

    dispose() {
        log(this._id, 'dispose');
        this._dispose();
    }

    id() {
        return this._id;
    }

    handle() {
        return this._handle;
    }
}
