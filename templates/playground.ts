import { hasUrlParam } from 'playground-utils/url';
import { tapRuntime, setConsoleCommand } from './tap';
import './screenshot-button';
// @ts-ignore Actual path is provided in loader.
import { main } from '__PATH__';

const doInit = main as () => (() => void);
let isActive = false;
let doDispose: (() => void) | null = null;

function init(): void {
    if (isActive) {
        return;
    }
    isActive = true;

    doDispose = doInit();
}

function dispose(): void {
    if (!isActive) {
        return;
    }
    isActive = false;

    doDispose!();
    doDispose = null;
}

function setupButton(): () => void {
    let button = document.querySelector<HTMLButtonElement>('.btn.reset-button');
    if (!button) {
        button = document.createElement('button');
        button.className = 'btn reset-button';
        button.addEventListener('click', doCommand);
    }
    document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!.appendChild(button);
    button.textContent = 'X';

    return () => {
        button!.textContent = 'O';
    };

    function doCommand(): void {
        if (isActive) {
            dispose();
        } else {
            init();
        }
    }
}

setConsoleCommand('init', init);
setConsoleCommand('dispose', dispose);

if (!hasUrlParam('no-reset')) {
    tapRuntime(setupButton);
}

init();
