import { BaseControl } from './base-control';
import { RangeControl, RangeControlOptions } from './range-control';

export class ControlsPanel extends BaseControl {
    constructor(container: HTMLElement) {
        super(container);
    }

    addRangeControl(options: RangeControlOptions): this {
        new RangeControl(this._root, options);
        return this;
    }
}

const STYLES = '.controls-panel { position: absolute; top: 0; padding: 4px; }\n';

// @ts-ignore 2445,2540
ControlsPanel.prototype._NAME = 'controls-panel';
// @ts-ignore 2445,2540
ControlsPanel.prototype._STYLES = STYLES;
// @ts-ignore 2445,2540
ControlsPanel.prototype._CLASS = 'controls-panel';

