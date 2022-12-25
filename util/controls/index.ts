import type { Runtime } from 'lib';
import { ControlsPanel } from './controls-panel';
import { RangeControlOptions } from './controls/range-control';
import { SelectControlOptions } from './controls/select-control';
import { CheckControlOptions } from './controls/check-control';
import { ScreenshotControl } from './screenshot-control';

export type SharedControlOptions = RangeControlOptions | SelectControlOptions | CheckControlOptions;

function isRange(options: SharedControlOptions): options is RangeControlOptions {
    return 'min' in options && 'max' in options;
}

function isSelect(options: SharedControlOptions): options is SelectControlOptions {
    return 'options' in options;
}

function isCheck(options: SharedControlOptions): options is CheckControlOptions {
    return 'checked' in options;
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
        if (isCheck(options)) {
            panel.addCheckControl(options);
        }
    });
    return panel;
}

export function createScreenshotControl(container: HTMLElement, runtime: Runtime): ScreenshotControl {
    return new ScreenshotControl(container, runtime);
}
