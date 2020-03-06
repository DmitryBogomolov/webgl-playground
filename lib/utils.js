let nextId = 1;

export function generateId(/** @type {string} */name) {
    return `${name}#${nextId++}`;
}

let isLogSilenced = false;

export function logSilenced(/** @type {boolean} */state) {
    isLogSilenced = !!state;
}

export class Logger {
    constructor(/** @type {string} */name) {
        this._prefix = `[${name}]: `;
    }

    _wrap(message) {
        return this._prefix + message;
    }

    log(message, ...params) {
        isLogSilenced || console.log(this._wrap(message), ...params);
    }

    warn(message, ...params) {
        isLogSilenced || console.warn(this._wrap(message), ...params);
    }

    error(message, ...params) {
        isLogSilenced || console.error(this._wrap(message), ...params);
    }
}

export function raiseError(/** @type {Logger} */logger, message, ...params) {
    logger.error(message, ...params);
    throw new Error(message);
}

export function generateDefaultIndexes(/** @type {number} */vertexCount) {
    const data = [];
    data.length = vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
        data[i] = i;
    }
    return data;
}

export function unwrapHandle(/** @type {import('./base-wrapper').BaseWrapper | null} */wrapper) {
    return wrapper ? wrapper.handle() : null;
}

export function logContextCall(
    /** @type {import('./context').Context} */context, 
    /** @type {string} */funcName,
    /** @type {import('./base-wrapper').BaseWrapper | null} */wrapper
) {
    context._logger.log(`${funcName}(${wrapper ? wrapper.id() : null})`);
}
