let nextId = 1;

export function generateId(name) {
    return `${name}#${nextId++}`;
}

export function log(section, message) {
    console.log(`${section}: ${message}`);
}

export function warn(section, message) {
    console.warn(`${section}: ${message}`);
}

export function error(section, err) {
    console.error(`${section}: ${err.message}`);
    throw err;
}
