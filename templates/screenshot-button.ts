import { Runtime, takeCanvasSnapshot, downloadBlob } from 'lib';

// @ts-ignore Take method closest to constructor.
// eslint-disable-next-line @typescript-eslint/unbound-method
const { _getContext } = Runtime.prototype;
// @ts-ignore Hook into constructor.
Runtime.prototype._getContext = function (...args) {
    setTimeout(() => createButton(this));
    // @ts-ignore Call original method.
    return _getContext.apply(this, args);
};

function createButton(runtime: Runtime): void {
    const button = document.createElement('button');
    button.className = 'btn screenshot-button';
    button.textContent = 'screenshot';
    button.addEventListener('click', async () => {
        const blob = await takeCanvasSnapshot(runtime);
        downloadBlob(blob, PLAYGROUND_NAME);
    });
    runtime.canvas().parentElement!.appendChild(button);
}
