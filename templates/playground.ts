import './screenshot-button';
// @ts-ignore Actual path is provided in loader.
import { main } from '__PATH__';

const doInit = main as () => void | (() => void);
let isActive = false;
let doDispose: (() => void) | null = null;

function init(): void {
    if (isActive) {
        return;
    }
    isActive = true;

    const ret = doInit();
    if (ret) {
        doDispose = ret;
    }
}

function dispose(): void {
    if (!isActive) {
        return;
    }
    isActive = false;

    if (doDispose) {
        doDispose();
        doDispose = null;
    }
}

// @ts-ignore Global.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const playground = (window.playground = window.playground || {});
Object.assign(playground, { init, dispose });

init();
