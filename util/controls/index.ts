import { ControlsPanel } from './controls-panel';
import { RangeControlOptions } from './range-control';
import { SelectControlOptions } from './select-control';

export type SharedControlOptions = RangeControlOptions | SelectControlOptions;

function isRange(options: SharedControlOptions): options is RangeControlOptions {
    return 'min' in options && 'max' in options;
}

function isSelect(options: SharedControlOptions): options is SelectControlOptions {
    return 'options' in options;
}

export function createControls(
    container: HTMLElement, controls: ReadonlyArray<SharedControlOptions>,
): ControlsPanel {
    const panel = new ControlsPanel(container);
    controls.forEach((options) => {
        if (isRange(options)) {
            panel.addRangeControl(options);
        }
        if (isSelect(options)) {
            panel.addSelectControl(options);
        }
    });
    return panel;
}
