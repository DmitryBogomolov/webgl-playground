export interface RangeControlOptions {
    readonly label: string;
    readonly min: number;
    readonly max: number;
    readonly value: number;
    readonly format: (value: number) => string;
    readonly valueChanged: (value: number) => void;
}

export class RangeControl {
    private readonly _options: RangeControlOptions;
    private readonly _root: HTMLDivElement;
    private readonly _input: HTMLInputElement;
    private readonly _text: HTMLDivElement;

    constructor(container: HTMLElement, options: RangeControlOptions) {
        this._options = options;

        this._root = document.createElement('div');
        this._root.classList.add('range-control-root');

        const label = document.createElement('div');
        label.classList.add('range-control-label');
        label.textContent = options.label;

        this._input = document.createElement('input');
        this._input.type = 'range';
        this._input.classList.add('range-control-input');
        this._input.min = String(options.min);
        this._input.max = String(options.max);
        this._input.value = String(options.value);
        this._input.addEventListener('change', this._handleValueChange);
        this._input.addEventListener('input', this._handleValueChange);

        this._text = document.createElement('div');
        this._text.classList.add('range-control-text');
        this._updateText();

        this._root.appendChild(label);
        this._root.appendChild(this._input);
        this._root.appendChild(this._text);
        container.appendChild(this._root);

        makeStyles();
    }

    private _updateText(): void {
        this._text.textContent = this._options.format(Number(this._input.value));
    }

    private readonly _handleValueChange = (): void => {
        this._updateText();
        const value = Number(this._input.value);
        this._options.valueChanged(value);
    };
}

const ROOT_STYLE = '.range-control-group { padding: 2px; }';
const TEXT_STYLE = '.range-control-text { width: 100px; float: left; padding-left: 4px; }';
const VALUE_STYLE = '.range-control-value { width: 30px; padding-left: 4px; float: right; text-align: right; }'

function makeStyles(): void {
    const style = document.createElement('style');
    const sheet = style.sheet!;
    sheet.insertRule(ROOT_STYLE);
    sheet.insertRule(TEXT_STYLE);
    sheet.insertRule(VALUE_STYLE);
    document.querySelector('head')!.appendChild(style);
}
