import { BaseControl } from './base-control';

export interface SelectControlOptions {
    readonly label: string;
    readonly values: ReadonlyArray<string>;
    readonly value: string;
    readonly valueChanged: (value: string) => void;
}

const NAME = 'select-control';
const LABEL_CLASS = `${NAME}-label`;
const SELECT_CLASS = `${NAME}-select`;

export class SelectControl extends BaseControl {
    private readonly _select: HTMLSelectElement;
    private readonly _options: SelectControlOptions;

    constructor(container: HTMLElement, options: SelectControlOptions) {
        super(container);
        this._options = options;

        const label = document.createElement('div');
        label.className = LABEL_CLASS;
        label.textContent = options.label;

        this._select = document.createElement('select');
        this._select.className = SELECT_CLASS;
        options.values.forEach((value) => {
            const option = document.createElement('option');
            option.textContent = value;
            this._select.appendChild(option);
        });
        this._select.selectedIndex = options.values.indexOf(options.value);
        this._select.addEventListener('change', this._handleSelectionChange);

        this._root.appendChild(label);
        this._root.appendChild(this._select);
    }

    private readonly _handleSelectionChange = (): void => {
        const value = this._options.values[this._select.selectedIndex];
        this._options.valueChanged(value);
    };
}

const STYLES = [
    `.${NAME} { padding: 2px; }`,
    `.${LABEL_CLASS} { width: 100px; float: left; padding-left: 4px; }`,
    `.${SELECT_CLASS} { width: 120px; }`,
].join('\n');

Object.assign(SelectControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});
