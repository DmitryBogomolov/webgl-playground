
function getOutputName(name) {
    return `${name}.bundle.js`;
}

function prettifyName(name) {
    return name.split(/_/g).slice(1).join(' ');
}

function log(...args) {
    console.log(...args);
}

module.exports = {
    getOutputName,
    prettifyName,
    log,
};
