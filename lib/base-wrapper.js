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

    handle() {
        return this._handle;
    }

    _matchState() {
        return this._context.getState(this._stateKey) === this._id;
    }

    _updateState(isEnabled) {
        this._context.setState(this._stateKey, isEnabled ? this._id : null);
    }
}
