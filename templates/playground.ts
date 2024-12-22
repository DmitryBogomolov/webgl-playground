import './screenshot-button';
// @ts-ignore Actual path is provided in loader.
import { main } from '__PATH__';

const doInit = main as () => void | (() => void);
let isActive = false;
let doDispose: (() => void) | undefined = undefined;

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
        doDispose = undefined;
    }
}

Object.assign(window, {
    INIT: init,
    DISPOSE: dispose,
});

init();
