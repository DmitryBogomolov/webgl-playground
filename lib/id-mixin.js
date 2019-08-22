import { generateId, log, warn, error } from './utils';

const methods = {
    _setupId() {
        this._id = generateId(this._idPrefix);
    },

    id() {
        return this._id;
    },

    _log(...args) {
        return log(this._id, ...args);
    },

    _warn(...args) {
        return warn(this._id, ...args);  
    },

    _error(...args) {
        return error(this._id, ...args);
    },
};

export function idMixin(target) {
    Object.assign(target.prototype, methods);
}
