import { BaseControl } from './base-control';
import { RangeControl, RangeControlOptions } from './range-control';
import { SelectControl, SelectControlOptions } from './select-control';
import { CheckControl, CheckControlOptions } from './check-control';

const NAME = 'controls-panel';

export class ControlsPanel extends BaseControl {
    private readonly _controls: BaseControl[] = [];

    constructor(container: HTMLElement) {
        super(container);
    }

    addRangeControl(options: RangeControlOptions): this {
        this._controls.push(new RangeControl(this._root, options));
        return this;
    }

    addSelectControl(options: SelectControlOptions): this {
        this._controls.push(new SelectControl(this._root, options));
        return this;
    }

    addCheckControl(options: CheckControlOptions): this {
        this._controls.push(new CheckControl(this._root, options));
        return this;
    }
}

const STYLES = `.${NAME} { position: absolute; top: 0; padding: 4px; }\n`;

Object.assign(ControlsPanel.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});
