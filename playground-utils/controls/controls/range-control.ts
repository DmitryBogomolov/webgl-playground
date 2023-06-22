import { BaseControl } from '../base-control';
import { CONTROL_STYLE, LABEL_STYLE, INPUT_STYLE } from '../settings';
import { Observable } from '../../observable';

export interface RangeControlOptions {
    readonly label: string;
    readonly min: number;
    readonly max: number;
    readonly step?: number;
    readonly value: Observable<number>;
}

const NAME = 'range-control';
const LABEL_CLASS = `${NAME}-label`;
const INPUT_CLASS = `${NAME}-input`;
const VALUE_CLASS = `${NAME}-value`;

export class RangeControl extends BaseControl {
    private readonly _options: RangeControlOptions;
    private readonly _input: HTMLInputElement;
    private readonly _text: HTMLDivElement;
    private readonly _formatText: (value: number) => string;

    constructor(container: HTMLElement, options: RangeControlOptions) {
        super(container);
        this._options = options;
        this._formatText = options.min * options.max < 0 ? formatTextSigned : formatText;

        const label = document.createElement('div');
        label.className = LABEL_CLASS;
        label.textContent = options.label;

        this._input = document.createElement('input');
        this._input.type = 'range';
        this._input.className = INPUT_CLASS;
        this._input.min = String(options.min);
        this._input.max = String(options.max);
        if (options.step !== undefined) {
            this._input.step = String(options.step);
        }
        this._input.addEventListener('change', this._handleInputChange);
        this._input.addEventListener('input', this._handleInputChange);

        this._text = document.createElement('div');
        this._text.className = VALUE_CLASS;

        this._options.value.on(this._handleValueChange);

        this._updateInput();
        this._updateText();

        this._root.appendChild(label);
        this._root.appendChild(this._input);
        this._root.appendChild(this._text);
    }

    private _updateInput(): void {
        this._input.value = String(this._options.value());
    }

    private _updateText(): void {
        this._text.textContent = this._formatText(this._options.value());
    }

    private readonly _handleValueChange = (): void => {
        this._updateInput();
        this._updateText();
    };

    private readonly _handleInputChange = (): void => {
        const value = Number(this._input.value);
        this._options.value(value);
    };
}

const STYLES = [
    `.${NAME} ${CONTROL_STYLE}`,
    `.${LABEL_CLASS} ${LABEL_STYLE}`,
    `.${INPUT_CLASS} ${INPUT_STYLE}`,
    `.${VALUE_CLASS} { width: 40px; padding-left: 4px; float: right; text-align: right; }`,
].join('\n');

Object.assign(RangeControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});

function formatText(value: number): string {
    return `${value}`;
}

function formatTextSigned(value: number): string {
    if (value === 0) {
        return '0';
    }
    return `${value > 0 ? '+' : '-'}${Math.abs(value)}`;
}
