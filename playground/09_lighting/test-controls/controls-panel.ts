import { makeStyles } from './styles';
import { RangeControl, RangeControlOptions } from './range-control';

export class ControlsPanel {
    private readonly _root: HTMLDivElement;

    constructor(container: HTMLElement) {
        this._root = document.createElement('div');
        this._root.classList.add('controls-panel');
        container.appendChild(this._root);
        makeStyles('controls-panel', STYLES);
    }

    addRangeControl(options: RangeControlOptions): this {
        new RangeControl(this._root, options);
        return this;
    }
}

const STYLES = '.controls-panel { position: absolute; top: 0; padding: 4px; }\n';
