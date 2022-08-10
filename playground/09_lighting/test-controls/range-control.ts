import { BaseControl } from './base-control';

export interface RangeControlOptions {
    readonly label: string;
    readonly min: number;
    readonly max: number;
    readonly value: number;
    readonly valueChanged: (value: number) => void;
}

const NAME = 'range-control';
const LABEL_CLASS = `${NAME}-label`;
const INPUT_CLASS = `${NAME}-input`;
const VALUE_CLASS = `${NAME}-value`;

export class RangeControl extends BaseControl {
    private readonly _options: RangeControlOptions;
    private readonly _input: HTMLInputElement;
    private readonly _text: HTMLDivElement;

    constructor(container: HTMLElement, options: RangeControlOptions) {
        super(container);
        this._options = options;

        const label = document.createElement('div');
        label.className = LABEL_CLASS;
        label.textContent = options.label;

        this._input = document.createElement('input');
        this._input.type = 'range';
        this._input.className = INPUT_CLASS;
        this._input.min = String(options.min);
        this._input.max = String(options.max);
        this._input.value = String(options.value);
        this._input.addEventListener('change', this._handleValueChange);
        this._input.addEventListener('input', this._handleValueChange);

        this._text = document.createElement('div');
        this._text.className = VALUE_CLASS;
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
    `.${NAME} { padding: 2px; }`,
    `.${LABEL_CLASS} { width: 100px; float: left; padding-left: 4px; }`,
    `.${INPUT_CLASS} { width: 120px; }`,
    `.${VALUE_CLASS} { width: 40px; padding-left: 4px; float: right; text-align: right; }`,
].join('\n');

Object.assign(RangeControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});

function formatText(value: number): string {
    if (value === 0) {
        return '0';
    }
    return `${value > 0 ? '+' : '-'}${Math.abs(value)}`;
}
