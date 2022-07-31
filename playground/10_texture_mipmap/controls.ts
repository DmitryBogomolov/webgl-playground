export interface ControlsState {
    readonly animation: boolean;
    readonly xRotation: number;
    readonly yRotation: number;
}

export interface ControlsHandlers {
    readonly animation: (enabled: boolean) => void;
    readonly xRotation: (value: number) => void;
    readonly yRotation: (value: number) => void;
}

export function setupControls(state: ControlsState, handlers: ControlsHandlers): void {
    const animationInput = document.querySelector('.controls-panel .animation') as HTMLInputElement;
    const xRotationInput = document.querySelector('.controls-panel .x-rotation') as HTMLInputElement;
    const yRotationInput = document.querySelector('.controls-panel .y-rotation') as HTMLInputElement;

    animationInput.checked = state.animation;
    xRotationInput.value = String(state.xRotation);
    yRotationInput.value = String(state.yRotation);

    setHandler(animationInput, () => {
        const enabled = animationInput.checked;
        handlers.animation(enabled);
    });
    setHandler(xRotationInput, () => {
        const value = Number(xRotationInput.value);
        handlers.xRotation(value);
    });
    setHandler(yRotationInput, () => {
        const value = Number(yRotationInput.value);
        handlers.yRotation(value);
    });
}

function setHandler(input: HTMLInputElement, handler: () => void): void {
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
}
