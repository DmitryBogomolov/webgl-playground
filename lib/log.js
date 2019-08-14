export function log(msg) {
    console.log(msg);
}

export function panic(err) {
    console.error(err);
    throw new Error(err);
}
