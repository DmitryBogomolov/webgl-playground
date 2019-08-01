function createContext(container) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl');
    // TODO: Get extensions here.
    return ctx;
}

function init() {
    const container = document.querySelector('#container');
    const ctx = createContext(container);
}

function render() {
}

function runLoop() {
    function doLoop() {
        render();
        requestAnimationFrame(doLoop);
    }
    doLoop();
}

runLoop();
