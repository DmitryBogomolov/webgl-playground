import { makeStyles } from './styles';

export interface RangeControlOptions {
    readonly label: string;
    readonly min: number;
    readonly max: number;
    readonly value: number;
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
        label.classList.add('range-control-text');
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
        this._text.classList.add('range-control-value');
        this._updateText();

        this._root.appendChild(label);
        this._root.appendChild(this._input);
        this._root.appendChild(this._text);
        container.appendChild(this._root);

        makeStyles('range-control', STYLES);
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

function formatText(value: number): string {
    if (value === 0) {
        return '0';
    }
    return `${value > 0 ? '+' : '-'}${Math.abs(value)}`;
}

const STYLES = [
    '.range-control-root { padding: 2px; }',
    '.range-control-text { width: 100px; float: left; padding-left: 4px; }',
    '.range-control-value { width: 40px; padding-left: 4px; float: right; text-align: right; }',
].join('\n');
