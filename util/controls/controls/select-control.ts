import { BaseControl } from '../base-control';
import { CONTROL_STYLE, LABEL_STYLE, INPUT_STYLE } from '../settings';
import { Observable } from '../../observable';

export interface SelectControlOptions {
    readonly label: string;
    readonly options: ReadonlyArray<string>;
    readonly selection: Observable<string>;
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
        options.options.forEach((value) => {
            const option = document.createElement('option');
            option.textContent = value;
            this._select.appendChild(option);
        });
        this._select.addEventListener('change', this._handleSelectionChange);
        this._options.selection.on(this._handleValueChange);

        this._updateSelectedIndex();

        this._root.appendChild(label);
        this._root.appendChild(this._select);
    }

    private _updateSelectedIndex(): void {
        this._select.selectedIndex = this._options.options.indexOf(this._options.selection());
    }

    private readonly _handleValueChange = (): void => {
        this._updateSelectedIndex();
    };

    private readonly _handleSelectionChange = (): void => {
        const value = this._options.options[this._select.selectedIndex];
        this._options.selection(value);
    };
}

const STYLES = [
    `.${NAME} ${CONTROL_STYLE}`,
    `.${LABEL_CLASS} ${LABEL_STYLE}`,
    `.${SELECT_CLASS} ${INPUT_STYLE}`,
].join('\n');

Object.assign(SelectControl.prototype, {
    _NAME: NAME,
    _STYLES: STYLES,
});
