import { BaseControl } from './base-control';
import { Observable } from '../observable';

export interface CheckControlOptions {
    readonly label: string;
    readonly checked: Observable<boolean>;
}

const NAME = 'check-control';
const LABEL_CLASS = `${NAME}-label`;
const INPUT_CLASS = `${NAME}-input`;

export class CheckControl extends BaseControl {
    private readonly _options: CheckControlOptions;
    private readonly _input: HTMLInputElement;

    constructor(container: HTMLElement, options: CheckControlOptions) {
        super(container);
        this._options = options;

        const label = document.createElement('div');
        label.className = LABEL_CLASS;
        label.textContent = options.label;

        this._input = document.createElement('input');
        this._input.type = 'check';
        this._input.className = INPUT_CLASS;
        this._input.addEventListener('change', this._handleInputChange);
        this._input.addEventListener('input', this._handleInputChange);

        this._options.checked.on(this._handleCheckedChange);

        this._updateInput();

        this._root.appendChild(label);
        this._root.appendChild(this._input);
    }

    private _updateInput(): void {
        this._input.checked = this._options.checked();
    }

    private readonly _handleCheckedChange = (): void => {
        this._updateInput();
    };

    private readonly _handleInputChange = (): void => {
        const checked = this._input.checked;
        if (checked !== this._options.checked()) {
            this._options.checked(checked);
        }
    };
}

const STYLES = [
    `.${NAME} { padding: 2px; }`,
    `.${LABEL_CLASS} { width: 100px; float: left; padding-left: 4px; }`,
    `.${INPUT_CLASS} { width: 120px; }`,
].join('\n');

Object.assign(CheckControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});
