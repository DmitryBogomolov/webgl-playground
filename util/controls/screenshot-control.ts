import type { Runtime } from 'lib';
import { takeCanvasSnapshot, downloadBlob } from 'lib';
import { BaseControl } from './base-control';

const NAME = 'screenshot-control';
const BUTTON_CLASS = `${NAME}-button`;

export class ScreenshotControl extends BaseControl {
    private readonly _runtime: Runtime;

    constructor(container: HTMLElement, runtime: Runtime) {
        super(container);
        this._runtime = runtime;

        const button = document.createElement('button');
        button.className = `btn ${BUTTON_CLASS}`;
        button.textContent = 'screenshot';
        button.addEventListener('click', this._handleClick);
        this._root.appendChild(button);
    }

    private readonly _handleClick = async (): Promise<void> => {
        const blob = await takeCanvasSnapshot(this._runtime);
        downloadBlob(blob, 'test');
    };
}

const STYLES = [
    `.${NAME} { position: absolute; top: 0; right: 0; padding: 4px; }`,
    `.${BUTTON_CLASS} { opacity: 50%; }`,
].join('\n');

Object.assign(ScreenshotControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});
