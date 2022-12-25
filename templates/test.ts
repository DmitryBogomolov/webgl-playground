import { Runtime, takeCanvasSnapshot, downloadBlob } from 'lib';

// @ts-ignore
const { _getContext } = Runtime.prototype;
// @ts-ignore
Runtime.prototype._getContext = function () {
    setTimeout(() => patch(this));
    // @ts-ignore
    return _getContext.apply(this, arguments);
};

function patch(runtime: Runtime): void {
    const button = document.createElement('button');
    button.className = 'btn';
    button.style.position = 'absolute';
    button.style.right = '0';
    button.style.margin = '4px';
    button.style.opacity = '50%';
    button.textContent = 'screenshot';
    button.addEventListener('click', async () => {
        const blob = await takeCanvasSnapshot(runtime);
        downloadBlob(blob, PLAYGROUND_NAME);
    });
    runtime.canvas().parentElement!.appendChild(button);
}
