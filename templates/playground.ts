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

// @ts-ignore Global.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const playground = (window.playground = window.playground || {});
Object.assign(playground, { init, dispose });

init();
