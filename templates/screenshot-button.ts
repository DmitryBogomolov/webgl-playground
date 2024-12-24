import type { Runtime } from 'lib';
import { takeCanvasSnapshot, downloadBlob } from 'lib';
import { hasUrlParam } from 'playground-utils/url';
import { tapRuntime, setConsoleCommand } from './tap';

if (!hasUrlParam('no-screenshot')) {
    tapRuntime(setupButton);
}

function setupButton(runtime: Runtime): () => void {
    const button = document.createElement('button');
    button.className = 'btn screenshot-button';
    button.textContent = 'screenshot';
    button.addEventListener('click', doScreenshot);
    document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!.appendChild(button);
    setConsoleCommand('screenshot', doScreenshot);

    return () => {
        button.remove();
        setConsoleCommand('screenshot', () => 'N/A');
    };

    function doScreenshot(): void {
        takeCanvasSnapshot(runtime)
            .then((blob) => {
                downloadBlob(blob, PLAYGROUND_NAME);
            })
            .catch((err) => {
                console.error('screenshot error', err);
            });
    }
}
