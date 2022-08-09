import { BaseControl } from './base-control';

export interface RangeControlOptions {
    readonly label: string;
    readonly min: number;
    readonly max: number;
    readonly value: number;
    readonly valueChanged: (value: number) => void;
}

export class RangeControl extends BaseControl {
    private readonly _options: RangeControlOptions;
    private readonly _input: HTMLInputElement;
    private readonly _text: HTMLDivElement;

    constructor(container: HTMLElement, options: RangeControlOptions) {
        super(container);
        this._options = options;

        const label = document.createElement('div');
        label.className = 'range-control-text';
        label.textContent = options.label;

        this._input = document.createElement('input');
        this._input.type = 'range';
        this._input.className = 'range-control-input';
        this._input.min = String(options.min);
        this._input.max = String(options.max);
        this._input.value = String(options.value);
        this._input.addEventListener('change', this._handleValueChange);
        this._input.addEventListener('input', this._handleValueChange);

        this._text = document.createElement('div');
        this._text.className = 'range-control-value';
        this._updateText();

        this._root.appendChild(label);
        this._root.appendChild(this._input);
        this._root.appendChild(this._text);
    }

    private _updateText(): void {
        this._text.textContent = formatText(Number(this._input.value));
    }

    private readonly _handleValueChange = (): void => {
        this._updateText();
        const value = Number(this._input.value);
        this._options.valueChanged(value);
    };
}

const STYLES = [
    '.range-control-root { padding: 2px; }',
    '.range-control-text { width: 100px; float: left; padding-left: 4px; }',
    '.range-control-value { width: 40px; padding-left: 4px; float: right; text-align: right; }',
].join('\n');

// @ts-ignore 2445,2540
RangeControl.prototype._NAME = 'range-control';
// @ts-ignore 2445,2540
RangeControl.prototype._STYLES = STYLES;
// @ts-ignore 2445,2540
RangeControl.prototype._CLASS = 'range-control-root';


function formatText(value: number): string {
    if (value === 0) {
        return '0';
    }
    return `${value > 0 ? '+' : '-'}${Math.abs(value)}`;
}
