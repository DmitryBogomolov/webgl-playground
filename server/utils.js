const PLAYGROUND_ROUTE = '/playground';
const STATIC_ROUTE = '/static';

function getOutputName(name) {
    return `${name}.bundle.js`;
}

function getBundleRoute(name) {
    return `${STATIC_ROUTE}/${getOutputName(name)}`;
}

function prettifyName(name) {
    return name.split(/_/g).slice(1).join(' ');
}

function log(...args) {
    console.log(...args);
}

module.exports = {
    PLAYGROUND_ROUTE,
    STATIC_ROUTE,
    getOutputName,
    getBundleRoute,
    prettifyName,
    log,
};
