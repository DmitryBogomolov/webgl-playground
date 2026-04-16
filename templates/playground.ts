import type { MainFuncInput, MainFuncOutput } from 'playground-utils/setup';
import { setup, renderOnChange, disposeAll } from 'playground-utils/setup';
import { hasUrlParam } from 'playground-utils/url';
import { tapRuntime, setConsoleCommand } from './tap';
import './screenshot-button';
// @ts-expect-error Actual path is provided in loader.
import { main } from '__PATH__';

let isActive = false;
let output: MainFuncOutput | null = null;

function init(): void {
    if (isActive) {
        return;
    }
    isActive = true;

    output = (main as unknown as (arg: MainFuncInput) => MainFuncOutput)({ setup, renderOnChange });
}

function dispose(): void {
    if (!isActive) {
        return;
    }
    isActive = false;

    if (Array.isArray(output)) {
        disposeAll(output);
    }
    output = null;
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
        button.textContent = 'O';
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
