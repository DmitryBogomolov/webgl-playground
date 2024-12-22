import { Runtime, takeCanvasSnapshot, downloadBlob } from 'lib';
import { hasUrlParam } from 'playground-utils/url';

if (!hasUrlParam('no-screenshot')) {
    patch();
}

function patch(): void {
    let runtime: Runtime | null = null;
    // @ts-ignore Take method closest to constructor.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { _getContext, _loseContext } = Runtime.prototype;
    // @ts-ignore Hook into constructor.
    Runtime.prototype._getContext = function (...args) {
        setTimeout(() => createButton(doScreenshot));
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        runtime = this;
        // @ts-ignore Call original method.
        return _getContext.apply(this, args);
    };
    // @ts-ignore Hook into destructor.
    Runtime.prototype._loseContext = function (...args) {
        runtime = null;
        return _loseContext.apply(this, args);
    };

    function doScreenshot(): void {
        if (!runtime) {
            return;
        }
        takeCanvasSnapshot(runtime)
            .then((blob) => {
                downloadBlob(blob, PLAYGROUND_NAME);
            })
            .catch((err) => {
                console.error('screenshot error', err);
            });
    }
}

function createButton(doScreenshot: () => void): void {
    const button = document.createElement('button');
    button.className = 'btn screenshot-button';
    button.textContent = 'screenshot';
    button.addEventListener('click', doScreenshot);
    document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!.appendChild(button);

    // @ts-ignore Global.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const playground = (window.playground = window.playground || {});
    Object.assign(playground, { screenshot: doScreenshot });
}
