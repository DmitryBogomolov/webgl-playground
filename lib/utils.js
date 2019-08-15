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
