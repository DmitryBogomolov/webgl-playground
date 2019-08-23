let nextId = 1;

export function generateId(name) {
    return `${name}#${nextId++}`;
}

let isLogSilenced = false;

export function logSilenced(state) {
    isLogSilenced = state;
}

export function log(section, message) {
    isLogSilenced || console.log(`${section}: ${message}`);
}

export function warn(section, message) {
    isLogSilenced || console.warn(`${section}: ${message}`);
}

export function error(section, err) {
    isLogSilenced || console.error(`${section}: ${err.message}`);
    throw err;
}

export function generateDefaultIndexes(vertexCount) {
    const data = new Array(vertexCount);
    for (let i = 0; i < vertexCount; ++i) {
        data[i] = i;
    }
    return data;
}

export function unwrapHandle(wrapper) {
    return wrapper ? wrapper.handle() : null;
}

export function logCall(context, funcName, wrapper) {
    context._log(`${funcName}(${wrapper ? wrapper.id() : null})`);
}

export function makeRect([xMin, yMin, xMax, yMax] = [-1, -1, +1, +1]) {
    const vertices = [
        [xMin, yMin],
        [xMax, yMin],
        [xMax, yMax],
        [xMin, yMax],
    ];
    const indexes = [0, 1, 2, 2, 3, 0];
    return { vertices, indexes };
}
