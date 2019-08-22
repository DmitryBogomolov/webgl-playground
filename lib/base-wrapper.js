import { idMixin } from './id-mixin';

export class BaseWrapper {
    constructor(context, params) {
        this._setupId();
        this._context = context;
        this._params = params;
        this._log('init');
        this._init();
    }

    dispose() {
        this._log('dispose');
        this._dispose();
    }

    handle() {
        return this._handle;
    }
}

idMixin(BaseWrapper);
