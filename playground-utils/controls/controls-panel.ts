import { BaseControl } from './base-control';
import { RangeControl, RangeControlOptions } from './controls/range-control';
import { SelectControl, SelectControlOptions } from './controls/select-control';
import { CheckControl, CheckControlOptions } from './controls/check-control';

const NAME = 'controls-panel';
const STYLES = `.${NAME} { position: absolute; top: 0; padding: 4px; }\n`;

export class ControlsPanel extends BaseControl {
    private readonly _controls: BaseControl[] = [];

    constructor(container: HTMLElement) {
        super(container);
    }

    dispose(): void {
        super.dispose();
        for (const control of this._controls) {
            control.dispose();
        }
    }

    protected override _initName(): string {
        return NAME;
    }

    protected override _initStyles(): string {
        return STYLES;
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

